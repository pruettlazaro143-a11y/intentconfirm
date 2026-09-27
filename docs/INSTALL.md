# 安装与第一次使用

[返回首页](../README.md) · [English](README.en.md)

## 不写代码的安装方法

1. [下载轻量包](https://github.com/pruettlazaro143-a11y/intentconfirm/raw/refs/heads/main/downloads/intentconfirm-skill.zip)，解压后得到 `intentconfirm` 文件夹，里面应有 `SKILL.md`、`references`、`scripts` 等内容。
2. 找到你准备让 AI 操作的项目文件夹；没有项目时可以先新建一个空文件夹。
3. 根据工具，把整个 `intentconfirm` 文件夹放进下面的位置。缺少父文件夹时自行创建。

| 工具 | 项目内的位置 | 发现后如何调用 |
| --- | --- | --- |
| IBM Bob | `你的项目/.bob/skills/intentconfirm/SKILL.md` | Settings → Skills 检查；新对话说“请使用 IntentConfirm” |
| Claude Code | `你的项目/.claude/skills/intentconfirm/SKILL.md` | 在该项目启动新会话，使用 `/intentconfirm` 或主动请求调用 |
| 其他工具 | 参照该工具官方的 Skill 安装位置 | 不预设统一目录或命令 |

Mac Finder 用 `Command + Shift + .` 显示隐藏文件夹。也可用 `Command + Shift + G` 输入目录路径；目录尚不存在时，先创建它。Windows 文件夹名也要保留开头的点。

**Bob 有真实使用证据；Claude Code 的位置来自官方文档，尚未在该宿主完成端到端验证。** 当前说明不代表“所有 AI 都已兼容”。

## 第一次说什么

> 请使用 IntentConfirm，帮我做一个个人学习记录工具。先问清楚会影响结果的选择；保留我已经说过的条件；信息足够后实现第一版。

回答实际出现的问题，例如“1B，2A，3A”，也可以直接写自己的选择。每个请求的选项会变化，别把示例字母当固定答案。想交给 AI 决定的某项，可以明确说“这项你决定，先用最简单可修改的方案”。

如果想先看需求而不执行：

> 请使用 IntentConfirm，先帮我澄清这个想法并输出需求简报，暂时不要实现：……

## 可选：命令行安装与检查

仅下载轻量包的人按上面的手动步骤即可。以下命令需要**完整源码**以及 Python 3.9+；在解压后的仓库根目录运行。Windows 可将 `python3` 换为 `py -3`。

```sh
# 把路径替换成真实、已经存在的项目文件夹；含空格时保留引号。
python3 scripts/install_skill.py --client bob --project "/path/to/my-project"
python3 scripts/install_skill.py --client bob --project "/path/to/my-project" --check

# Claude Code 的项目目录安装（文件检查不等于宿主激活验证）
python3 scripts/install_skill.py --client claude --project "/path/to/my-project"

# 其他工具：由你按其官方文档提供最终的 Skill 目录
python3 scripts/install_skill.py --dest "/documented/skills/intentconfirm"
```

安装脚本只复制本地文件，不联网、不读取 `.env`，不覆盖有差异的旧安装。`--check` 只检查必要文件与当前下载版本是否相符，不能证明 AI 已加载或遵守 Skill。

## 常见问题

**下载后不知道怎么运行？**

Skill 不是独立应用，不需要双击运行 `SKILL.md` 或启动网页服务器。由 AI 工具读取它，再在原来的聊天中使用。

**Bob 看不到 Skill？**

检查工作区打开的是项目根目录，确认实际路径只有一层 `intentconfirm`，文件名为 `SKILL.md`，然后查看 Skills 设置并新建对话。如果有信任或激活提示，按宿主提示操作。

**AI 没有追问，是不是失效？**

清楚的小任务本来就不需要追问。先用一个有明显选择空间的需求测试，并明确说“使用 IntentConfirm”。检查宿主是否显示调用记录；单凭回答风格不能证明加载成功。

**必须付费或买 DeepSeek API 吗？**

IntentConfirm 按 MIT 协议免费使用。它复用现有 AI，原平台可能收取订阅或模型费用。Skill 不要求单独购买 DeepSeek 或其他 API。

**我用普通网页版聊天工具？**

打开仓库中的 [SKILL.md](../.bob/skills/intentconfirm/SKILL.md)，复制完整指令或作为文件提供，再写“请按这份 IntentConfirm 指令处理我的需求：……”。这是临时上下文用法，可能受平台文件读取和上下文限制影响；不会因此获得原生安装、持久记忆或脚本能力。

**怎么升级和卸载？**

先把有自定义修改的旧 `intentconfirm` 文件夹移到 Skills 目录之外备份，再放入新版本。不要把两个同名 Skill 留在扫描范围内。卸载仅删除自己安装的目录，然后按宿主方式刷新或开启新会话；其他项目和原有对话不会由本工具删除。

**隐私数据会发给谁？**

Skill 和可选 Python 检查器不自己调用联网模型。使用中的对话与文件仍遵循宿主 AI 的数据处理方式；“本地安装 Skill”不等于“模型本地运行”。不要将私人需求记录加入公共仓库。

## 安装依据

核对日期：2026-09-27。产品更新后以宿主文档为准。

- [IBM Bob 官方 Skills 文档](https://bob.ibm.com/docs/ide/features/skills)
- [Claude Code 官方 Skills 文档](https://code.claude.com/docs/en/skills)
