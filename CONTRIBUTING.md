# Contributing / 参与改进

欢迎反馈“装不上、没有被发现、问太多、忘记约束、修改后重问无关项”等具体情况。

## 提交反馈

[新建 Issue](https://github.com/pruettlazaro143-a11y/intentconfirm/issues/new/choose)。提供工具名称与版本、操作系统、安装方式、简短复现请求、实际与期望行为。删去密钥、邮箱、路径中的个人信息和私人对话；能用合成示例复现时优先提供合成示例并标注。

## 修改代码

1. Fork 仓库并创建分支。
2. 阅读 `AGENTS.md` 和 `docs/PRODUCT.md`。Skill 的唯一维护源位于 `.bob/skills/intentconfirm/`，`downloads/` 中的 ZIP 是生成物。
3. 修改后运行相关测试。涉及 Skill 分发内容时重新生成 ZIP 及校验值。

```sh
python3 -m unittest discover -s .bob/skills/intentconfirm/scripts -p 'test_*.py'
python3 -m unittest discover -s scripts -p 'test_*.py'
python3 scripts/package_skill.py
python3 scripts/package_skill.py --check
npm test
```

4. PR 写清用户遇到的问题、变化、验证方法和仍未验证的宿主。一次修改集中解决一个问题。

不增加默认联网调用，不提交 `.env` 或私人需求记录，不以模拟会话冒充用户验证。新宿主兼容报告应说明是否仅检查目录，还是实际发现、激活并执行了任务。

贡献以本仓库 MIT 许可证发布。不能保证 Issue 响应时间；请在公开讨论中保持尊重。
