# Architecture

## System Summary

音阶阶目前是一个纯前端单页应用。浏览器加载 Vite 构建的资源，`src/main.ts` 创建 Vue 应用并挂载 `src/App.vue`。`App.vue` 在首页和唱名记忆训练之间切换，训练交互封装在 `SolfegeMemoryPractice.vue` 中。当前数据和答题结果只存在组件内存中，没有后端、路由、全局状态库或持久化层。

```text
Browser
  -> index.html
  -> src/main.ts
  -> src/App.vue
       -> homepage prototype
       -> src/components/SolfegeMemoryPractice.vue
            -> local question and scoring state
       -> Tailwind utilities + src/assets/main.css tokens
```

## Runtime Boundaries

- UI：Vue 3 单文件组件。
- 类型检查：TypeScript + `vue-tsc`。
- 样式：Tailwind CSS 4，经 Vite 插件处理。
- 构建：Vite，生产资源输出到 `dist/`。
- 发布：GitHub Actions -> GitHub Pages，公共路径为 `/music-game/`。
- 数据：当前仅为组件内静态数据；PRD 中的学习记录、本地存储、音频和 MIDI 均尚未实现。

## Current Constraints

- `src/App.vue` 仍承担首页结构和视图切换；唱名 S2 已拆为独立组件，但还没有正式路由和共享训练引擎。
- 仓库中保留 Vue starter components，但当前入口没有引用它们。
- 尚未建立自动化测试和 lint；现阶段 `npm run build` 是唯一仓库级质量门槛。
- 产品需求覆盖多个训练模块，但当前实现只代表首页原型，不能据此推断训练引擎已存在。

## Detailed Knowledge

- 代码结构与数据流：[`docs/architecture/index.md`](docs/architecture/index.md)
- 前端与样式约定：[`docs/architecture/frontend.md`](docs/architecture/frontend.md)
- 产品范围：[`docs/product/index.md`](docs/product/index.md)
- 领域不变量：[`docs/domain/music-theory.md`](docs/domain/music-theory.md)
- 当前质量策略：[`docs/quality/index.md`](docs/quality/index.md)
