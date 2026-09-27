# 下载 IntentConfirm

公共分发版本：**0.5.0**。

[下载轻量 Skill ZIP](https://github.com/pruettlazaro143-a11y/intentconfirm/raw/refs/heads/main/downloads/intentconfirm-skill.zip) · [安装指南](../docs/INSTALL.md) · [SHA-256](intentconfirm-skill.sha256)

解压得到 `intentconfirm/`。只包含八个运行文件：Skill 指令、两份引用文档、两个可选 Python 记录工具、宿主元数据、图标和许可证。不包含测试、服务器、私人记录或参赛截图。

下载包免费；AI 宿主的订阅和模型收费不包含在内。默认下载链接跟随 main 更新，需要固定版本时可将链接中的 `main` 替换为已知的提交 SHA。

完整源码：仓库 **Code → Download ZIP**，或 `git clone https://github.com/pruettlazaro143-a11y/intentconfirm.git`。

校验下载完整性（可选）：同时下载同目录的 `.sha256` 文件，在下载目录执行 `shasum -a 256 -c intentconfirm-skill.sha256`（macOS）或 `sha256sum -c intentconfirm-skill.sha256`（Linux）。Windows 可运行 `Get-FileHash .\intentconfirm-skill.zip -Algorithm SHA256` 并与文件中的值比较。校验值用于完整性比较，不代表独立的发布者签名。

维护者构建：`python3 scripts/package_skill.py`；校验与维护源一致：`python3 scripts/package_skill.py --check`。未独立创建 GitHub Releases 条目；此处为仓库内可直接下载的分发包。
