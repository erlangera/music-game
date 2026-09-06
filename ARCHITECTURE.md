# Architecture

## System Summary

音阶阶目前是一个纯前端单页应用。浏览器加载 Vite 构建的资源，`src/main.ts` 创建 Vue 应用、注册 Vue Router 并挂载 `src/App.vue`。`App.vue` 只承载路由出口，首页、训练和音乐工具分别由独立 view 编排。当前数据和答题结果只存在组件内存中，没有后端、全局状态库或持久化层。

```text
Browser
  -> index.html
  -> src/main.ts
       -> src/composables/instrumentInjection.ts
            -> src/audio/pianoInstrument.ts
       -> src/router/index.ts (hash history)
       -> src/App.vue (RouterView)
            -> src/views/HomeView.vue
            -> src/views/KeyboardPracticeView.vue
                 -> src/components/KeyboardMemoryPractice.vue
                      -> src/components/PianoKeyboard.vue
                      -> src/domain/keyboardPractice.ts
                      -> src/domain/piano.ts
                      -> src/domain/pitch.ts
                      -> src/composables/useInstrumentPlayer.ts
                           -> injected src/audio/instrumentAudio.ts contract
                           -> src/audio/tonePianoAudio.ts
                                -> Tone.Sampler + self-hosted Salamander samples
                           -> Tone.PolySynth fallback
            -> src/views/MajorScaleLearnView.vue
                 -> src/components/PianoKeyboard.vue (C4–B5 range)
                 -> src/domain/majorScale.ts
                 -> src/composables/useInstrumentPlayer.ts
            -> src/views/MajorScalePracticeView.vue
                 -> src/components/MajorScalePractice.vue
                 -> src/components/PianoKeyboard.vue (C4–B5 range)
                 -> src/domain/majorScale.ts
                 -> src/composables/useInstrumentPlayer.ts
            -> src/views/SolfegePracticeView.vue
                 -> src/components/SolfegeMemoryPractice.vue
                      -> local setup, session and scoring state
                      -> src/domain/solfegePractice.ts
            -> src/views/tools/PianoToolView.vue
                 -> src/tools/catalog.ts (tool discovery metadata)
                 -> src/components/PianoKeyboard.vue
                 -> src/domain/piano.ts
                 -> src/composables/useInstrumentPlayer.ts (shared injected engine/cache)
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
- 数据：唱名和钢琴领域数据、生成和判分位于 `src/domain/`，`pitchClass` 与具体 `midiNote` 分开建模；设置、会话和汇总仅在内存，逐项记录、本地存储、错题复盘和 MIDI 输入尚未实现。
- 音频：唱名继续由 HTML Audio composable 管理；可演奏乐器注册到应用级 `InstrumentRegistry`，共享平台无关的 `InstrumentAudioEngine` 契约和 `useInstrumentPlayer` 交互控制器。当前钢琴使用共享 Tone.js 适配器、自托管 Salamander 稀疏采样和 PolySynth 降级，支持定长音符、复音按下/松开、活动高亮及可取消序列。
- 工具：`/tools/:tool` 与训练路由分离，工具不出题、不判分、不写入训练记录；`src/tools/catalog.ts` 是导航发现信息，页面仍按路由懒加载。

## Current Constraints

- 当前真实路由为首页 `/`、唱名训练 `/solfege`、钢琴键位 `/keyboard`、自然大调学习 `/scales/learn`、自然大调练习 `/scales/practice` 和自由钢琴工具 `/tools/piano`；其他导航入口仍是规划占位。
- 唱名 S1–S4 的核心文字交互已拆为独立组件，并把题型与受控生成提取到纯 TypeScript 领域模块；逐项答题记录、随机题复现和错题回顾尚未实现，其他训练模块也尚无共享训练引擎。
- 仓库中保留 Vue starter components，但当前入口没有引用它们。
- 钢琴领域有 Node 原生确定性单元测试，覆盖生成/判分/展示控制器、MIDI note 转换和采样音域覆盖；`npm run check` 覆盖 lint、类型检查、生产构建和 `npm test`，尚无浏览器 E2E。
- 自然大调领域以 pitch class 计算、按调性保存拼写，并用具体 MIDI note 表示低八度起始的八音序列；课程、训练和自由钢琴共享同一个可配置 MIDI 范围的 `PianoKeyboard.vue`、统一高亮状态和注入的钢琴声音。
- 当前实现覆盖首页、模块一核心交互和模块二双向键位训练（含序列），不能据此推断完整训练引擎、记录或解锁闭环已存在。

## Detailed Knowledge

- 代码结构与数据流：[`docs/architecture/index.md`](docs/architecture/index.md)
- 前端与样式约定：[`docs/architecture/frontend.md`](docs/architecture/frontend.md)
- 产品范围：[`docs/product/index.md`](docs/product/index.md)
- 领域不变量：[`docs/domain/music-theory.md`](docs/domain/music-theory.md)
- 当前质量策略：[`docs/quality/index.md`](docs/quality/index.md)
