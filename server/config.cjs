const fs=require('node:fs'),path=require('node:path');
function loadConfig(root,env=process.env){
 const vars={};const file=path.join(root,'.env');
 if(fs.existsSync(file)){for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const m=line.match(/^\s*(DEEPSEEK_API_KEY|DEEPSEEK_MODEL|PORT)\s*=\s*(.*?)\s*$/);if(m){let v=m[2];if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);vars[m[1]]=v;}}}
 const key=env.DEEPSEEK_API_KEY||vars.DEEPSEEK_API_KEY||'',model=env.DEEPSEEK_MODEL||vars.DEEPSEEK_MODEL||'deepseek-flash';
 const port=Number(env.PORT||vars.PORT||4173);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('PORT 必须是 1024–65535 的整数。');
 if(!/^[a-zA-Z0-9._-]+$/.test(model)||model.length>80)throw Error('DEEPSEEK_MODEL 格式不正确。');
 return {key,model,port};
}
module.exports={loadConfig};
