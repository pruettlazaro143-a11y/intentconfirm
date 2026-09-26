# IntentConfirm 演示讲解稿

配套 8 页英文幻灯片。英文口播约 4 分钟，按实际语速调整；中英文任选其一，不需要连续读两遍。图片是演示排版，真实对话页为原记录英文转述，不能称为原始截图。

## 1. IntentConfirm

### English narration

IntentConfirm helps an AI coding assistant clarify what a user wants before it starts building. Users choose between concrete options inside their existing conversation. The assistant keeps those decisions and continues with the implementation. The Skill uses the host model, so it does not require a separate model API key.

### 中文讲解

IntentConfirm 帮助 AI 在开始开发前问清需求。用户不用写很长的提示词，只需在当前对话里选择具体选项，AI 保留这些决定并继续实现。Skill 复用宿主模型，不需要额外配置模型密钥。

## 2. Ambiguity before implementation

### English narration

A request such as build me a personal study tracker can mean several different products. One person wants daily study time. Another wants reading progress. Another wants searchable notes. If the assistant chooses silently, it can produce working code for the wrong task. IntentConfirm targets this gap between an initial request and implementation.

### 中文讲解

“做一个个人学习记录工具”可能指每日时长、阅读进度，也可能是带标签的笔记。这些选择会改变数据结构和界面。AI 如果直接替用户决定，代码可能能运行，却不符合用户预期。我们关注的是初始需求到代码实现之间的信息缺口。

## 3. The clarification workflow

### English narration

The Skill first preserves facts and constraints already present in the request. It asks about gaps that affect the result, using a few choices instead of an open-ended questionnaire. If the user says you decide, it states a reversible default. Once the scope is clear enough, the same assistant continues building. Clear requests can skip clarification.

### 中文讲解

Skill 先保留用户已经说过的条件，再针对影响结果的信息缺口提供选项。如果用户说“你决定”，就明确说明采用什么可逆默认值。信息足够后，当前 AI 继续开发。对于本来就清楚的请求，不强行增加问卷。

## 4. Real Bob session: four choices

### English narration

Here is the actual user session. Bob asked what to record, where to save it, and how to run it. The user replied BAA, selecting reading progress, browser storage, and a single HTML file. Bob then asked what should happen after an item is complete. The user replied C, delegating that choice. Bob explicitly chose to retain completed items as history.

### 中文讲解

这是本次真实会话。Bob 先问记录内容、保存方式和使用形式。用户回复 BAA，选择阅读进度、浏览器本地保存和单页 HTML。随后用户用 C 授权 Bob 决定完成后的处理方式，Bob 明确说明会保留完成记录。这里展示的是中文原对话的英文转述。

## 5. The agreed brief and delivered example

### English narration

Bob summarized the selected requirements and created the example in a separate directory. Its report describes adding resources, updating chapters and completion, and retaining completed items. The user opened the result and said the effect matched their expectations. This is evidence of one complete clarification-to-build interaction. It does not establish an average reduction in development time or rework.

### 中文讲解

Bob 汇总需求后，在独立目录中实现了学习记录工具。根据完成报告，它支持添加资料、修改章节和百分比、保留已完成记录。用户实际打开后反馈符合预期。这证明了一次从澄清到实现的完整流程，但不能据此宣称普遍减少了多少开发时间或返工。

## 6. Requirement changes keep their history

### English narration

For longer tasks, optional Python tools track evidence and dependencies. When a user changes a decision, the updated value becomes a candidate with the new evidence. Previously accepted dependent items become stale and need review. Unrelated constraints remain intact. The checker verifies record structure and quoted text, but cannot prove that the assistant interpreted the user correctly.

### 中文讲解

对于较长任务，可选 Python 工具记录依据与依赖关系。修改某个决定后，新值成为待核对候选；依赖它的已接受项会失效，需要重新核对；无关条件继续保留。检查器能验证记录结构和引文是否存在，不能证明 AI 的语义理解一定正确。

## 7. IBM Bob in development and use

### English narration

IBM Bob contributed to the clarification engine and the requirement update tool, including tests. It also served as the host for the real clarification session and built the study-log example. Codex created the initial prototype, packaged the Skill, and repaired edge cases after reviewing Bob’s code. The project records distinguish these contributions. The user supplied the product direction and accepted the resulting example.

### 中文讲解

IBM Bob 参与了澄清引擎、需求更新工具及测试的开发，并在真实使用时承载 Skill、完成学习记录示例。Codex 负责初始原型、Skill 打包和后续边界问题修复。项目记录分别保留双方贡献，用户负责方向、需求选择和成品验收。

## 8. Current evidence and next evaluation

### English narration

The current Skill has thirty-eight passing Python tests after review. We also have one real Bob interaction where the user selected the requirements and accepted the resulting example. These are different forms of evidence. We have not measured average productivity gains or validated every host. Our next evaluation will compare matched tasks for clarification effort, missed requirements, and rework. IntentConfirm makes important decisions visible before the assistant commits to an implementation.

### 中文讲解

当前修订版 Skill 的 38 项 Python 测试通过，也有一次用户选择需求并接受结果的 Bob 真实案例。自动化测试和真实案例分别证明不同内容。跨宿主兼容性、平均效率提升尚未测量。下一步会用匹配任务比较澄清负担、遗漏需求和返工情况。IntentConfirm 的价值目标，是让影响实现的关键决定在动手前可见。

