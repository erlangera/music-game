# ADR 0001: Repository-native AI Knowledge

- Status: accepted
- Date: 2026-09-04

## Context

项目将长期使用 coding agent 辅助开发。单一 `memory.md` 或聊天历史会混合项目事实、工作指令、流程和临时状态，容易过期、冲突，也会在每次任务中浪费上下文。

## Decision

采用可版本控制、按需读取的项目知识结构：

- `AGENTS.md` 是简短入口和工作约束；
- `docs/` 保存架构、产品、领域和质量等长期知识；
- `.github/skills/` 保存当前仓库可复用的任务流程；
- `docs/exec-plans/` 保存复杂任务的临时状态；
- 源码、配置和测试/构建结果是最终事实；
- 生成索引只能作为可追溯、可重建的派生知识。

只在子目录有不同命令或约束时增加嵌套 `AGENTS.md`，避免复制根规则。

## Consequences

- Agent 可以渐进式加载上下文，而不必读取单个超长文件。
- 项目知识变化需要与代码改动同步维护。
- 相同事实只能有一个规范来源，其他入口使用链接。
- 会话记忆可以提供候选经验，但必须经验证后才能进入长期知识。

## Verification

- 根 `AGENTS.md` 能路由到各类知识。
- 项目事实可以追溯到代码、配置、PRD 或 ADR。
- 复杂任务可以在 `docs/exec-plans/` 中跨会话恢复。
- 项目初始化 Skill 不硬编码本项目的 Vue 或乐理实现。
