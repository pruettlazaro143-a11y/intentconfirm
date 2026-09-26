const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {loadConfig}=require('./server/config.cjs'),{analyze}=require('./server/deepseek.cjs');
const ROOT=__dirname,types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};
function createServer(config,analyzer=analyze){
 let inFlight=0,times=[];
 return http.createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const host=req.headers.host||'';
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host))return json(403,{error:'仅允许本机访问。'});
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://'+host).pathname);
   if(pathname==='/api/status'&&req.method==='GET')return json(200,{configured:!!config.key,provider:'DeepSeek',model:config.model});
   if(pathname==='/api/clarify'){
    if(req.method!=='POST')return json(405,{error:'Method not allowed'});
    if(req.headers.origin!=='http://'+host||req.headers['x-intentconfirm']!=='1'||!req.headers['content-type']?.startsWith('application/json'))return json(403,{error:'请求来源不符合本地应用要求。'});
    if(!config.key)return json(503,{error:'尚未配置 API Key。请在项目目录运行 npm run setup，然后重启服务。'});
    const now=Date.now();times=times.filter(t=>now-t<60000);
    if(times.length>=20||inFlight>=2)return json(429,{error:'请求过于频繁，请等待当前分析完成。'});
    let chunks=[],size=0;
    for await(const chunk of req){size+=chunk.length;if(size>100000)return json(413,{error:'需求记录过长，请缩小任务范围。'});chunks.push(chunk);}
    let payload;try{payload=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{return json(400,{error:'请求 JSON 不正确。'});}
    times.push(now);inFlight++;
    try{return json(200,await analyzer(payload,config));}catch(e){return json(e.status||400,{error:e.message||'分析失败，原需求已保留。'});}finally{inFlight--;}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json(405,{error:'Method not allowed'});
   // Allowlist public assets only; never serve .env, source patches, server code or docs.
   const allowed=pathname==='/'||pathname==='/index.html'||/^\/src\/[a-z0-9-]+\.(js|css)$/.test(pathname);
   if(!allowed)return json(404,{error:'Not found'});
   const file=path.join(ROOT,pathname==='/'?'index.html':pathname.slice(1));
   fs.readFile(file,(e,bytes)=>{if(e)return json(404,{error:'Not found'});res.writeHead(200,{'Content-Type':types[path.extname(file)],'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'});res.end(req.method==='HEAD'?'':bytes);});
  }catch{return json(400,{error:'请求无法处理。'});}
 });
}
if(require.main===module){try{const config=loadConfig(ROOT);const s=createServer(config);s.on('error',e=>{console.error(e.code==='EADDRINUSE'?'4173 端口已被占用，请关闭旧服务或在 .env 修改 PORT。':'服务启动失败：'+e.code);process.exitCode=1;});s.listen(config.port,'127.0.0.1',()=>{console.log('IntentConfirm: http://127.0.0.1:'+config.port);console.log(config.key?'DeepSeek 密钥已配置（尚未验证真实调用）。':'DeepSeek 尚未配置：运行 npm run setup；规则模式仍可使用。');});}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={createServer};
