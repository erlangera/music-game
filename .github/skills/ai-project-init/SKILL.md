---
name: ai-project-init
description: 为已有或新建代码仓库初始化、审计或刷新 repository-native 的 AI 项目知识架构。适用于用户要求创建 AGENTS.md、项目知识目录、ADR、执行计划或让仓库更适合 coding agent 的场景；不用于脚手架生成业务应用代码。
---

# AI Project Init

目标是让 Agent 知道项目事实在哪里、哪些内容尚未确认，以及如何验证修改。生成与仓库相符的知识系统，不复制一个固定目录树。

## Workflow

### 1. Discover the repository

在写文件前：

- 读取作用域内现有的 `AGENTS.md` 和其他 Agent instructions；
- 检查 `git status --short`，保护用户未提交改动；
- 用 `rg --files` 盘点 manifest、lockfile、源码入口、测试、CI、部署和现有文档；
- 读取实际命令、关键配置、产品文档和相关 diff；
- 将代码/配置/测试视为当前行为，将 PRD/spec 视为目标行为；冲突必须显式记录，不能自行抹平。

如果需要完整的分层、归属和过期判断，读取 [`references/knowledge-model.md`](references/knowledge-model.md)。

### 2. Select the smallest useful structure

通常需要：

- 根 `AGENTS.md`：简短的入口、命令、约束和 Definition of Done；
- `ARCHITECTURE.md` 或等价架构入口：当前系统摘要；
- `docs/index.md`：长期知识地图。

只在仓库已有对应事实时增加 architecture、product、domain、quality、decisions、references 或 generated 文档。复杂工作确实需要跨会话恢复时，增加 `docs/exec-plans/active/` 与 `completed/`。

仅当子树具有不同命令、架构或约束时创建嵌套 `AGENTS.md`。仅当流程会重复且包含非显然步骤时创建项目 Skill。不要生成空目录、重复入口或无事实内容的占位百科全书。

需要起草文件时，读取 [`references/templates.md`](references/templates.md)，按仓库证据改写模板而不是原样复制。

### 3. Write canonical knowledge

- `AGENTS.md` 负责回答“Agent 在这里怎么工作”，并路由到细节；目标通常不超过 100–200 行。
- `docs/` 负责回答“项目是什么、现在如何工作”。
- `decisions/` 记录长期决定的背景、取舍和影响。
- `exec-plans/` 记录目标、范围、进度、决定、验证与未决问题。
- `generated/` 只存可追溯、可刷新、标明输入来源的派生知识。
- 工具支持的 skills 目录负责方法和流程，不硬编码当前项目的框架、目录或业务事实。

同一事实只保留一个规范来源，其他文件使用链接。明确标注 implemented、planned、proposed 或 unknown，禁止把推测写成现状。

### 4. Verify

- 运行仓库已经定义且与改动相关的 build、type-check、lint 或 tests；不要发明不存在的门槛。
- 检查 Markdown 相对链接、文件名和命令是否真实存在。
- 检查 `git diff`，确认只触及请求范围且未覆盖已有修改。
- 对新建 Skill 运行可用的 skill validator。
- 汇报创建/更新的知识入口、实际运行的验证和仍未解决的知识缺口。

## Boundaries

- 初始化知识架构不代表获准重构业务代码、安装依赖或启用外部服务。
- 不依赖聊天历史或自动记忆作为 source of truth；重要经验经验证和人工可审查后再提升为 docs、instructions 或 Skill。
- 不为了目录对称创建无内容文件，也不把所有文档塞进每次 Agent 上下文。
- 已有多工具 instructions 时，选一个规范知识源；工具专用文件只做必要适配，避免复制事实。
