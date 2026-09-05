# Architecture

## System Summary

音阶阶目前是一个纯前端单页应用。浏览器加载 Vite 构建的资源，`src/main.ts` 创建 Vue 应用、注册 Vue Router 并挂载 `src/App.vue`。`App.vue` 只承载路由出口，首页、唱名和钢琴键位训练分别由独立 view 编排。当前数据和答题结果只存在组件内存中，没有后端、全局状态库或持久化层。

```text
Browser
  -> index.html
  -> src/main.ts
       -> src/router/index.ts (hash history)
       -> src/App.vue (RouterView)
            -> src/views/HomeView.vue
            -> src/views/KeyboardPracticeView.vue
                 -> src/components/KeyboardMemoryPractice.vue
                      -> src/components/PianoKeyboard.vue
                      -> src/domain/keyboardPractice.ts
                      -> src/composables/usePianoAudio.ts
            -> src/views/SolfegePracticeView.vue
                 -> src/components/SolfegeMemoryPractice.vue
                      -> local setup, session and scoring state
                      -> src/domain/solfegePractice.ts
       -> Tailwind utilities + src/assets/main.css tokens
```

## Runtime Boundaries

- UI：Vue 3 单文件组件。
- 路由：Vue Router，使用 hash history 兼容 GitHub Pages 静态托管。
- 类型检查：TypeScript + `vue-tsc`。
- 样式：Tailwind CSS 4，经 Vite 插件处理。
- 静态检查：ESLint + Antfu config，并校验 Vue 模板中的 Tailwind class。
- 构建：Vite，生产资源输出到 `dist/`。
- 发布：GitHub Actions -> GitHub Pages，公共路径为 `/music-game/`。
- 数据：唱名和钢琴领域数据、生成和判分位于 `src/domain/`，设置、会话和汇总仅在内存；逐项记录、本地存储、错题复盘和 MIDI 尚未实现。音频副作用分别由唱名 MP3 composable 和钢琴 Web Audio composable 管理。

## Current Constraints

- 当前真实路由为首页 `/`、唱名训练 `/solfege` 和钢琴键位 `/keyboard`；其他导航入口仍是规划占位。
- 唱名 S1–S4 的核心文字交互已拆为独立组件，并把题型与受控生成提取到纯 TypeScript 领域模块；逐项答题记录、随机题复现和错题回顾尚未实现，其他训练模块也尚无共享训练引擎。
- 仓库中保留 Vue starter components，但当前入口没有引用它们。
- 钢琴领域有 Node 原生确定性单元测试；`npm run check` 覆盖 lint、类型检查、生产构建和 `npm test`，尚无浏览器 E2E。
- 当前实现覆盖首页、模块一核心交互和模块二双向键位训练（含序列），不能据此推断完整训练引擎、记录或解锁闭环已存在。

## Detailed Knowledge

- 代码结构与数据流：[`docs/architecture/index.md`](docs/architecture/index.md)
- 前端与样式约定：[`docs/architecture/frontend.md`](docs/architecture/frontend.md)
- 产品范围：[`docs/product/index.md`](docs/product/index.md)
- 领域不变量：[`docs/domain/music-theory.md`](docs/domain/music-theory.md)
- 当前质量策略：[`docs/quality/index.md`](docs/quality/index.md)
