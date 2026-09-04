# 音阶阶

面向中文简谱初学者的音高与乐理训练 Web 应用，通过简谱、首调唱名、音名、钢琴键位和声音之间的渐进练习，建立相对音高认知。

当前仓库处于 MVP 原型阶段，已实现首页/学习路径界面；完整产品范围见 [PRD](docs/music-theory-ear-training-prd-v1.md)。

## Tech Stack

- Vue 3 + TypeScript
- Vite
- Tailwind CSS 4
- ESLint + Antfu config
- npm

## Local Development

```sh
npm install
npm run dev
```

## Verification and Build

```sh
npm run lint
npm run build
npm run check
npm run preview
```

`npm run lint` 检查 Vue、TypeScript、Tailwind class 和仓库配置；`npm run build` 执行 Vue/TypeScript 类型检查并生成生产资源；`npm run check` 并行执行两者。当前仓库尚未配置单元测试或 E2E 测试。

## Project Knowledge

- Agent 工作入口：[AGENTS.md](AGENTS.md)
- 架构总览：[ARCHITECTURE.md](ARCHITECTURE.md)
- 项目知识索引：[docs/index.md](docs/index.md)
- 产品需求：[docs/music-theory-ear-training-prd-v1.md](docs/music-theory-ear-training-prd-v1.md)
- AI 项目初始化 Skill：[.github/skills/ai-project-init/SKILL.md](.github/skills/ai-project-init/SKILL.md)

项目知识按需加载：instructions、长期知识、工作流程、执行计划和代码事实分别维护，避免依赖单一 memory 文件。

## Deployment

`main` 分支更新、release 发布或手动触发 workflow 时，GitHub Actions 会构建并部署 `dist/` 到 GitHub Pages。Vite 的站点 base path 为 `/music-game/`。
