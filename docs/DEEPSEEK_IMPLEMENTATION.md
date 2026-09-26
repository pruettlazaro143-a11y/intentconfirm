# v0.3 接入完成记录（Codex）

日期：2026-09-26。开发方：Codex；不是 IBM Bob 的新增工作。

| 文件 | 作用 |
| --- | --- |
| server/deepseek.cjs | 官方 DeepSeek API 适配、提示词、JSON 解析、超时与错误处理 |
| server/config.cjs / scripts/setup.cjs | 本机环境配置与隐藏密钥输入 |
| server.cjs | 本机服务、状态检查、同源请求、静态资源白名单 |
| src/ai-session.js | 模型输出校验、候选/用户同意分离、依赖失效、快照与导出 |
| src/ai-ui.js | 自由输入、模型动态追问、人工核对、显式调用、失败重试 |
| index.html / src/style.css / src/app.js | 模式切换、在线流程样式、保留离线入口 |
| tests/deepseek.test.cjs | 14项模拟接口与状态测试 |
| tests/ai-browser.cjs | 模拟API驱动的真实浏览器流程 |
| scripts/pack.cjs | 分享包生成，排除 .env 与运行依赖 |

此前 core.js 的 Bob 开发与 v0.2 Codex 修复保留。旧 modelExtractInterface() 仍是离线规则接口；在线路径走独立 ai-session.js 与服务端适配器，避免把旧接口桩冒充远程调用。

47项自动测试以及规则/在线路径浏览器测试通过。线上路径测试使用模拟模型返回；没有真实 API Key，没有真实 DeepSeek 请求。待本机配置后验证模型可用性、真实输出、成本与跨任务效果。

界面、状态与导出都保持“原文证据存在 ≠ 模型解释正确 ≠ 用户已经同意”的区别。用户仍需人工核对；模型能否发现所有关键缺口尚未证实。
