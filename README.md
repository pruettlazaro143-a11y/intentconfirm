# IntentConfirm

**让 AI 先问清楚，再动手。**

你说“帮我做个学习工具”，AI 却做出了一个你用不上的网站。IntentConfirm 把会影响结果的模糊点变成几道选择题：你选方向，也可以补充或让 AI 决定；信息足够后，由同一个 AI 继续完成任务。

它是一个开源 Skill，使用你当前 AI 的模型。**无需另配 API Key、无需启动服务器。** AI 工具本身的订阅或模型费用仍按原平台计算。

[下载 Skill](https://github.com/pruettlazaro143-a11y/intentconfirm/raw/refs/heads/main/downloads/intentconfirm-skill.zip) · [安装指南](docs/INSTALL.md) · [在线演示](https://intentconfirm-demo.q788x1zq.chatgpt.site) · [English](docs/README.en.md) · [反馈问题](https://github.com/pruettlazaro143-a11y/intentconfirm/issues/new/choose)

## 三步开始

1. **下载并解压**上面的 Skill 包，得到 `intentconfirm` 文件夹。
2. **放进你的 AI 工具的 Skills 目录**。Bob 项目中放到 `.bob/skills/intentconfirm/`；Claude Code 项目中放到 `.claude/skills/intentconfirm/`。最终应能找到对应的 `intentconfirm/SKILL.md`，不要多套一层目录。
3. 打开该项目、新建对话，输入下面的话，再接上你自己的需求。

> 请使用 IntentConfirm。先问清楚会影响结果的选择，每轮最多问三个；保留我已经说过的条件，信息足够后直接开始。我的需求是：……

Bob 可在 Settings → Skills 检查发现情况；Claude Code 可尝试 `/intentconfirm`。Mac 隐藏文件夹可用 `Command + Shift + .` 显示；不熟悉目录操作，请看[逐步安装与排错](docs/INSTALL.md)。

**没有 Skill 功能？** 可以把 [SKILL.md](.bob/skills/intentconfirm/SKILL.md) 的完整内容作为对话上下文，再发送需求。这只是当前对话的指令用法，不等于安装，也不保证自动调用或长期记忆。

## 它具体会做什么

- 每轮优先询问 1–3 个会改变目标、范围或结果的问题，给出具体选项。
- 允许字母回复、自然语言、补充答案和“这项你决定”。
- 保留已经说过的限制，不把猜测当成用户确认。
- 你改主意时，重新核对受影响的选择，保留无关条件。
- 信息足够后，整理简短需求并继续执行；清楚的小任务直接处理。

它适用于开发、写作和规划中的需求澄清。实际表现仍取决于宿主模型、可用上下文与工具，不保证消除所有误解。

## 一个真实例子

用户：“帮我做一个个人学习记录工具。”

Bob 先询问：记录什么、怎样保存、采用什么界面。用户回复 **BAA**，选定“书/课程的阅读进度 + localStorage + 单页 HTML”。对读完后的处理方式，用户回复 **C**，交给 AI 决定。Bob 说明“完成后保留历史”的默认选择，然后实现工具；用户打开后反馈符合预期。

[查看真实对话](docs/REAL_BOB_SESSION.md) · [查看原始截图](bob_sessions/README.md) · [操作生成的工具](https://intentconfirm-demo.q788x1zq.chatgpt.site/study-log/)

在线页面是**真实会话的回放与结果示例**；实际澄清在你自己的 AI 里进行。写作与规划的[上手示例](docs/EXAMPLES.md)为试用提示，不冒充真实用户验证。

## 兼容与要求

| 使用方式 | 当前状态 | 需要什么 |
| --- | --- | --- |
| IBM Bob | 已有真实激活、澄清、生成与用户反馈记录 | 可用的 Bob 账户和模型 |
| Claude Code | 按官方 Skill 目录提供安装方式；未完成真实宿主端到端验证 | 支持 Skills 的 Claude Code |
| 其他支持 SKILL.md 的工具 | 按宿主文档安装，兼容性待验证 | 宿主能读取指令 |
| 普通聊天工具 | 可尝试粘贴指令；非原生安装 | 模型能接收完整上下文 |

日常使用 Skill 不需要 Python 或 Node。可选安装脚本和结构化记录工具需要 Python 3.9+。仓库中的旧网页原型需要 Node 18+ 才能启动可选服务，它不是 Skill 的使用前提。

## 下载与更新

- [轻量 Skill 包](https://github.com/pruettlazaro143-a11y/intentconfirm/raw/refs/heads/main/downloads/intentconfirm-skill.zip)：只含运行指令、引用材料、可选记录工具和许可证，不含参赛截图、网页服务器或密钥。
- [完整源码 ZIP](https://github.com/pruettlazaro143-a11y/intentconfirm/archive/refs/heads/main.zip)：供开发、查看测试与贡献记录使用。
- [更新记录](CHANGELOG.md) · [下载校验](downloads/README.md) · [贡献指南](CONTRIBUTING.md)

当前公共分发版本 **0.5.0**，核心 Skill 行为延续上一版；本次完善安装、下载和说明。更新前将修改过的旧 Skill 备份到 Skills 目录外，再替换并新开对话。卸载只需删除自己安装的 `intentconfirm` 目录。

## 开发与证据

```sh
python3 -m unittest discover -s .bob/skills/intentconfirm/scripts -p 'test_*.py'
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/package_skill.py --check
npm test
```

38 项 Skill 记录测试、8 项分发测试、47 项网页测试通过。测试不等于所有模型兼容，也不等于已测得返工率或时间节省。

IBM Bob 参与了澄清引擎、需求更新工具和真实使用流程。Codex 完成初始原型、Skill 整理、后续审阅和公共分发。保留[Bob 开发记录](docs/BOB_SKILL_COMPLETION.md)、[Codex 修订记录](docs/CODEX_SKILL_REVIEW.md)及[参赛材料](docs/SUBMISSION_DRAFT.md)。参赛提交状态与用户安装无关。

[MIT 开源许可](LICENSE)。Skill 不内置联网模型调用；你输入的内容仍由所使用的 AI 平台处理。提交反馈前请删去密钥和私人对话。
