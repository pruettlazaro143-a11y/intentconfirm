# DeepSeek 本地配置与首次实测

## 在 Bob 中操作

File → Open Folder 选择解压出的 intentconfirm 文件夹。左侧应该同时看见 index.html、package.json、src 和 docs。Terminal → New Terminal，执行：

```sh
npm run setup
npm start
```

第一条命令会等待你粘贴 DeepSeek API Key；输入不会显示。模型名按回车使用 deepseek-flash。设置结束后再运行第二条，保留终端开着，在浏览器访问 http://127.0.0.1:4173 。

如提示 npm 找不到，请先安装 Node.js（项目要求18或更新版本），重新打开 Bob 终端。不要在 Bob 聊天框中发送密钥。密钥来自 https://platform.deepseek.com/ 的 API 管理页面。

也可复制 `.env.example` 为 `.env`，只在本机填写 DEEPSEEK_API_KEY；修改后重启服务。模型配置必须是你的 API 账户支持的模型 ID。默认值根据接入时查阅的官方文档设为 deepseek-flash。

## 第一轮检查

输入自己的真实需求，也可先用：

> 给我做一个个人 AI 雅思网站，我每天只有20分钟，不想注册登录，主要想提高口语。

应看到来自实际调用的理解摘要、带原文引用的候选以及具体追问。观察是否保留20分钟和不要登录，是否问到口语输入/反馈等真正影响结果的内容；**这不是承诺模型必然这样回答，需要实际验证。**

确认或否定候选，选择问题答案，然后点击“继续分析”。全部必要内容明确并完成新一轮分析后，核对需求单并确认。修改目标再检查：原确认状态应解除，关联项需重新核对，历史版本保留。

再试两种不同任务，例如“帮我准备面试”和“给我们店写活动文案”。目标是检验问题是否随任务变化，而不是沿用雅思题目。

## 常见提示

| 提示 | 怎么处理 |
| --- | --- |
| 尚未配置 API Key | 在项目根目录运行 npm run setup，再重启服务 |
| 密钥无效 | 在本机重新配置有效的 API Key |
| API 余额不足 | 查看 DeepSeek API 控制台余额；Bob 额度不支付 DeepSeek 调用 |
| 不接受参数或模型 | 检查 .env 的 DEEPSEEK_MODEL 与账户支持的模型是否一致 |
| 无法连接 / 超时 | 检查本机网络，点击重试；已有需求保留 |
| 无效 JSON / 证据不在原文 / 改变已有定义 | 本次模型内容未采用；可以重试，重复发生时导出草稿反馈问题 |
| 答案已有变化 | 点击继续分析后再确认最终版本 |

每次请求最多等待45秒；没有自动重试。页面每个任务最多记录20次成功分析；本地服务另有限流。失败调用也可能产生提供方费用。默认最大输出4096 tokens，无每轮价格承诺。

## 分享改动

在终端运行 `npm run pack`，分享生成在项目外的 intentconfirm-share.zip。该命令排除 .env。不要直接把包含本地密钥的整个文件夹压缩上传。代码不要求你上传或展示密钥。

## 接口依据与验证状态

- 官方接口：https://api-docs.deepseek.com/
- JSON 输出：https://api-docs.deepseek.com/guides/json_mode/
- 请求固定发往 https://api.deepseek.com/chat/completions
- 服务端使用 Bearer 认证、JSON 输出、非流式响应；模型默认 deepseek-flash，thinking disabled。

截至本包制作时，Codex 没有获得 API Key，未执行真实调用。自动测试使用模拟返回，只证明状态处理与接口接线通过测试，不能证明 DeepSeek 的实际可用性、语义质量或成本。
