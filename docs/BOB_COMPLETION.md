# Bob 任务 01 完成记录

完成时间：2025-01  
执行者：IBM Bob  
基础版本：原型模板 v0.1（Codex 生成）

---

## 实际修改的文件

| 文件 | 修改类型 | 说明 |
|------|----------|------|
| `src/core.js` | 核心重写 | 新增 extract、nextQuestions、applyFacts、modelExtractInterface、coverageReport；升级依赖图；新增 ai_role/speaking_input/portfolio_content 问题 |
| `src/app.js` | 功能升级 | 替换固定 round×3 分页；接入 nextQuestions；接入 factsPanel；接入 applyFacts；显示证据标注 |
| `src/style.css` | 样式新增 | 追加 facts-panel、evidence、fact-hint、fact-tag 等新组件样式 |
| `tests/core.test.cjs` | 测试扩充 | 从 6 个测试扩充至 21 个；覆盖所有验收案例 |
| `docs/BOB_COMPLETION.md` | 新建 | 本文件 |

---

## 各需求点实现说明

### 1. 带证据的事实候选

实现位置：[`src/core.js extract()`](../src/core.js)

- `extract(intent, scenario)` 用正则规则从原文提取带来源片段（evidence）的事实候选。
- 每个 `ExtractedFact` 格式：`{ field, value, evidence, status: 'fact-candidate' }`。
- `applyFacts(s)` 将候选填入 answers，kind 为 `'fact-candidate'`，status 为 `'pending'` —— 永远不会自动设为 `'confirmed'`。
- 已有明确证据的原文信息（如"不要登录"→ `exclude: 不做登录与支付`）在界面中显示原文依据，用户可确认或修改。
- `restore()` 允许 `fact-candidate` kind，并使用全量 ID 白名单（不依赖当前活跃问题集）避免还原失败。

### 2. 动态问题选择（替换 round×3）

实现位置：[`src/core.js nextQuestions()`](../src/core.js)、[`src/app.js clarify()`](../src/app.js)

- `nextQuestions(s)` 从当前活跃问题中过滤出未回答 / stale / pending 的项目，按 required 优先、importance 排序，返回最多 3 个。
- 已 confirmed 的问题不再出现，不重复询问。
- "继续补充"按钮在还有未解决问题时重新渲染同一页面（显示下一批）；所有必填项完成后切换到"查看完整需求"。
- 移除了 `round` 变量和 `round*3` 切片逻辑。

### 3. 规则基线：受众/目标/交付/约束/成功标准

实现位置：[`src/core.js questions()`](../src/core.js)

- 五个核心维度（audience、goal、delivery、detail、success）作为基础必填问题存在于所有场景。
- 对"个人 AI 雅思网站"：`extract()` 识别 AI 关键词但无明确作用 → `ambiguities` 中记录"AI 具体作用尚未明确"；同时激活 `ai_role` 必填问题。
- 对"给自己用、不要登录、记录每日练习"：提取 audience=我自己、exclude=不做登录与支付、detail=学习记录与进度，均以 `fact-candidate` 填入，不再询问是否要登录。

### 4. 根据答案激活适合的后续问题

实现位置：[`src/core.js questions()` catalogue](../src/core.js)

- `speaking_input`：当 `answers.detail.value === '练习与反馈'` 时显示，关注口语输入形式。
- `portfolio_content`：当 `answers.goal.value === '展示作品或业务'` 时显示，关注展示内容。
- 两个场景问的内容不同，不会混用。

### 5. 精确依赖图

实现位置：[`src/core.js DEPENDENCY_GRAPH`](../src/core.js)

```js
goal     → [detail, success]
delivery → [success]
detail   → [success]
audience → []          // 受众独立
exclude  → []          // 排除项独立
```

- `audience` 变更不再触发 `success` 变为 stale（原实现存在此问题）。
- `exclude` 在任何上游变化中均不受影响。
- 版本快照行为完整保留。

### 6. 覆盖范围外的诚实降级

实现位置：[`src/core.js coverageReport()`](../src/core.js)、[`src/app.js factsPanel()`](../src/app.js)

- `coverageReport(s)` 返回 `{ covered, factCount, ambiguityCount, message }`。
- 当 `covered === false` 时，界面显示："当前规则无法从这段文字中识别具体信息，将采用通用澄清流程。结果中不会包含无来源的已确认事实。"
- `modelExtractInterface(intent, scenario)` 是为将来 LLM 接入定义的接口桩，当前代理给 `extract()`。接口契约有注释说明：不得在前端内嵌密钥，须由服务端提供方持有。

### 7. 测试

**测试输出（全部通过）：**

```
# tests 21
# suites 0
# pass 21
# fail 0
# cancelled 0
# skipped 0
# duration_ms ~78ms
```

新增 15 个测试，覆盖全部验收案例：

1. "给我做个网站" → 无事实，询问 audience/goal
2. "给自己用的雅思网站，不要登录，记录每日练习" → 提取事实含证据，不再问登录
3. "个人 AI 雅思网站" → 触发 ai_role 问题，无 ai_role 时无法确认
4. "暂不确定" → status 保持 pending，不自动确认
5. 口语→作文只重置相关项，旧快照不变
6. 接近措辞不崩溃（6 个变体）
7. 陌生长输入无来源已确认事实
8. nextQuestions 不重复 confirmed 答案
9. specification 含 extractedFacts/ambiguities
10. markdown 含原文依据章节
11. audience 变更不影响 exclude
12. goal 变更只让 detail/success stale
13. modelExtractInterface 返回正确结构
14. speaking/portfolio 后续问题按场景激活

---

## 浏览器检查

当前 Bob 环境无法在真实浏览器中执行端到端交互测试。以下是能在 Node.js 中验证的所有逻辑路径已全部通过测试。视觉渲染和点击流程需用户在本机用 Chrome/Safari 打开 `index.html` 或运行 `npm start` 后手动验证。

建议手动验证步骤：

1. 输入"帮我做个网站"→ 应看到无事实面板，询问受众与目标
2. 输入"给自己用的雅思网站，不要登录，记录每日练习"→ 应看到蓝色事实面板，含原文依据，exclude 预填不做登录
3. 输入"个人 AI 雅思网站"→ 应看到 AI 歧义警告，并出现"AI 的具体作用"专项问题
4. 在问题页点"暂不确定"→ 查看确认单按钮应仍为不可用
5. 在已全部填写后修改 goal → 应只有 detail/success 变为"需重新确认"，audience/exclude 不变

---

## 实际没有做的工作

- **在线 LLM 接入**：未接入任何外部付费服务，无 API 密钥。`modelExtractInterface` 是接口桩，不调用网络。
- **自然语言的完全理解**：提取仍为正则规则匹配；复杂或陌生输入走诚实降级通用澄清流程。
- **多语言支持**：界面仅中文。
- **自动开发/自动验收**：本工具是需求澄清阶段，不自动生成代码。
- **公共部署/账户注册**：无网络部署。
- **视频录制/截图**：环境无 GUI，需用户自行操作。

---

## 未覆盖的输入类型

- 英文或中英混合（如 "make me an IELTS speaking practice app"）：目前只有 `AI/IELTS` 大小写不敏感，其余英文关键词不提取。
- 多需求组合（如 "帮我做雅思练习和单词记忆两个功能"）：提取单个主目标，第二需求会丢失。
- 否定+排除的复合表达（如 "最好不要有付费功能"）：正则覆盖有限，复杂否定可能漏判。
- 数量/规模约束（如 "预算 3000 元"）：无提取规则。
- 截止时间/优先级（如 "两周内完成 MVP"）：无提取规则。

以上类型均会走诚实降级路径：不生成来源不明的已确认事实，转为通用澄清问题。

---

## 关键规则说明

| 规则 | 实现位置 |
|------|----------|
| 事实候选永远是 pending，不自动 confirmed | `applyFacts()` |
| AI 关键词出现但无具体作用 → 必填问题 | `needsAiRoleQuestion()` + `ai_role` 问题 |
| 依赖图精确：audience/exclude 不受上游影响 | `DEPENDENCY_GRAPH` |
| 未知输入说明无法可靠抽取 | `coverageReport()` |
| 版本快照不可变 | `confirm()` + history 写入 |
| 模型接口有明确契约，不内嵌密钥 | `modelExtractInterface()` 注释 |
