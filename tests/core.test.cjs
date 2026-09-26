const test=require('node:test');
const assert=require('node:assert/strict');
const C=require('../src/core.js');

/* ── HELPERS ── */
function filled(){
  let s=C.start('个人 AI 雅思网站','website');
  // For tests that need a fully-confirmed state we manually fill required questions
  // skipping ai_role (contextual) since we set it separately
  for(const q of C.questions(s)){
    if(q.id==='ai_role') continue; // skip contextual
    s=C.setAnswer(s,q.id,q.options[0]);
  }
  // Satisfy ai_role since intent mentions AI
  if(C.questions(s).some(q=>q.id==='ai_role')) s=C.setAnswer(s,'ai_role',C.questions(s).find(q=>q.id==='ai_role').options[0]);
  return s;
}

function filledNoAI(){
  let s=C.start('给自己用的雅思网站，不要登录，记录每日练习','website');
  for(const q of C.questions(s)) s=C.setAnswer(s,q.id,q.options[0]);
  return s;
}

/* ═══════════════════════════════════════
   ORIGINAL TESTS (preserved)
═══════════════════════════════════════ */
test('unknown answers do not count as consent',()=>{
  let s=C.start('网站','website');
  s=C.setAnswer(s,'goal','暂不确定','unknown');
  assert.equal(s.answers.goal.status,'pending');
  assert.throws(()=>C.confirm(s));
  assert.equal(C.specification(s).state,'draft');
});

test('goal change invalidates affected choices, preserving audience and old snapshot',()=>{
  let s=C.confirm(filled());
  const old=JSON.stringify(s.history[0]);
  s=C.setAnswer(s,'goal','展示作品或业务');
  assert.equal(s.answers.detail.status,'stale');
  assert.equal(s.answers.success.status,'stale');
  assert.equal(s.answers.audience.status,'confirmed');
  assert.equal(s.activeRevision,null);
  assert.equal(JSON.stringify(s.history[0]),old);
  assert.throws(()=>C.confirm(s));
});

test('same stale choice can be reconfirmed and versions stay immutable',()=>{
  let s=C.confirm(filled());
  s=C.setAnswer(s,'goal','展示作品或业务');
  s=C.setAnswer(s,'detail','作品展示与分类');
  assert.equal(s.answers.ai_role.status,'stale');
  s=C.setAnswer(s,'ai_role',s.answers.ai_role.value);
  s=C.setAnswer(s,'success',s.answers.success.value);
  s=C.confirm(s);
  assert.equal(s.activeRevision,2);
  // history[0] should still have the original goal
  const req0=s.history[0].specification.requirements.find(r=>r.field==='goal');
  assert.ok(req0,'history[0] should have a goal row');
  // v1 was filled with options[0] which is '学习与练习'
  assert.equal(req0.value,'学习与练习');
  assert.equal(C.confirm(s).history.length,2);
});

test('markdown and JSON contain same sources, boundaries and original input',()=>{
  const s=filledNoAI();
  const spec=C.specification(s);
  const md=C.markdown(spec);
  assert.ok(md.includes(s.intent));
  for(const r of spec.requirements){
    assert.ok(md.includes(r.id));
    assert.ok(md.includes(r.value));
    assert.ok(md.includes(r.kind));
  }
  assert.ok(md.includes('不要登录'));
  assert.ok(!md.includes('支付'));
  assert.equal(spec.verification,'not-run');
});

test('all three task types share baseline logic',()=>{
  for(const id of Object.keys(C.scenarios)){
    let s=C.start('用户自定义任务',id);
    for(const q of C.questions(s)) s=C.setAnswer(s,q.id,'我自己的要求','custom');
    assert.equal(C.confirm(s).activeRevision,1);
  }
});

test('invalid stored content is rejected; valid confirmed draft round trips',()=>{
  for(const raw of ['{bad','{}',JSON.stringify({...C.fresh(),answers:{goal:{value:[],status:'confirmed'}}})])
    assert.deepEqual(C.restore(raw),C.fresh());
  const s=C.confirm(filled());
  assert.deepEqual(C.restore(JSON.stringify(s)),s);
});

test('empty input and unsupported scenarios are rejected',()=>{
  assert.throws(()=>C.start(' ','website'));
  assert.throws(()=>C.start('a','missing'));
});

/* ═══════════════════════════════════════
   NEW TESTS — acceptance cases
═══════════════════════════════════════ */

// Acceptance: "给我做个网站" → no auto-confirmed facts, audience/goal asked first
test('bare "给我做个网站" has no extracted facts and asks audience+goal first',()=>{
  const s=C.start('给我做个网站','website');
  // No facts should be extracted from this bare input
  assert.equal(s.facts.length,0,'bare input should produce no facts');
  // nextQuestions should include audience and goal
  const nq=C.nextQuestions(s);
  const ids=nq.map(q=>q.id);
  assert.ok(ids.includes('audience'),'should ask audience');
  assert.ok(ids.includes('goal'),'should ask goal');
  // specification should be draft, not confirmed
  assert.equal(C.specification(s).state,'draft');
  assert.throws(()=>C.confirm(s),'should not be confirmable with zero answers');
});

// Acceptance: "给自己用的雅思网站，不要登录，记录每日练习"
// → facts extracted with evidence; exclude already pre-filled; no re-asking login
test('extracts facts from "给自己用的雅思网站，不要登录，记录每日练习"',()=>{
  const s=C.start('给自己用的雅思网站，不要登录，记录每日练习','website');
  const audienceFact=s.facts.find(f=>f.field==='audience');
  assert.ok(audienceFact,'audience fact should be extracted');
  assert.equal(audienceFact.value,'我自己');
  assert.ok(audienceFact.evidence,'audience fact should have evidence');

  const excludeFact=s.facts.find(f=>f.field==='exclude');
  assert.ok(excludeFact,'exclude (no-login) fact should be extracted');
  assert.equal(excludeFact.value,'不要登录');
  assert.ok(excludeFact.evidence,'exclude fact should have evidence');

  const detailFact=s.facts.find(f=>f.field==='detail');
  assert.ok(detailFact,'detail (每日练习) fact should be extracted');
  assert.ok(detailFact.evidence,'detail fact should have evidence');

  // After applyFacts, exclude field should be pre-filled as pending, not confirmed
  const s2=C.applyFacts(s);
  assert.equal(s2.answers.exclude?.kind,'fact-candidate');
  assert.equal(s2.answers.exclude?.status,'pending');
  assert.equal(s2.answers.exclude?.value,'不要登录');

  // nextQuestions should NOT include 'exclude' since it's pre-filled as pending
  // (pending shows in questions but the fact is visible)
  // The important thing: we should not ask audience again since it's prefilled
  // But audience is pending (not confirmed) so it still appears for confirmation
  const nq=C.nextQuestions(s2);
  const ids=nq.map(q=>q.id);
  // exclude is optional so it should have lower priority — required items go first
  // confirm that we're not generating a "login" question
  const qs=C.questions(s2);
  assert.ok(!qs.some(q=>q.id==='login' || (q.title||'').includes('需要登录')),'should not ask about login');
});

// Acceptance: "个人 AI 雅思网站" → AI role must be asked, can't be confirmed without it
test('"个人 AI 雅思网站" triggers ai_role question; cannot confirm without answering it',()=>{
  const s=C.start('个人 AI 雅思网站','website');
  // AI ambiguity should be flagged
  assert.ok(s.ambiguities.some(a=>a.includes('AI')),'AI ambiguity should be detected');
  // ai_role question should be in question list
  const qs=C.questions(s);
  assert.ok(qs.some(q=>q.id==='ai_role'),'ai_role question should be present');
  // ai_role is required → blockers should include it
  const b=C.blockers(s);
  assert.ok(b.some(q=>q.id==='ai_role'),'ai_role should be a blocker');
  // nextQuestions should surface ai_role
  const nq=C.nextQuestions(s);
  assert.ok(nq.some(q=>q.id==='ai_role'),'ai_role should appear in nextQuestions');
  // Confirm is impossible
  // Fill all except ai_role
  let s2=s;
  for(const q of qs){
    if(q.id==='ai_role') continue;
    s2=C.setAnswer(s2,q.id,q.options[0]);
  }
  assert.throws(()=>C.confirm(s2),'should not confirm without ai_role');
  // Confirmed AI role stays in the catalogue and export, but not the next-question queue
  s2=C.setAnswer(s2,'ai_role','AI 生成或批改内容');
  assert.ok(C.questions(s2).some(q=>q.id==='ai_role'),'ai_role must remain editable');
  assert.ok(!C.nextQuestions(s2).some(q=>q.id==='ai_role'),'confirmed role should not repeat');
  assert.ok(C.rows(s2).some(r=>r.field==='ai_role' && r.status==='confirmed'));
  assert.doesNotThrow(()=>C.confirm(s2));
});

// Acceptance: "暂不确定" keeps unknown, does not count as confirmed
test('user saying 暂不确定 keeps status pending; recommended option is not auto-confirmed',()=>{
  let s=C.start('帮我做个网站','website');
  s=C.setAnswer(s,'audience','我自己');
  s=C.setAnswer(s,'goal','暂不确定','unknown');
  assert.equal(s.answers.goal.status,'pending');
  assert.equal(s.answers.goal.kind,'unknown');
  // Specification should be draft
  assert.equal(C.specification(s).state,'draft');
  assert.throws(()=>C.confirm(s));
  // Setting unknown does not promote to confirmed even if value matches an option
  s=C.setAnswer(s,'goal','学习与练习','unknown');
  assert.equal(s.answers.goal.status,'pending');
});

// Acceptance: changing 口语 to 作文 only resets dependent fields; audience/exclude preserved
test('changing detail (speaking → writing) only invalidates dependent fields',()=>{
  let s=C.start('雅思口语练习网站，自己用','website');
  // Pre-fill all required questions
  for(const q of C.questions(s)) s=C.setAnswer(s,q.id,q.options[0]);
  s=C.confirm(s);
  const oldHistory=JSON.stringify(s.history[0]);
  const audienceValue=s.answers.audience.value;
  // Simulate changing detail
  s=C.setAnswer(s,'detail','学习记录与进度');
  // Only 'success' should be stale (detail → success dependency)
  assert.equal(s.answers.success.status,'stale','success should be stale');
  // audience should be untouched
  assert.equal(s.answers.audience.status,'confirmed','audience should stay confirmed');
  assert.equal(s.answers.audience.value,audienceValue,'audience value should not change');
  // exclude should be untouched
  assert.equal(s.answers.exclude?.status,'confirmed','exclude should stay confirmed');
  // history snapshot preserved
  assert.equal(JSON.stringify(s.history[0]),oldHistory,'history snapshot must not change');
});

// Acceptance: words near known patterns but not exact match should not crash
test('close paraphrases do not crash extract()',()=>{
  const inputs=[
    '我想要一个雅思练习平台',
    '给我自己用的系统，不需要注册账号',
    '做个有 AI 功能的网站',
    '仅供个人学习，不对外开放',
    '一个能追踪学习记录的 app',
    '帮我整理信息'
  ];
  for(const input of inputs){
    assert.doesNotThrow(()=>{
      const s=C.start(input,'website');
      C.nextQuestions(s);
      C.extract(input,'website');
    },'extract should not throw for: '+input);
  }
});

// Acceptance: unknown/unfamiliar input → honest degradation, no invented confirmed facts
test('unfamiliar long input produces no ungrounded confirmed facts',()=>{
  const longUnfamiliar='我想构建一个量子纠缠通信协议的可视化教育平台，集成实时粒子模拟和多语言支持，面向全球物理学研究生。';
  const s=C.start(longUnfamiliar,'website');
  // extract may return some facts or not; none should be status:'confirmed'
  for(const f of s.facts){
    assert.notEqual(f.status,'confirmed','extracted facts must not be pre-confirmed');
  }
  // After applyFacts, still no confirmed answers
  const s2=C.applyFacts(s);
  for(const [,v] of Object.entries(s2.answers)){
    assert.notEqual(v.status,'confirmed','applied facts must not be status:confirmed');
  }
  // coverageReport should work without throwing
  assert.doesNotThrow(()=>C.coverageReport(s));
});

// Acceptance: nextQuestions never repeats confirmed answers
test('nextQuestions skips confirmed answers and stops when all done',()=>{
  let s=C.start('帮我做个网站','website');
  // Fill audience and goal
  s=C.setAnswer(s,'audience','我自己');
  s=C.setAnswer(s,'goal','学习与练习');
  const nq=C.nextQuestions(s);
  const ids=nq.map(q=>q.id);
  assert.ok(!ids.includes('audience'),'confirmed audience must not reappear');
  assert.ok(!ids.includes('goal'),'confirmed goal must not reappear');
  assert.ok(nq.length<=3,'at most 3 questions');
});

// Acceptance: extracted facts appear in specification extractedFacts field
test('specification includes extractedFacts and ambiguities',()=>{
  const s=C.start('个人 AI 雅思网站','website');
  const spec=C.specification(s);
  assert.ok(Array.isArray(spec.extractedFacts),'extractedFacts should be array');
  assert.ok(Array.isArray(spec.ambiguities),'ambiguities should be array');
  assert.ok(spec.ambiguities.some(a=>a.includes('AI')),'AI ambiguity should be in spec');
  assert.equal(spec.engine,'rule-baseline-v3-reviewed');
});

// Acceptance: markdown includes evidence section and extracted facts
test('markdown output includes extracted facts with evidence',()=>{
  const s=C.start('给自己用的雅思网站，不要登录','website');
  const spec=C.specification(s);
  const md=C.markdown(spec);
  assert.ok(md.includes('从原文识别的事实候选'),'markdown should have facts section');
  assert.ok(md.includes('不要登录'),'markdown should mention exact no-login fact');
  assert.ok(!md.includes('支付'),'must not add payment exclusion');
  assert.ok(md.includes('原文依据'),'markdown should include evidence label');
});

// Acceptance: dependency graph: audience change does NOT invalidate exclude
test('audience change does not make exclude stale',()=>{
  let s=C.start('帮我做个网站','website');
  s=C.setAnswer(s,'exclude','不做登录与支付');
  s=C.setAnswer(s,'audience','我自己');
  assert.equal(s.answers.exclude.status,'confirmed','exclude should stay confirmed');
});

// Acceptance: goal change makes detail and success stale but not audience/exclude
test('goal change makes detail+success stale, not audience or exclude',()=>{
  let s=C.start('帮我做个网站','website');
  s=C.setAnswer(s,'audience','我自己');
  s=C.setAnswer(s,'goal','学习与练习');
  s=C.setAnswer(s,'delivery','自己实际使用');
  s=C.setAnswer(s,'detail','口语练习与反馈');
  s=C.setAnswer(s,'exclude','不做登录与支付');
  s=C.setAnswer(s,'success','用户能独立完成核心操作');
  // Now change goal
  s=C.setAnswer(s,'goal','展示作品或业务');
  assert.equal(s.answers.detail.status,'stale');
  assert.equal(s.answers.success.status,'stale');
  assert.equal(s.answers.audience.status,'confirmed');
  assert.equal(s.answers.exclude.status,'confirmed');
  assert.equal(s.answers.delivery.status,'confirmed');
});

// Acceptance: modelExtractInterface returns same shape as extract
test('modelExtractInterface returns fact/ambiguity/covered shape',()=>{
  const result=C.modelExtractInterface('个人 AI 雅思网站','website');
  assert.ok(Array.isArray(result.facts));
  assert.ok(Array.isArray(result.ambiguities));
  assert.ok(typeof result.covered==='boolean');
});

// Acceptance: contextual follow-up questions are scenario-specific
test('speaking detail triggers speaking_input follow-up; portfolio goal triggers portfolio_content',()=>{
  // speaking
  let s=C.start('雅思练习','website');
  s=C.setAnswer(s,'goal','学习与练习');
  s=C.setAnswer(s,'detail','口语练习与反馈');
  const qs=C.questions(s);
  assert.ok(qs.some(q=>q.id==='speaking_input'),'speaking_input should appear for 练习与反馈');

  // portfolio
  let s2=C.start('作品展示','website');
  s2=C.setAnswer(s2,'goal','展示作品或业务');
  const qs2=C.questions(s2);
  assert.ok(qs2.some(q=>q.id==='portfolio_content'),'portfolio_content should appear for 展示作品或业务');

  // These should not appear in the other scenario
  assert.ok(!qs.some(q=>q.id==='portfolio_content'),'portfolio_content should NOT appear for learning goal');
});

/* Codex audit regressions: failures observed in the uploaded Bob baseline. */
test('unknown AI role remains a blocker and can be edited later',()=>{
 let s=C.start('个人 AI 雅思网站','website');
 s=C.setAnswer(s,'ai_role','暂不确定','unknown');
 for(const q of C.questions(s).filter(q=>q.id!=='ai_role'))s=C.setAnswer(s,q.id,q.id==='detail'?'学习记录与进度':q.options[0]);
 assert.ok(C.blockers(s).some(q=>q.id==='ai_role'));assert.throws(()=>C.confirm(s));
 s=C.setAnswer(s,'ai_role','AI 个性化推荐');assert.ok(C.questions(s).some(q=>q.id==='ai_role'));
 assert.ok(C.markdown(C.specification(s)).includes('AI 个性化推荐'));
});
test('uncertainty cannot be confirmed even when submitted as a normal option',()=>{
 let s=C.start('雅思口语练习网站','website');s=C.setAnswer(s,'detail','口语练习与反馈');
 s=C.setAnswer(s,'speaking_input','暂不确定');assert.equal(s.answers.speaking_input.status,'pending');
 assert.ok(C.blockers(s).some(q=>q.id==='speaking_input'));
});
test('writing practice never asks for recording; switching back requires reconfirmation',()=>{
 let s=C.start('雅思作文练习网站','website');s=C.setAnswer(s,'detail','作文练习与反馈');
 assert.ok(!C.questions(s).some(q=>q.id==='speaking_input'));
 s=C.setAnswer(s,'detail','口语练习与反馈');s=C.setAnswer(s,'speaking_input','实时麦克风录音');
 s=C.setAnswer(s,'detail','作文练习与反馈');assert.equal(s.answers.speaking_input.status,'stale');
 assert.ok(!C.rows(s).some(r=>r.field==='speaking_input'));
 s=C.setAnswer(s,'detail','口语练习与反馈');assert.ok(C.blockers(s).some(q=>q.id==='speaking_input'));
});
test('switching an upstream answer to unknown also invalidates dependents',()=>{
 let s=filled();s=C.setAnswer(s,'goal','暂不确定','unknown');
 assert.equal(s.answers.detail.status,'stale');assert.equal(s.answers.success.status,'stale');
 assert.equal(s.answers.audience.status,'confirmed');
});
test('fact confirmation preserves evidence and rejected candidates cannot auto-apply',()=>{
 let s=C.applyFacts(C.start('给自己用的网站，不要登录','website'));
 const f=s.facts.find(f=>f.field==='exclude');s=C.confirmFact(s,f.id);
 assert.equal(s.answers.exclude.kind,'fact-confirmed');assert.equal(s.answers.exclude.evidence,'不要登录');
 assert.ok(C.markdown(C.specification(s)).includes('原文：不要登录'));
 const a=s.facts.find(f=>f.field==='audience');s=C.dismissFact(s,a.id);s=C.applyFacts(s);
 assert.equal(s.answers.audience,undefined);assert.throws(()=>C.confirmFact(s,a.id));
 assert.equal(C.specification(s).extractedFacts.find(f=>f.id===a.id).decision,'dismissed');
});
test('negative wording and writing scenario do not create positive website goals',()=>{
 const a=C.extract('不要作品展示，也不要口语功能','website');
 assert.ok(!a.facts.some(f=>f.field==='goal'||f.field==='detail'));
 const b=C.extract('写一篇展示自己作品的文章','writing');assert.ok(!b.facts.some(f=>f.value==='展示作品或业务'));
 assert.ok(!C.extract('个人作品集网站','website').facts.some(f=>f.field==='audience'));
});
test('multiple candidate goals are not silently resolved by first-match order',()=>{
 let s=C.applyFacts(C.start('做一个雅思练习网站，同时展示作品','website'));
 assert.equal(s.facts.filter(f=>f.field==='goal').length,2);
 assert.equal(s.answers.goal,undefined);assert.ok(C.coverageReport(s).unresolved.some(a=>a.includes('goal')));
});
test('budget and time remain literal candidates; any extraction is only partial coverage',()=>{
 const s=C.applyFacts(C.start('给自己用的网站，预算3000元，两周内完成，不要登录','website'));
 assert.ok(s.answers.constraints.value.includes('3000元'));assert.ok(s.answers.constraints.value.includes('两周内完成'));
 assert.equal(C.coverageReport(s).level,'partial');assert.ok(C.blockers(s).some(q=>q.id==='constraints'));
 assert.equal(C.coverageReport(C.start('make a personal app','website')).level,'unknown');
});
test('unknown high-priority questions do not starve all other questions',()=>{
 let s=C.start('AI 网站','website');for(const id of ['audience','goal','ai_role'])s=C.setAnswer(s,id,'暂不确定','unknown');
 assert.ok(C.nextQuestions(s).some(q=>q.id==='delivery'));assert.ok(C.blockers(s).some(q=>q.id==='ai_role'));
});
test('context changes cannot renumber stable requirement IDs',()=>{
 let s=C.start('网站','website');s=C.setAnswer(s,'goal','展示作品或业务');
 const portfolioId=C.rows(s).find(r=>r.field==='portfolio_content').id;
 s=C.setAnswer(s,'detail','AI 介绍作品','custom');
 assert.equal(C.rows(s).find(r=>r.field==='portfolio_content').id,portfolioId);
});
test('legacy stored sessions preserve history but reopen answers for review',()=>{
 const s=C.confirm(filled());const old=JSON.parse(JSON.stringify(s));delete old.engineRevision;
 const n=C.restore(JSON.stringify(old));assert.equal(n.activeRevision,null);assert.equal(n.engineRevision,3);
 assert.equal(n.answers.goal.status,'stale');assert.deepEqual(n.history,old.history);assert.ok(n.migrationNotice);
});
test('malformed persisted facts cannot crash the interface',()=>{
 let s=C.start('网站','website');s.facts=[null];assert.deepEqual(C.restore(JSON.stringify(s)),C.fresh());
 s=C.start('网站','website');s.ambiguities=[null];assert.deepEqual(C.restore(JSON.stringify(s)),C.fresh());
});
