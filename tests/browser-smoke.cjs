/* Optional dev-only browser regression test: install Playwright + Chromium separately.
   Supports CHROMIUM_EXECUTABLE, PLAYWRIGHT_MODULE and TEST_FONT_CSS overrides. */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs','screenshots');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--disable-gpu']});
 const errors=[],p=await browser.newPage({viewport:{width:1440,height:1000}});
 p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.accept());
 async function fonts(){if(process.env.TEST_FONT_CSS){const csspath=process.env.TEST_FONT_CSS;const css=fs.readFileSync(csspath,'utf8').replace(/url\(\.\//g,'url('+pathToFileURL(path.dirname(csspath)).href+'/');await p.addStyleTag({content:css+'\nbody{font-family:"Noto Sans SC",sans-serif}'});await p.evaluate(()=>document.fonts.ready);}}
 async function start(text,scenario='website') {await p.goto(pathToFileURL(path.join(root,'index.html')).href);await p.evaluate(()=>localStorage.clear());await p.reload();await fonts();await p.locator('#intent').fill(text);await p.locator('[data-scenario="'+scenario+'"]').click();await p.locator('#intent-form button[type="submit"]').click();}
 async function edit(id,value,kind){await p.locator('[data-edit="'+id+'"]').first().click();const q=p.locator('#question-'+id);await q.waitFor();if(kind==='custom'){await q.locator('input').fill(value);await q.locator('form button').click();}else if(kind==='unknown'){await q.locator('[data-kind="unknown"]').click();}else{await q.locator('[data-answer]').filter({hasText:value}).first().click();}}
 async function stored(){return p.evaluate(()=>JSON.parse(localStorage.getItem('intentconfirm-v01')));}
 async function noOverflow(label){const dims=await p.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth}));assert.ok(dims.sw<=dims.w+1,label+JSON.stringify(dims));}
 async function exportFile(type){const download=p.waitForEvent('download');await p.locator('[data-export="'+type+'"]').click();const d=await download;return fs.readFileSync(await d.path(),'utf8');}
 try{
 await p.goto(pathToFileURL(path.join(root,'index.html')).href);await fonts();await p.screenshot({path:path.join(out,'01-entry-desktop.png'),fullPage:true});await noOverflow('desktop entry');
 await start('给自己用的 AI 雅思网站，不要登录，记录每日练习，预算3000元');
 assert.ok((await p.locator('.facts-panel').innerText()).includes('不要登录'));
 assert.ok(!(await p.locator('.facts-panel').innerText()).includes('支付'));
 const facts=(await stored()).facts;
 for(const f of facts)await p.locator('[data-fact="'+f.id+'"]').first().click();
 await edit('goal','学习与练习');await edit('delivery','可点击原型');await edit('ai_role','AI 个性化推荐');await edit('success','用户能独立完成核心操作');
 await p.locator('[data-step="2"]').click();assert.equal(await p.locator('#confirm').isDisabled(),false);
 await p.locator('#confirm').click();assert.equal((await stored()).activeRevision,1);
 const json=JSON.parse(await exportFile('json')),md=await exportFile('md');
 assert.ok(json.requirements.some(r=>r.field==='ai_role'&&r.value==='AI 个性化推荐'));
 assert.ok(json.requirements.some(r=>r.field==='exclude'&&r.value==='不要登录'&&r.evidence==='不要登录'));
 assert.ok(md.includes('AI 个性化推荐'));assert.ok(md.includes('预算3000元'));
 await p.evaluate(()=>window.scrollTo(0,0));await p.locator('#toast').waitFor({state:'hidden'});await p.screenshot({path:path.join(out,'02-confirmed-desktop.png'),fullPage:true});
 await edit('goal','展示作品或业务');let s=await stored();assert.equal(s.answers.detail.status,'stale');assert.equal(s.answers.audience.status,'confirmed');assert.equal(s.history.length,1);
 await edit('goal','学习与练习');await edit('detail','口语练习与反馈');await edit('speaking_input','实时麦克风录音');
 await edit('detail','作文练习与反馈');s=await stored();assert.equal(s.answers.speaking_input.status,'stale');assert.equal(await p.locator('[data-edit="speaking_input"]').count(),0);
 await edit('ai_role','暂不确定','unknown');await p.locator('[data-step="2"]').click();assert.equal(await p.locator('#confirm').isDisabled(),true);
 assert.ok((await p.locator('main').innerText()).includes('你提到了 AI'));
 await edit('ai_role','AI 生成或批改内容');await edit('success','用户能独立完成核心操作');await p.locator('[data-step="2"]').click();await p.locator('#confirm').click();assert.equal((await stored()).activeRevision,2);
 const history=await stored();assert.equal(history.history[0].specification.requirements.find(r=>r.field==='detail').value,'记录每日练习');
 await p.reload();assert.equal((await stored()).activeRevision,2);
 console.log('PASS desktop: evidence, original restriction, editable confirmed answer, AI uncertainty guard, context invalidation, immutable versions, reload, Markdown+JSON downloads');
 await start('完全陌生的一项任务','general');assert.ok((await p.locator('.facts-panel').innerText()).includes('无法可靠抽取'));
 await edit('goal','<img src=x onerror=alert(1)>','custom');assert.equal(await p.locator('img').count(),0);
 await edit('goal','暂不确定','unknown');await p.locator('#next').click();assert.ok(await p.locator('#question-delivery').count());
 console.log('PASS fallback: visible coverage limit, safe text rendering, uncertainty does not monopolize queue');
 await p.setViewportSize({width:390,height:844});await start('给自己用的 AI 雅思网站，不要登录，记录每日练习');await noOverflow('mobile clarify');await p.screenshot({path:path.join(out,'03-clarify-mobile.png'),fullPage:true});
 await p.locator('[data-step="2"]').click();await noOverflow('mobile review');await p.screenshot({path:path.join(out,'04-review-mobile.png'),fullPage:true});
 await p.locator('[data-step="0"]').click();await noOverflow('mobile entry');
 console.log('PASS mobile: entry/clarify/review no horizontal overflow at 390px');assert.deepEqual(errors,[]);console.log('PASS: no uncaught browser errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
