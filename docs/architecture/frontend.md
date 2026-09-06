# Frontend Guide

## Current Stack

- Vue 3.5，使用 Composition API 和 `<script setup>`。
- Vue Router，使用 hash history 兼容 GitHub Pages 静态托管。
- TypeScript 6，由 `vue-tsc --build` 做类型检查。
- Vite 8 负责开发服务器和生产构建。
- Tailwind CSS 4 通过 `@tailwindcss/vite` 集成。
- ESLint 使用 Antfu config；`eslint-plugin-better-tailwindcss` 读取 `src/assets/main.css` 并检查 Vue 模板中的 Tailwind class。

具体版本以 `package.json` 和 `package-lock.json` 为准。

## Styling

`src/assets/main.css` 是唯一入口样式。它包含：

- `@import 'tailwindcss'`；
- `@theme` 中的字体、语义颜色和阴影 token；
- 页面背景、字体渲染、焦点态和安全区基线。

新增可复用视觉语义时，优先扩展 token；一次性的尺寸或布局可直接使用 utility。不要重新接入未使用的 `src/assets/base.css`，除非先清理它与现有全局样式的冲突。

## Component Boundaries

当前 `App.vue` 只承载 `RouterView`，页面级编排位于 `src/views/`，`SolfegeMemoryPractice.vue` 封装首个可操作训练。继续扩展时按真实复用和状态边界拆分，而不是预先创建空层级：

- 页面级编排留在 view/page；
- 可独立表达且重复出现的交互提取为 component；
- 乐理规则、题目生成和评分放在纯 TypeScript domain 模块；
- 浏览器音频、MIDI、本地存储等副作用放在独立 adapter/service 或 composable 中；唱名 MP3 播放由 `useSolfegeAudio.ts` 管理，可演奏乐器通过 `audio/instrumentAudio.ts` 通用契约、乐器专用 adapter 和 composable 分层。
- 不计分工具位于 `src/views/tools/`，发现元数据位于 `src/tools/catalog.ts`；工具不得依赖题目生成和判分状态。新增同类工具使用 `/tools/<id>` 路由，只有确实出现多个工具时再增加工具中心页。

## Interaction and Accessibility

- 使用语义化元素，按钮和链接保留明确职责。
- 仅图标控件必须有 `aria-label` 或等价的可访问名称。
- 焦点样式不可移除；键盘用户必须能完成关键流程。
- 适配至少 320px 移动端宽度和桌面布局。
- 音频功能必须由用户手势启动，并为不可播放状态提供清晰反馈。

## State

钢琴训练的设置/练习/结果由 `KeyboardMemoryPractice.vue` 管理；自由钢琴只持有当前按键和音量，不创建训练会话。琴键几何、音名与 MIDI 映射在 `domain/piano.ts`，出题和判分留在 `domain/keyboardPractice.ts`。琴键视觉独立为 `PianoKeyboard.vue`，通过 props 决定是否展示音名和按压态，因此训练作答前不会通过文字或可访问名称暴露答案。纯领域生成支持随机函数注入，展示控制器支持时钟注入（独立于答题进度）。`usePianoAudio.ts` 只管理 Vue 订阅和组件生命周期，共享 Tone adapter 持有 AudioContext、已解码采样与合成降级音源；组件离开时停止当前音符，但不销毁可跨路由复用的采样缓存。

音频状态为 `idle/loading/ready/fallback/unavailable`。键位设置页和自由钢琴页可在不解锁播放的情况下预加载样本；“开始训练”、琴键按下和电脑键盘输入属于用户手势，用于解锁 AudioContext。采样未就绪或失败时基础合成器仍可发声，音频不可用不阻塞视觉交互。通用契约同时提供定长 `playNote` 和持续 `startNote/stopNote`：训练可使用前者，自由乐器和未来 MIDI 输入使用后者。

当前首页临时交互存在于 `HomeView.vue`，页面切换由路由负责，唱名训练的设置、会话、逐项判分和本轮结果存在于 `SolfegeMemoryPractice.vue`；类型和受控题目生成位于 `src/domain/solfegePractice.ts`。这些业务状态均不持久化；刷新训练路由会重新进入设置弹窗。引入全局状态库前，应先证明存在跨页面共享、复杂派生状态或调试需求；简单状态优先使用组件状态或 composable。
