/* Build a fresh share archive from public project files; never include .env. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),parent=path.dirname(root),name=path.basename(root);
const files=[];
function walk(rel){const full=path.join(root,rel),base=path.basename(rel);if(base==='.env'||base.startsWith('.env.')&&base!=='.env.example'||['node_modules','.git','.DS_Store','__pycache__'].includes(base)||/\.zip$/i.test(base))return;const stat=fs.lstatSync(full);if(stat.isSymbolicLink())return;if(stat.isDirectory()){for(const n of fs.readdirSync(full))walk(path.join(rel,n));}else if(stat.isFile()){const p=path.join(name,rel);if(/[\r\n]/.test(p))throw Error('文件名不能包含换行。');files.push(p);}}
let tmp;
try{
 for(const entry of ['.bob/skills/intentconfirm','.github','examples','START_HERE.md','src','server','scripts','tests','docs','bob_sessions','index.html','server.cjs','package.json','README.md','AGENTS.md','LICENSE','.env.example','.gitignore'])if(fs.existsSync(path.join(root,entry)))walk(entry);
 tmp=fs.mkdtempSync(path.join(os.tmpdir(),'intentconfirm-pack-'));const archive=path.join(tmp,'share.zip');
 const r=spawnSync('zip',['-q',archive,'-@'],{cwd:parent,input:files.join('\n')+'\n',encoding:'utf8'});
 if(r.error||r.status!==0)throw Error('需要系统 zip 命令。macOS 通常自带；请安装后重试。');
 const output=path.join(parent,'intentconfirm-share.zip');fs.copyFileSync(archive,output);console.log('已生成分享包（不含 .env）：'+output);
}catch(e){console.error(e.message);process.exitCode=1;}finally{if(tmp)fs.rmSync(tmp,{recursive:true,force:true});}
