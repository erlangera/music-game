# Initialize AI-native Project Knowledge

- Status: completed
- Owner: Codex
- Started: 2026-09-04
- Updated: 2026-09-04

## Goal

把项目初始化为 Agent 可发现、可版本控制、可渐进读取的知识仓库，并提供可复用的初始化 Skill。

## Scope

- In scope: 项目入口、架构/产品/领域/质量知识、ADR、执行计划结构、项目级 Skill。
- Out of scope: 修改产品运行时代码、引入测试框架、实现 PRD 功能。

## Decisions

- 使用 `AGENTS.md` 作为目录而非百科全书。
- 项目事实保存在 `docs/`，工作流程保存在 `.github/skills/`。
- 文档明确区分当前首页原型与 PRD 中尚未实现的能力。
- 当前项目规模不需要嵌套 `AGENTS.md`。

## Result

- 建立根入口和架构总览。
- 建立项目知识索引及领域目录。
- 建立 ADR 和执行计划生命周期。
- 建立 `ai-project-init` Skill。

## Verification

- 21 个 Markdown 文件的本地链接检查通过。
- Skill frontmatter、目录名和 `openai.yaml` 的等价 YAML 校验通过；官方 validator 因运行环境缺少 `PyYAML` 未能启动。
- `npm run build` 通过。
