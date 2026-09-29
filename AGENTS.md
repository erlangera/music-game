# Music Game Repository Guide

本文件是 Agent 的项目入口和知识地图，不是完整知识库。先按任务读取相关文档，再检查源码和当前 diff；当文档与代码冲突时，以代码、配置和可执行验证结果为准，并修正文档。

## Project Snapshot

- 产品：面向中文简谱初学者的音高与乐理训练 Web 应用，工作名“音阶阶”。
- 当前阶段：首页/学习路径原型、唱名文字/默写、十二音键位、C 大调简谱与琴键、十二个自然大调学习/练习、主音感与核心音级听辨、4/4 节奏入门与起音听写、自由钢琴；成绩仅在当次会话中保留，完整记录、复盘和解锁闭环仍为规划。
- 技术栈：Vue 3、Vue Router、TypeScript、Vite、Tailwind CSS 4、Tone.js。
- 包管理：npm，锁文件为 `package-lock.json`。
- 部署：GitHub Actions 构建并发布到 GitHub Pages，站点 base path 为 `/music-game/`。

## Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run check
npm run build
npm run preview
```

`npm run lint` 使用 Antfu preset 检查 Vue、TypeScript 和仓库配置，并通过 `eslint-plugin-better-tailwindcss` 校验 Vue 模板中的 Tailwind CSS 4 class。`npm run check` 执行 lint、`vue-tsc --build`、Vite 生产构建和 `npm test`，是当前最低验证门槛。`npm test` 使用 Node 原生测试器验证唱名、钢琴、C 大调、自然大调、相对音高及乐器注册表规则；尚无组件测试和浏览器 E2E。

## Repository Map

- `src/main.ts`：浏览器入口，加载全局样式、注册路由并挂载 Vue 应用。
- `src/App.vue`：根路由出口。
- `src/router/index.ts`：页面路由、hash history、滚动和页面标题。
- `src/views/`：首页与训练页的页面级编排。
- `src/components/SolfegeMemoryPractice.vue`：模块一训练设置、双向单项/序列交互、即时反馈和本轮汇总。
- `src/domain/solfegePractice.ts`：模块一领域类型、平衡出题、方向队列和唱名/简谱映射。
- `src/components/CmajorPractice.vue`、`src/domain/cMajorPractice.ts`：阶段三固定 C 大调简谱与琴键双向单音/序列、反馈和单轮结果。
- `src/components/KeyboardMemoryPractice.vue`、`PianoKeyboard.vue`：钢琴训练会话、反馈和虚拟琴键。
- `src/domain/pitch.ts`、`src/domain/piano.ts`、`src/domain/keyboardPractice.ts`、`src/domain/__tests__/`：音高/MIDI 类型、通用钢琴模型、训练生成、判分与确定性测试。
- `src/views/tools/`、`src/tools/catalog.ts`：不计分的音乐工具页和可扩展工具目录；当前包含自由钢琴。
- `src/views/MajorScale*View.vue`、`src/domain/majorScale.ts`：十三课自然大调学习和四类练习。
- `src/views/RelativePitch*View.vue`、`src/domain/relativePitch.ts`：相对音高入口、学习、主音感及核心音级听辨。
- `src/views/Rhythm*View.vue`、`src/domain/rhythm.ts`、`src/composables/useRhythmAudio.ts`：节奏图解试听、起音位置听写和 AudioContext 预约播放。
- `src/audio/`、`src/composables/useInstrumentPlayer.ts`：通用乐器声音契约、Tone.js 钢琴采样/合成降级实现和 Vue 状态包装。
- `src/assets/main.css`：Tailwind 入口、设计 token 和全局基础样式。
- `public/`：不经打包处理的唱名与自托管 Salamander 钢琴采样等静态资源。
- `docs/`：项目长期知识；入口见 `docs/index.md`。
- `.github/skills/`：随仓库版本控制的可复用 Agent 工作流，不存放项目事实。
- `.github/workflows/deploy-pages.yml`：GitHub Pages 构建与发布流程。

## Knowledge Routing

- 架构总览：`ARCHITECTURE.md`
- 详细架构与前端约定：`docs/architecture/`
- 产品范围和实现状态：`docs/product/index.md`
- 乐理术语与领域不变量：`docs/domain/music-theory.md`
- 完整 MVP 需求：`docs/music-theory-ear-training-prd-v1.md`
- 架构决策记录：`docs/decisions/`
- 长任务计划与进度：`docs/exec-plans/`
- 当前质量门槛：`docs/quality/index.md`
- 可再生成的仓库索引：`docs/generated/`

## Working Rules

1. 开始前查看 `git status --short`，保留用户已有和未提交的改动。
2. 修改模块前先读本文件、相关知识文档、源码入口和附近实现。
3. 区分事实与计划：已实现行为从代码和配置确认；未来功能从 PRD 读取并明确标注“规划中”。
4. 优先复用已有 Vue、TypeScript 和 Tailwind 模式；新增依赖必须有明确收益。
5. 不把聊天记录、临时记忆或生成文档当作唯一事实来源。
6. 复杂、跨模块或需要跨会话的任务，在 `docs/exec-plans/active/` 保存执行计划；完成后移到 `completed/`。
7. 改动架构、领域规则、产品边界或验证方式时，同步更新对应文档；只影响实现细节时不做无意义的文档 churn。

## Frontend Conventions

- 使用 Vue Composition API 和 `<script setup lang="ts">`。
- 保持 TypeScript 严格性，不用 `any` 绕过可建模的类型问题。
- 使用 `@/` 引用 `src/` 下模块。
- 视觉 token 优先定义在 `src/assets/main.css` 的 `@theme` 中，避免在多处复制语义颜色。
- 交互控件必须有可访问名称，并保持键盘焦点可见。
- 页面至少考虑 320px 宽度和桌面布局；不要只验证单一视口。
- 练习设置入口统一以唱名设置页为参考标准，复用 `PracticeSetupDialog.vue`，固定头部和底部、仅中间设置项滚动；新增或修改模块前读取 `docs/architecture/frontend.md` 的 Practice Setup Standard。

## Definition of Done

- 实现与用户请求、PRD 的当前范围一致，没有把后续规划顺手扩入。
- `npm run check` 通过。
- 受影响的关键交互在浏览器中完成针对性验证；若无法验证，明确说明。
- 没有覆盖无关的未提交改动。
- 新增事实能从代码、配置、测试或明确的产品文档追溯。
- 架构、产品边界、领域不变量或工作流发生变化时，相关知识文档已同步。
