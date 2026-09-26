(() => {
  'use strict';
  const C = window.IntentCore;
  const $ = s => document.querySelector(s);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key = 'intentconfirm-v01';
  let state = C.fresh(), storage = true;
  try { state = C.restore(localStorage.getItem(key)); } catch { storage = false; }
  let step = state.intent ? 1 : 0, scenario = state.scenario;
  let timer;
  let batchIds = [], draftInputs = {};

  function notify(msg) { $('#toast').textContent = msg; $('#toast').classList.add('show'); clearTimeout(timer); timer = setTimeout(()=>$('#toast').classList.remove('show'),4000); }
  function persist() { try { localStorage.setItem(key,JSON.stringify(state)); } catch { storage = false; notify('浏览器无法保存草稿。请及时导出文件。'); } }

  function badge(a) {
    const status = a?.status || 'pending';
    const labels = { confirmed: '已选择', pending: '待确定', stale: '需重新确认' };
    return `<span class="badge ${status}">${labels[status]}</span>`;
  }

  function factBadge() {
    return `<span class="badge" style="background:#e8f4fd;color:#1a6896;border:1px solid #b3d9f7">原文识别</span>`;
  }

  function render() {
    document.querySelectorAll('[data-step]').forEach(b => {
      b.classList.toggle('active', +b.dataset.step === step);
      b.setAttribute('aria-current', +b.dataset.step === step ? 'step' : 'false');
    });
    document.querySelectorAll('[data-custom]').forEach(f=>{draftInputs[f.dataset.custom]=f.querySelector('input').value;});
    $('#main').innerHTML = step === 0 ? entry() : step === 1 ? clarify() : review();
    bind();
  }

  function entry() {
    return `<div class="eyebrow">FROM AN IDEA TO A SHARED UNDERSTANDING</div><h1>从你脑中的想法开始。</h1><p class="lead">不必先写一份完整需求。说出想法，再一起确认关键选择。</p><div class="grid"><section><form class="card" id="intent-form"><label class="input-label" for="intent">你想让 AI 帮你完成什么？</label><textarea class="intent-input" id="intent" maxlength="2000" required placeholder="比如：帮我做一个个人 AI 雅思网站……">${escape(state.intent)}</textarea><div class="label-row"><span class="hint">选择任务类型</span><small>原型暂不自动识别</small></div><div class="segments">${Object.entries(C.scenarios).map(([id,t])=>`<button type="button" class="segment ${scenario===id?'selected':''}" aria-pressed="${scenario===id}" data-scenario="${id}">${t.name}</button>`).join('')}</div><div class="actions"><span class="hint">${storage?'内容仅保存在当前浏览器':'当前浏览器无法保存，请及时导出'}</span><button class="primary" type="submit">开始梳理 <span>↗</span></button></div></form><div class="examples"><span class="examples-title">也可以从一个例子开始</span>${[['▧','帮我做一个个人 AI 雅思网站','website'],['✎','帮我写一篇介绍个人项目的文章','writing'],['⌘','帮我整理一个产品上线前的检查方案','general']].map(([icon,text,s])=>`<button class="example" data-example="${escape(text)}" data-type="${s}"><span class="icon">${icon}</span>${text}<span class="arrow">↗</span></button>`).join('')}</div></section><aside class="side-card"><span class="number">HOW IT WORKS</span><h2>把模糊，变成共识。</h2><p>AI 不知道的部分，先呈现给你。<br>你来选择，它才有清楚的方向。</p><div class="mini-flow"><div><span>01</span> 说出想法，不必面面俱到</div><div><span>02</span> 点选关键方向，补充你的偏好</div><div><span>03</span> 确认需求，交给开发工具执行</div></div><div class="note">当前使用规则识别部分原文信息，按缺口提出问题。候选需要你确认；复杂表达可能遗漏，尚未连接在线模型。</div></aside></div>`;
  }

  /* ── FACTS PANEL ── shows extracted facts with evidence and ambiguities */
  function factsPanel() {
    const coverage=C.coverageReport(state);
    const active=C.questions(state);
    let html=`<div class="facts-panel"><div class="facts-header"><strong>先核对我们读到的信息</strong><span class="hint">候选可直接确认，也可以纠正</span></div>`;
    const facts=(state.facts || []).filter(f=>!(state.dismissedFacts || []).includes(f.id));
    if(facts.length)html+='<ul class="facts-list">';
    for(const f of facts) {
      const a=state.answers[f.field], accepted=a?.status==='confirmed' && a.value===f.value;
      const changed=a?.status==='confirmed' && a.value!==f.value;
      html+=`<li class="fact-item"><div>${accepted?'<span class="badge">已采纳</span>':changed?'<span class="badge pending">未采纳此候选</span>':factBadge()} <strong>${escape(f.value)}</strong></div><div class="evidence">原文：${escape(f.evidence)}</div>`;
      if(!accepted && active.some(q=>q.id===f.field))html+=`<div class="fact-actions"><button class="textbutton" data-fact="${f.id}">确认这个理解</button><button class="textbutton" data-dismiss="${f.id}">这个理解不对</button></div>`;
      html+='</li>';
    }
    if(facts.length)html+='</ul>';
    for(const a of coverage.unresolved)html+=`<div class="hint">待明确：${escape(a)}</div>`;
    html+=`<div class="coverage-note">${escape(coverage.message)}</div></div>`;
    return html;
  }

  function question(q) {
    const a = state.answers[q.id];
    // fact-candidate answers: show evidence, mark as pending confirmation
    const isFact = a?.kind === 'fact-candidate';
    const isSelected = v => a?.value === v && a.status === 'confirmed';
    const isFactValue = v => a?.value === v && isFact;

    return `<section class="question" id="question-${q.id}">
<h3>${escape(q.title)} ${q.required?'':'<span class="badge">可选</span>'}</h3>
<p>${escape(q.why)}</p>
${isFact ? `<div class="notice" style="margin-bottom:8px"> 从原文识别到候选答案 <strong>${escape(a.value)}</strong>${a.evidence ? `（依据：${escape(a.evidence)}）` : ''}。请确认或修改。${a.factId?`<button class="textbutton" data-fact="${a.factId}">确认这个理解</button>`:""}</div>` : ''}
${a?.status === 'stale' ? '<p class="notice">上游选择发生了变化，请重新选择或确认此项。</p>' : ''}
<div class="options">${q.options.map(v => `<button class="option ${isSelected(v)?'selected':''} ${isFactValue(v)?'fact-hint':''}" data-answer="${q.id}" data-value="${escape(v)}" aria-pressed="${isSelected(v)}"><span class="radio"></span>${escape(v)}${isFactValue(v)?' <span class="fact-tag">原文</span>':''}</button>`).join('')}<button class="option unknown ${a?.kind==='unknown'?'selected':''}" data-answer="${q.id}" data-kind="unknown" data-value="暂不确定"><span class="radio"></span>暂不确定，保留为待解决问题</button></div>
<form class="custom" data-custom="${q.id}"><input aria-label="${escape(q.title)} 自定义回答" maxlength="2000" placeholder="都不合适？写下自己的想法" value="${escape(draftInputs[q.id] ?? (a?.kind==='custom'?a.value:''))}"><button type="submit">${a?.status==='stale'?'重新确认':'采用'}</button></form></section>`;
  }

  function summary() {
    return `<aside class="side-card summary"><div class="summary-header"><h3>正在形成的需求</h3><span class="number">LIVE BRIEF</span></div><div class="original">"${escape(state.intent)}"</div>${C.rows(state).map(r=>`<div class="req"><div class="reqtop"><small>${r.id}</small>${badge(r)}${r.kind==='fact-candidate'?factBadge():''}</div><p>${escape(r.value)}</p><button data-edit="${r.field}">修改选择 ↗</button></div>`).join('')}<div class="note">"已选择"来自你的点击或输入。<br>"待确定"不会被当成你已经同意。<br>"原文识别"来自规则匹配，仍需确认。</div></aside>`;
  }

  /* ── CLARIFY — dynamic question flow, replaces fixed round*3 pagination ── */
  function clarify() {
    const allQs = C.questions(state);
    batchIds=batchIds.filter(id=>allQs.some(q=>q.id===id));
    if(!batchIds.length)batchIds=C.nextQuestions(state).map(q=>q.id);
    const nextQs = batchIds.map(id=>allQs.find(q=>q.id===id)).filter(Boolean);
    const allDone = C.blockers(state).length === 0;
    const confirmedCount = allQs.filter(q => state.answers[q.id]?.status === 'confirmed').length;
    const totalCount = allQs.length;

    // Progress indicator
    const progressDots = allQs.map(q => `<i class="${state.answers[q.id]?.status === 'confirmed' ? 'done' : ''}"></i>`).join('');

    let questionsHtml;
    if (nextQs.length === 0 && !allDone) {
      // Edge case: all questions answered but blockers remain (shouldn't normally happen)
      questionsHtml = `<div class="notice">所有问题已回答完毕，请检查仍标记为"待确定"的项目。</div>`;
    } else if (nextQs.length === 0) {
      questionsHtml = `<div class="notice success">所有关键问题已回答。请继续查看完整需求。</div>`;
    } else {
      questionsHtml = nextQs.map(question).join('');
    }

    return `<div class="eyebrow">CLARIFY THE IMPORTANT PARTS</div><h1>让结果，更接近你的本意。</h1><p class="lead">每次最多显示三个最重要的问题。已有来源的选项会标注依据；你可以修改或确认。</p>
${state.migrationNotice?`<div class="notice">${escape(state.migrationNotice)}</div>`:""}${factsPanel()}
<div class="grid"><section class="card"><div class="section-meta"><span>${confirmedCount} / ${totalCount} 项已选择${nextQs.length > 0 ? ' · 当前显示优先级最高的问题' : ''}</span><div class="progress">${progressDots}</div></div>
${questionsHtml}
<div class="actions"><button class="textbutton" id="previous">← 返回原始想法</button><button class="primary" id="next">${allDone ? '查看完整需求' : nextQs.length === 0 ? '查看完整需求' : '继续补充'} <span>→</span></button></div></section>${summary()}</div>`;
  }

  function review() {
    const pending = C.blockers(state), rows = C.rows(state);
    const val = id => state.answers[id]?.status === 'confirmed' ? state.answers[id].value : '待确定';
    return `<div class="eyebrow">REVIEW BEFORE YOU BUILD</div><h1>这是你想要的结果吗？</h1><p class="lead">先核对范围，再把同一份需求交给 Bob 或其他执行工具。</p><div class="grid"><section class="card"><div class="summary-header"><h2>需求确认单</h2><span class="number">${state.activeRevision?'已确认 v'+state.activeRevision:'草稿 · 尚未整体确认'}</span></div><div class="original">${escape(state.intent)}</div><div class="coverage-note">${escape(C.coverageReport(state).message)}</div><div class="preview"><strong>按当前选择，我理解你希望：</strong>为「${escape(val('audience'))}」完成「${escape(val('goal'))}」，本次交付为「${escape(val('delivery'))}」。<br>核心内容：${escape(val('detail'))}。<br>验收重点：${escape(val('success'))}。</div>${rows.map(r=>`<section class="review-row"><div class="reqtop"><small>${r.id}</small><h3>${escape(r.question)}</h3></div><p>${escape(r.value)}</p>${badge(r)} ${r.kind==='fact-candidate'?factBadge()+' ':''}  <small>来源：${r.kind==='custom'?'你的补充':r.kind==='selection'?'你的选择':r.kind==='fact-confirmed'?'原文候选，经你确认':r.kind==='fact-candidate'?'原文识别（待确认）':'尚未确认'}</small> · <button class="textbutton" data-edit="${r.field}">修改</button>${r.evidence?`<div class="evidence">原文依据：${escape(r.evidence)}</div>`:''}</section>`).join('')}<div class="${pending.length?'notice':'notice success'}">${pending.length?`还有 ${pending.length} 项关键问题需要确定，可以先导出草稿。`:state.activeRevision?'此版本已确认。后续修改会成为新草稿，历史版本仍保留。':'关键问题已回答。请对照原始想法检查是否遗漏，再确认此版本。'}</div><div class="actions"><button class="secondary" id="back">← 继续调整</button><button class="primary" id="confirm" ${pending.length||state.activeRevision?'disabled':''}>${state.activeRevision?'已确认 v'+state.activeRevision:'确认这就是我的需求'}</button></div></section><aside class="side-card summary"><span class="number">READY FOR HANDOFF</span><h2>带着共识，开始制作。</h2><p>导出文件包含原始想法、需求来源、范围与未决问题。开发工具能看到哪些内容已被确认。</p><div class="actions"><button class="primary" data-export="md">导出 ${state.activeRevision?'确认版':'草稿'} Markdown ↗</button><button class="secondary" data-export="json">导出结构化 JSON</button><button class="secondary" id="copy">复制开发交接内容</button></div><p class="note">此处导出需求，不会自动生成网站或发送给 Bob。下载后把 Markdown 放入项目，再让 Bob 读取。</p><div class="notice">实现状态：未验证<br>导出与确认不代表开发已经完成。</div>${state.history.length?`<details class="history"><summary>历史确认版本（${state.history.length}）</summary>${state.history.map((h,i)=>`<button class="textbutton" data-history="${i}">下载 v${i+1}（${escape(h.confirmedAt?.slice(0,10)||'')}）</button>`).join('')}</details>`:''}</aside></div>`;
  }

  function download(text, filename, type) {
    const url=URL.createObjectURL(new Blob([text],{type})); const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('导出文件已准备好。');
  }

  function change(id, value, kind) {
    try { state=C.setAnswer(state,id,value,kind);persist();const y=window.scrollY;render();window.scrollTo(0,y); } catch(e) {notify(e.message);}
  }

  function go(target) { if(target && !state.intent) {notify('先写下一句想法。');return;}step=target;render();window.scrollTo(0,0); }

  function bind() {
    document.querySelectorAll('[data-step]').forEach(b=>b.onclick=()=>go(+b.dataset.step));
    document.querySelectorAll('[data-scenario]').forEach(b=>b.onclick=()=>{scenario=b.dataset.scenario;document.querySelectorAll('[data-scenario]').forEach(x=>{x.classList.toggle('selected',x.dataset.scenario===scenario);x.setAttribute('aria-pressed',x.dataset.scenario===scenario);});});
    document.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{$('#intent').value=b.dataset.example;scenario=b.dataset.type;document.querySelector(`[data-scenario="${scenario}"]`).click();$('#intent').focus();});
    $('#intent-form')?.addEventListener('submit',e=>{
      e.preventDefault();
      try {
        const text=$('#intent').value.trim();
        if(text!==state.intent||scenario!==state.scenario){
          if(state.intent&&!window.confirm('更换原始想法或任务类型会新建项目。请先导出需要保留的版本。继续吗？'))return;
          state=C.start(text,scenario);batchIds=[];draftInputs={};
          // Apply extracted facts as pre-filled pending answers
          state=C.applyFacts(state);
        }
        persist();go(1);
      }catch(err){notify(err.message);}
    });
    document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>change(b.dataset.answer,b.dataset.value,b.dataset.kind||'selection'));
    document.querySelectorAll('[data-custom]').forEach(f=>f.onsubmit=e=>{e.preventDefault();change(f.dataset.custom,f.querySelector('input').value,'custom');});
    document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{
      batchIds=[b.dataset.edit,...C.nextQuestions(state).map(q=>q.id).filter(id=>id!==b.dataset.edit)].slice(0,3);
      delete draftInputs[b.dataset.edit];
      go(1);requestAnimationFrame(()=>{const el=$('#question-'+b.dataset.edit);el?.scrollIntoView({block:'center'});el?.querySelector('button')?.focus({preventScroll:true});});
    });
    document.querySelectorAll('[data-fact]').forEach(b=>b.onclick=()=>{try{state=C.confirmFact(state,b.dataset.fact);persist();render();}catch(e){notify(e.message);}});
    document.querySelectorAll('[data-dismiss]').forEach(b=>b.onclick=()=>{try{state=C.dismissFact(state,b.dataset.dismiss);persist();render();}catch(e){notify(e.message);}});
    // Dynamic navigation: "next" just goes to review when all done, else re-renders same step to show next batch
    if($('#next'))$('#next').onclick=()=>{
      const allDone = C.blockers(state).length === 0;
      const nextQs = C.nextQuestions(state);
      if(allDone || nextQs.length === 0){ go(2); }
      else { batchIds=[];render(); window.scrollTo(0,0); }
    };
    if($('#previous'))$('#previous').onclick=()=>go(0);
    if($('#back'))$('#back').onclick=()=>go(1);
    if($('#confirm'))$('#confirm').onclick=()=>{try{state=C.confirm(state);persist();render();notify('已保存确认版本 v'+state.activeRevision);}catch(e){notify(e.message);}};
    document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{const spec=C.specification(state),json=b.dataset.export==='json';download(json?JSON.stringify(spec,null,2):C.markdown(spec),'intentconfirm-'+(state.activeRevision?'v'+state.activeRevision:'draft')+(json?'.json':'.md'),json?'application/json':'text/markdown;charset=utf-8');});
    document.querySelectorAll('[data-history]').forEach(b=>b.onclick=()=>{const n=+b.dataset.history;download(JSON.stringify(state.history[n],null,2),'intentconfirm-history-v'+(n+1)+'.json','application/json');});
    if($('#copy'))$('#copy').onclick=async()=>{try{await navigator.clipboard.writeText(C.markdown(C.specification(state)));notify('交接内容已复制。');}catch{notify('当前环境不支持复制，请使用 Markdown 导出。');}};
    $('#reset').onclick=()=>{if(window.confirm('清除当前项目和本地版本记录？请先导出需要保留的文件。')){state=C.fresh();scenario='website';batchIds=[];draftInputs={};persist();go(0);}};
  }

  window.IntentOffline={resume:()=>{render();}};
  render();
})();
