## Git commit 日志基本规范
```
<type>(<scope>): <subject>
<BLANK LINK>
<body>
<BLANK LINK>
<footer>
```
---
## Type 类型
> type 代表某次提交的类型，比如是修复一个Bug还是增加一个新的feature.
 - feat: 新增 feature。
 - fix: 修复Bug。
 - docs: 仅仅修改了文档，比如READNE，CHANGELOG，CHNTRIBUTE，CLAUDE，AGENGS等等。
 - style: 仅仅修改了空格，格式缩进，逗号等等，不改变代码逻辑。
 - refactor: 代码重构，没有加新功能或者修复Bug。
 - perf: 优化相关，比如提升性能、经验。
 - test: 测试用例，包括单元测试，集成测试等。
 - chore: 改变构建流程，或者增加依赖库，工具等。
 - revert: 回滚到上一个版本。
> ⚠️ style 和 refactor 的区别：
> 
> - style：纯代码格式调整，不改变任何逻辑（如：删除多余空行、修复缩进、添加分号）
> - refactor：代码逻辑发生变化，但功能行为不变（如：提取公共函数、优化数据结构）
> 
> 判断标准：这个改动会影响程序运行结果吗？
>
> 不会 -> `style`
>
> 会，但结果不变 -> `refactor`
---
## Scope 范围
> scope 用于说明本次 commit 影响的范围/模块，帮助快速定位变更位置。
常见 scope 示例（根据项目实际情况定义）：
 - **组件名**：Button、Table、Form、Modal
 - **模块名**：auth、user、payment、dashboard
 - **功能域**：api、routing、state、ui、utils
 - **配置类**：deps、config、build、ci
> 当 scope 难以界定时，可以忽略不写，仅保留 type。
---
## 格式要求
### 标题行（Subject）
 - **50 个字符以内**，描述主要变更内容
 - 使用现在时态（如：`add` 而不是 `added` ）
 - 首字母不要大写
 - 结尾不要加句号（./。）

### 主题内容（Body）
更详细的说明文本，建议 **72 个字符以内**。需要描述的信息包括：
 - **为什么**这个变更是必须的？—— 它可能是用来修复一个 Bug、增加一个 Feature、提升性能、可靠性、稳定性等等。
 - **如何解决**这个问题？—— 具体描述解决问题的步骤
 - **是否存在副作用、风险？** —— 如果有，需要明确说明

### 尾部（Footer）
如果需要，可以添加：
 - 链接到 Issue 地址或者其他文档。
 - 关闭某个 Issue：Closes #123，#456