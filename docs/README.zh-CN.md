# IntentConfirm 使用说明

主产品是需求澄清 Skill，复用宿主模型，不要求独立平台、额外密钥或服务。

在 Bob 打开整个仓库，在 Settings → Skills 检查 intentconfirm，并新开对话要求使用它。项目 Skill 已在 .bob/skills/intentconfirm/。网页与 DeepSeek 适配仅供可选演示。

用户已提供真实 Bob 对话：通过 BAA 和 C 选择学习记录工具的方向，并反馈实际结果符合预期。完整整理见 REAL_BOB_SESSION.md。用户上传的原始示例已按字节原样放入 examples/study-log-demo/index.html；17 张真实会话截图见 bob_sessions/README.md，其中第 13 张显示 Used skill intentconfirm。

38 项 Skill Python 测试和 47 项网页测试通过，不能等同于全模型兼容或平均效率提升。Bob 开发记录与 Codex 后续修复分别保留。演示材料在 presentation/。

提交前还需补入真实任务摘要、示例源文件、录制视频，并由用户完成报名平台表单。状态见 RELEASE_STATUS.md。
