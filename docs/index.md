# Project Knowledge Index

这里保存需要跨会话、跨 Agent 和跨人员长期维护的项目事实。入口文件只负责路由；执行任务时只读取与当前问题相关的文档。

## Knowledge Map

| 主题 | 入口 | 内容性质 |
| --- | --- | --- |
| 架构 | [`architecture/index.md`](architecture/index.md) | 当前系统结构、运行时边界和源码入口 |
| 前端 | [`architecture/frontend.md`](architecture/frontend.md) | Vue、TypeScript、样式和组件约定 |
| 产品 | [`product/index.md`](product/index.md) | 产品来源、当前实现范围、模块规则、经验与待决问题 |
| 领域 | [`domain/music-theory.md`](domain/music-theory.md) | 乐理术语和不可随意改变的业务规则 |
| 决策 | [`decisions/index.md`](decisions/index.md) | 重要技术与流程决策及其理由 |
| 质量 | [`quality/index.md`](quality/index.md) | 当前可执行检查与验证缺口 |
| 执行计划 | [`exec-plans/index.md`](exec-plans/index.md) | 复杂任务的进度、决策和验证记录 |
| 生成索引 | [`generated/index.md`](generated/index.md) | 可从仓库事实重新生成的派生知识 |
| 参考资料 | [`references/index.md`](references/index.md) | 规范和权威外部文档入口 |

## Canonical Sources

- 运行时事实：源码、`package.json`、TypeScript/Vite 配置和 CI。
- 产品意图：[`music-theory-ear-training-prd-v1.md`](music-theory-ear-training-prd-v1.md) 为完整 MVP 目标；当前交付切片与已接受调整见 [`product/index.md`](product/index.md) 及各模块文档。
- 本次基线审查：[`quality/2026-09-12-project-audit.md`](quality/2026-09-12-project-audit.md)。
- 工作方式：根目录 [`AGENTS.md`](../AGENTS.md)。
- 决策原因：`docs/decisions/` 中已接受的记录。
- 临时任务状态：`docs/exec-plans/active/`，完成后归档。

聊天记录和 Agent 自动记忆可以帮助发现线索，但不能替代以上事实来源。

## Maintenance Rule

知识应在产生变化的同一任务中更新。文档与代码不一致时，先确认当前可执行行为，再更新文档或记录待决问题；不要为了让两者看起来一致而虚构实现。
