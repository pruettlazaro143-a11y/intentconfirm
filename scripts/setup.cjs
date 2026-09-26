/* Local-only secret input; no key is sent until the user runs an analysis. */
const fs=require('node:fs'),path=require('node:path'),readline=require('node:readline');
const file=path.join(__dirname,'..','.env');
(async()=>{
 const rl=readline.createInterface({input:process.stdin,output:process.stdout});
 const ask=q=>new Promise(r=>rl.question(q,r));
 if(fs.existsSync(file)){const ok=await ask('已有 .env。重新设置 DeepSeek 密钥？输入 yes 继续：');if(ok!=='yes'){rl.close();return;}}
 if(!process.stdin.isTTY){rl.close();console.error('请在本机交互终端运行 npm run setup，或复制 .env.example 为 .env 后编辑。');process.exitCode=1;return;}
 console.log('粘贴 DeepSeek API Key（输入将隐藏，只保存到本项目 .env）：');
 let muted=true;const original=rl._writeToOutput.bind(rl);rl._writeToOutput=s=>{if(!muted)original(s);};
 const key=(await ask('')).trim();muted=false;console.log('');
 if(key.length<12||/\s/.test(key)){rl.close();console.error('密钥格式不正确，未保存。');process.exitCode=1;return;}
 const model=(await ask('模型名 [deepseek-flash]，直接回车使用默认：')).trim()||'deepseek-flash';rl.close();
 if(!/^[a-zA-Z0-9._-]{1,80}$/.test(model)){console.error('模型名格式不正确，未保存。');process.exitCode=1;return;}
 fs.writeFileSync(file,`DEEPSEEK_API_KEY=${key}\nDEEPSEEK_MODEL=${model}\nPORT=4173\n`,{mode:0o600});fs.chmodSync(file,0o600);
 console.log('本地配置已保存。运行 npm start，然后打开 http://127.0.0.1:4173 。');
})().catch(()=>{console.error('配置未完成，请检查本地文件权限。');process.exitCode=1;});
