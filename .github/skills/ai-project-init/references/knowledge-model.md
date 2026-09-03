# Repository-native Knowledge Model

## Layers and Ownership

| Layer | Answers | Canonical home | Update trigger |
| --- | --- | --- | --- |
| Instructions | Agent 在当前范围如何工作？ | `AGENTS.md`、必要的 tool adapter | 命令、约束、完成标准变化 |
| Project knowledge | 系统和业务当前如何工作？ | `docs/` | 架构、领域、产品或运维事实变化 |
| Decisions | 为什么选择当前方案？ | `docs/decisions/` | 接受或替代长期决定 |
| Procedure | 怎样可靠地执行重复任务？ | 工具支持的 skills 目录 | 流程经过实践验证后变化 |
| Task state | 复杂工作做到哪里？ | `docs/exec-plans/` | 任务推进、决定或验证时 |
| Derived knowledge | 哪些索引可从事实重建？ | `docs/generated/` | 输入或生成方法变化 |
| Experience cache | 会话中观察到什么？ | Agent memory / conversation | 仅作为候选线索，不直接成为事实 |

代码、配置、测试和运行结果是实现事实的最终裁判。PRD 和 specs 描述目标；ADR 描述被接受的选择；它们不应互相冒充。

## Progressive Disclosure

```text
task
  -> nearest AGENTS.md
  -> relevant docs index
  -> exact knowledge page or Skill reference
  -> source/config/tests
  -> implementation and verification
  -> update durable knowledge if a stable fact changed
```

入口必须足够短，让 Agent 能判断下一步读什么。不要把所有架构、API、业务规则和历史决定复制到 `AGENTS.md`。

## Initialization Modes

### Existing repository

先从证据恢复现状。保留已有术语和文档路径，优先整理和链接，避免无理由搬迁。对已存在但冲突的 instructions，报告规范来源和兼容策略。

### New or nearly empty repository

只写已经决定的技术栈、命令和边界。未知项明确为 unknown 或待决，不要替用户选择框架、数据库、部署平台或测试工具。

### Monorepo

根入口描述共享命令和导航。仅为有独立命令、所有权或架构约束的 package/app 创建嵌套入口；靠近工作目录的规则应更具体但不重复根规则。

## Staleness Checks

完成初始化或刷新时，检查：

- `AGENTS.md` 中命令是否存在于 manifest、Makefile 或 CI；
- 依赖、runtime 版本和部署路径是否与 lock/config 一致；
- 文档声称“已实现”的模块是否能从源码入口追踪；
- generated 文档是否写明输入、生成日期和刷新方式；
- active plan 是否仍有 owner、下一步和真实进度；
- completed plan 中产生的稳定结论是否已经提升到长期文档；
- 链接、重命名和删除是否造成孤立知识。

不要只凭文件修改时间宣布文档过期；先检查对应事实是否真的变化。
