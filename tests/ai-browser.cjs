/* Real Chromium UI, synthetic API responses. This is NOT a live DeepSeek test. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {createServer}=require('../server.cjs');
const {ApiError}=require('../server/deepseek.cjs');
const S=require('../src/ai-session.js');
const question={id:'q_goal',title:'最想完成什么？',why:'决定核心功能',required:true,options:[{label:'记录每日练习',consequence:'优先记录和回顾'},{label:'获得口语反馈',consequence:'优先提交练习并查看建议'}],dependsOn:['intent']};
let calls=0,fail=false;
const server=createServer({key:'test-fixture-not-a-real-key',model:'test-fixture'},async input=>{
 calls++;if(fail)throw new ApiError('模拟接口故障：已有需求保留。',502);
 const analysis={summary:'帮助自己练习的工具，无需登录。',candidates:input.candidates.length?[]:[{id:'c_login',label:'限制',value:'不要登录',quote:'不要登录',sourceRef:'intent',dependsOn:['intent']}],questions:input.questions.length?[]:[question],readiness:{ready:input.questions.length>0,reason:input.questions.length?'模拟复核完成':'需要补充核心目标'},warnings:[]};
 return {analysis:S.validateAnalysis(analysis,input),meta:{model:'test-fixture',requestId:'fixture-'+calls,receivedAt:new Date().toISOString()}};
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu']});
 const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 const state=()=>p.evaluate(()=>JSON.parse(localStorage.getItem('intentconfirm-deepseek-v1')));
 async function settle(){await p.waitForFunction(()=>!document.querySelector('#cancel'));}
 async function review(){await p.locator('[data-step="2"]').click();}
 async function edit(){await p.locator('[data-ai-edit="q_goal"]').first().click();}
 async function analyze(){await p.locator('#ai-analyze').click();await settle();}
 try{
  await p.goto(base);await p.locator('#ai-start button.primary:enabled').waitFor();
  await p.locator('#ai-intent').fill('给自己用的练习工具，不要登录');await p.locator('#ai-start button.primary').click();await settle();
  assert.equal(calls,1);assert.ok(await p.locator('[data-ai-fact="c_login"]').count());
  await p.locator('[data-ai-fact="c_login"][data-decision="accepted"]').click();await p.locator('[data-ai-answer="q_goal"][data-option="0"]').click();assert.equal(calls,1);
  await review();assert.equal(await p.locator('#ai-confirm').isDisabled(),true);await p.locator('#ai-back').click();await analyze();assert.equal(calls,2);
  await review();await p.locator('#ai-confirm').click();assert.equal((await state()).activeRevision,1);
  const download=p.waitForEvent('download');await p.locator('[data-ai-export="json"]').click();const exported=JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));assert.equal(exported.model.model,'test-fixture');assert.equal(exported.candidates[0].status,'accepted');
  await edit();await p.locator('[data-ai-answer="q_goal"][data-special="pending"]').click();await analyze();await review();assert.equal(await p.locator('#ai-confirm').isDisabled(),true);assert.equal((await state()).history.length,1);
  await edit();await p.locator('[data-ai-answer="q_goal"][data-option="1"]').click();fail=true;await analyze();assert.ok((await p.locator('[role="alert"]').innerText()).includes('模拟接口故障'));assert.equal((await state()).answers.q_goal.value,'获得口语反馈');
  fail=false;await p.locator('#retry').click();await settle();await review();await p.locator('#ai-confirm').click();assert.equal((await state()).activeRevision,2);
  await p.locator('#engine-select').selectOption('rules');assert.ok(await p.locator('#intent').count());await p.locator('#engine-select').selectOption('deepseek');assert.equal((await state()).activeRevision,2);
  await p.reload();await p.locator('.mode').filter({hasText:'已有模型结果'}).waitFor();assert.equal((await state()).activeRevision,2);
  await p.setViewportSize({width:390,height:844});
  for(const step of [0,1,2]){await p.locator('[data-step="'+step+'"]').click();assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'mobile overflow step '+step);}
  assert.deepEqual(errors,[]);
  console.log('PASS simulated API + real Chromium: explicit calls, evidence decisions, stale-readiness gate, unknown gate, failures preserve answers, immutable versions, export, reload, engine switching, mobile layout; no uncaught errors');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
