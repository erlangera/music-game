# Execution Plans

执行计划用于需要跨模块、跨会话或包含重要决策的任务。小型单文件修改不需要创建计划。

## Lifecycle

1. 从 [`_template.md`](_template.md) 创建 `active/YYYY-MM-DD-short-name.md`。
2. 工作期间持续更新进度、决定、验证结果和未决问题。
3. 任务完成后补齐最终结果并移动到 `completed/`。
4. 如果计划中的决定产生长期约束，把它提炼到架构、产品、领域文档或 ADR，不让 completed plan 成为唯一事实来源。

## Directories

- `active/`：仍需继续执行的计划。
- `completed/`：已完成的历史记录。

计划记录工作状态，不取代 issue tracker、PRD 或架构文档。
