# IntentConfirm — v0.3 DeepSeek 接入版

把模糊表达变成可确认、可交接的需求。雅思网站只是演示案例，产品针对用户与 AI 之间的理解偏差。

**已实现 DeepSeek 接入与本地配置；本包未附带密钥，尚未使用真实 DeepSeek API 验证模型表现。** 接口模拟、确定性状态测试和真实 Chromium 界面测试的范围见 `docs/TEST_REPORT.md`。

## 开始使用 DeepSeek

1. 解压整个项目，在 IBM Bob 中打开包含 `package.json` 的 **intentconfirm 根文件夹**，不要只打开 docs。
2. 打开终端（Terminal → New Terminal），运行 `npm run setup`。需要 Node.js 18 或更新版本，无须 npm install。
3. 按提示粘贴自己的 **DeepSeek API Key**，输入隐藏。模型名直接回车使用默认 `deepseek-flash`。
4. 运行 `npm start`，在浏览器打开 http://127.0.0.1:4173 。
5. 输入真实想法，点击“让 DeepSeek 梳理”。确认或否定它引用原文提出的候选，点选问题答案。
6. 点击“继续分析”让模型检查遗漏；确认单没有阻塞项后核对并确认，下载 Markdown/JSON 交给 Bob 实施。

密钥在 DeepSeek 开放平台 https://platform.deepseek.com/ 创建。DeepSeek 网页聊天账户和 API 配额不可直接视为同一项服务；以 API 控制台实际权限和余额为准。不要把密钥发到聊天或录屏中。`npm run setup` 仅把配置写到本机 `.env`，不联网验证。

停止服务按 Ctrl+C。修改 `.env` 后要重启。端口被占用时关闭旧服务或修改 `.env` 中的 PORT。完整说明见 `docs/DEEPSEEK_SETUP.md`。

## 什么时候会调用模型

只有点击初次分析、继续分析或重试才会发起模型调用。点选答案、核对确认单和导出不会自动调用。后续请求会发送原文、已有问题、候选及当前回答/状态。提供方按 API 计费；不做自动重试或后台循环。停止等待不保证上游取消计费。

密钥由本机 Node 服务读取，网页不接收密钥。服务仅监听 127.0.0.1；不适合直接公开部署。需求草稿保存在当前浏览器 localStorage，导出文件可备份。

## 不用密钥体验规则模式

双击 `index.html`，或在网页顶部切换“规则模式”。旧规则引擎与 DeepSeek 模式分别保存自己的草稿，不自动互相迁移。规则覆盖有限，不会伪装成模型理解。

## 核心能力与边界

- 模型按当前需求提出候选和每轮最多三个问题，用户可以点选、自定义、保持未知或标记不适用。
- 校验证据是否逐字出现在原文/已确认回答中；这不证明候选的语义推断正确，所以仍需用户确认。
- 模型不能设置用户确认。修改回答后要重新分析；已声明依赖的下游项会失效，历史版本保留。
- 模型错误、超时、余额不足或格式异常时保留已有需求，并明确显示失败。
- “可确认”是模型就绪判断与确定性状态检查的交集，不证明所有真实需求已经发现。用户仍须核对遗漏。
- 只将已采纳候选和已确认回答作为导出范围；保留拒绝、未知和不适用记录。任务执行及验收尚未实现。

## 测试与分享

- `npm test`：规则、在线会话状态、模拟接口与本地服务测试。
- `npm run test:browser`：规则模式浏览器回归。
- `npm run test:ai-browser`：模拟 API 响应下的真实浏览器流程，**不调用 DeepSeek**。
- 浏览器测试需要开发环境安装 Playwright/Chromium；它们不是运行应用的依赖。支持 PLAYWRIGHT_MODULE、CHROMIUM_EXECUTABLE 环境变量。
- `npm run pack`：在项目外生成 `intentconfirm-share.zip`，排除 `.env`、node_modules 和其他 zip。可用于把改动发回审阅；需要系统 zip 命令（macOS 通常自带）。

## 真实贡献记录

1. Codex：v0.1 项目骨架、界面、状态与导出。
2. IBM Bob：规则候选提取、动态选题、证据面板、依赖与 21 项测试，见原始 `docs/BOB_COMPLETION.md`。
3. Codex：v0.2 审阅修复与回归验证，见 `docs/CODEX_REVIEW.md`。
4. Codex：v0.3 DeepSeek 服务端适配、动态模型交互、配置、状态边界及测试。**这部分不记作 Bob 的工作。**

Bob 原始报告是历史记录，部分结论已在审阅中纠正。Bob IDE 的真实使用截图仍待加入 `bob_sessions/`。本包不代表已提交比赛，比赛文案需根据最终实测结果更新。

MIT License，见 LICENSE。
