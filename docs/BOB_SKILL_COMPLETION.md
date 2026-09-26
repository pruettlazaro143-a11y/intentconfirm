# BOB_SKILL_COMPLETION — Bob Task 02 执行记录（第二轮修订）

执行日期：2026-09-26。本文记录 Bob 两轮执行任务02所做的实际改动、测试结果和仍需用户操作的事项。

---

## 一、实际改动文件清单

### 第一轮（审计+测试补全）

| 文件 | 操作 | 说明 |
|---|---|---|
| `.bob/skills/intentconfirm/scripts/test_check_brief.py` | 新增1个测试 | `test_stale_upstream_makes_active_child_a_blocking_item`：补充"上游变 stale 后下游活跃项被阻塞"专项测试 |
| `docs/BOB_SKILL_COMPLETION.md` | 新建 | 本文件（首次创建） |

### 第二轮（新增功能：需求更新工具）

| 文件 | 操作 | 说明 |
|---|---|---|
| `.bob/skills/intentconfirm/scripts/update_brief.py` | 新建 | 需求更新工具：接收旧记录+有用户来源依据的修改，传递失效，写出新草稿 |
| `.bob/skills/intentconfirm/scripts/test_update_brief.py` | 新建 | 14项测试：A→B→C 失效传播、无关项保留、原文件不变、旧批准清除 |
| `.bob/skills/intentconfirm/references/record-format.md` | 追加章节 | 新增"Applying updates with update_brief.py"使用说明 |
| `docs/BOB_SKILL_COMPLETION.md` | 重写 | 本文件（第二轮更新） |

**未被修改的文件**（已合规，无需改动）：
- `.bob/skills/intentconfirm/SKILL.md`
- `.bob/skills/intentconfirm/scripts/check_brief.py`
- `README.md`、`docs/PRODUCT.md`、`scripts/pack.cjs`

---

## 二、新增工具：update_brief.py

### 职责

接收一份已有 JSON 需求记录（只读）和一个 patch 列表，输出更新后的新草稿。绝不修改输入文件或历史快照。

### 每条 patch 必须提供

```json
{
  "id": "goal",
  "field": "value",
  "new_value": "展示作品或业务",
  "evidence": {"source": "u3", "quote": "改成作文练习"}
}
```

- `evidence.source` 必须已存在于记录的 sources 列表中，且 `role` 必须为 `"user"`。
- `evidence.quote` 必须逐字出现在该 source 的 `text` 中。
- 所有 patch 在任何修改发生前全部校验（原子失败）。

### 失效传播逻辑

1. 对直接被 patch 的 item 应用变更。
2. BFS 沿依赖图找到所有传递性依赖的、状态为 `ACTIVE`（stated/confirmed）的 item。
3. 将这些 item 状态改为 `stale`，并移除其 `confirmation` 字段（已不再有效）。
4. 无关 item（不在依赖路径上）保持不变。
5. 清除整体批准 `approval` 字段——新草稿尚未重新获批。
6. 用 `check_brief.inspect()` 校验输出，无效则 exit 2，不写文件。

### 使用命令

```sh
# 从 Skill 目录：
python3 scripts/update_brief.py old_brief.json patches.json new_brief.json

# 内联 patch：
python3 scripts/update_brief.py old_brief.json \
  '[{"id":"goal","field":"value","new_value":"展示作品或业务","evidence":{"source":"u3","quote":"改成作文练习"}}]' \
  new_brief.json

# 强制覆盖已存在的输出：
python3 scripts/update_brief.py old_brief.json patches.json new_brief.json --force
```

Exit 0 打印摘要 JSON（`stale_propagated`、`approval_cleared`）；exit 2 打印 `{"updated": false, "error": "..."}`。

### 工具限制（与 check_brief.py 相同级别）

程序只检查和操作提供给它的数据结构，不能验证来源身份、证明语义正确或需求完整。同一 AI 填入"用户已同意"不构成独立安全证据。不要宣传为不可绕过的权限系统。

---

## 三、check_brief.py 已有能力（非本轮新增）

以下由 Codex 初稿实现，本轮未修改：

| 检查项 | 实现 |
|---|---|
| confirmed 必须引用实际用户响应 | `quotation(..., user_only=True)` on `confirmation` |
| 引用文本逐字存在于来源 | `quotation()` 函数 |
| 用户/模型来源分开 | `role` 验证 |
| 关键未知/失效项 → blocking_items | lines 85, 93 |
| 依赖存在性 + 无环检测 | ID 存在性检查 + DFS |
| 上游非 active → dependency_conflicts | lines 86-93 |
| approval digest 不匹配 → approval_current=False | lines 94-99 |
| rejected/excluded 保留为合法状态 | STATUSES 集合 |

---

## 四、执行命令与测试结果

### npm test（47 项，Node.js）

```
npm test
# tests 47 / pass 47 / fail 0
```

### python3 test_check_brief.py（11 项 Python）

```
python3 .bob/skills/intentconfirm/scripts/test_check_brief.py -v
# Ran 11 tests in ~0.06s — OK
```

第一轮新增 1 项（`test_stale_upstream_makes_active_child_a_blocking_item`），全部通过。

### python3 test_update_brief.py（14 项，本轮新增）

```
python3 .bob/skills/intentconfirm/scripts/test_update_brief.py -v
# Ran 14 tests in ~0.10s — OK
```

测试覆盖（均由 apply_patches() 实际执行，无预填 stale 数据）：

| 测试名 | 验证内容 |
|---|---|
| `test_changing_A_marks_B_and_C_stale_not_unrelated` | A→B→C 传递失效；audience/no_login 不受影响 |
| `test_changing_B_marks_C_stale_but_not_A_or_unrelated` | B→C 失效；A（上游）和无关项不变 |
| `test_approval_cleared_after_update` | 有批准记录时更新后 approval 消失 |
| `test_approval_cleared_even_if_no_items_actually_changed` | 即使值未变，approval 也被清除 |
| `test_original_record_unchanged` | apply_patches 不修改输入 dict |
| `test_output_is_structurally_valid` | 输出通过 check_inspect() |
| `test_patch_without_user_evidence_fails` | assistant source 被拒绝 |
| `test_patch_with_fabricated_quote_fails` | 不存在的引用被拒绝 |
| `test_patch_targeting_unknown_item_fails` | 不存在的 item ID 被拒绝 |
| `test_stale_items_lose_their_confirmation_field` | stale item 的 confirmation 被移除 |
| `test_cli_writes_output_and_does_not_modify_input` | CLI 写出正确输出，输入文件不变 |
| `test_cli_refuses_to_overwrite_output_without_force` | 不加 --force 拒绝覆盖已有文件 |
| `test_cli_refuses_to_write_output_same_as_input` | 输出路径=输入路径时拒绝 |
| `test_rejected_items_preserved_unchanged` | rejected item 在更新后保留，状态不变 |

---

## 五、五个区分级别的当前状态

| 级别 | 状态 |
|---|---|
| **文件存在** | ✅ `.bob/skills/intentconfirm/` 包含 SKILL.md、check_brief.py、update_brief.py 及测试 |
| **语法/单元测试通过** | ✅ npm test 47/47；Python check_brief 11/11；Python update_brief 14/14 |
| **Bob 原生发现 Skill** | ⚠️ 需用户在界面检查（见下） |
| **实际激活 Skill** | ⚠️ 需用户新开对话并观察 |
| **端到端开发成功** | ⚠️ 需用户完成真实使用流程后反馈 |

---

## 六、仍需用户操作的事项

1. **检查 Bob 是否发现 Skill**：打开 Bob Settings → Skills，确认 `intentconfirm` 出现在列表。若未出现，确认当前打开的是整个 `intentconfirm-bob-skill` 文件夹。
2. **新开对话验证激活**：Skill 每对话只加载一次；修改后需新会话验证。若出现激活授权提示，按意愿批准。
3. **真实使用流程**：在新对话中输入真实需求，要求使用 IntentConfirm；观察是否问到真正影响结果的内容、是否保留已说限制、修改一项时是否只重问相关内容、确认后是否继续完成可运行成果。
4. **会话截图**：将本次开发任务的 Bob 会话用量摘要截图和先前任务01截图分别保存到 `bob_sessions/`。
5. **端到端成果**：真实运行结果反馈给审阅者；任何由 Bob 自问自答产生的合成验证均标注为"合成检查"，不能替代真实用户会话。

---

## 七、不在本次 Bob 贡献中

- 旧网页 47 项测试（Bob 任务01已有）。
- 可移植 Skill 初稿、check_brief.py（Codex 制作）。
- DeepSeek 适配（Codex 实现）。
- 本次以外的任何编造的效果指标、截图或会话记录。
