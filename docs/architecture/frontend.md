# Frontend Guide

## Current Stack

- Vue 3.5，使用 Composition API 和 `<script setup>`。
- TypeScript 6，由 `vue-tsc --build` 做类型检查。
- Vite 8 负责开发服务器和生产构建。
- Tailwind CSS 4 通过 `@tailwindcss/vite` 集成。

具体版本以 `package.json` 和 `package-lock.json` 为准。

## Styling

`src/assets/main.css` 是唯一入口样式。它包含：

- `@import 'tailwindcss'`；
- `@theme` 中的字体、语义颜色和阴影 token；
- 页面背景、字体渲染、焦点态和安全区基线。

新增可复用视觉语义时，优先扩展 token；一次性的尺寸或布局可直接使用 utility。不要重新接入未使用的 `src/assets/base.css`，除非先清理它与现有全局样式的冲突。

## Component Boundaries

当前 `App.vue` 承载首页原型和本地视图切换，`SolfegeMemoryPractice.vue` 封装首个可操作训练页。继续扩展时按真实复用和状态边界拆分，而不是预先创建空层级：

- 页面级编排留在 view/page；
- 可独立表达且重复出现的交互提取为 component；
- 乐理规则、题目生成和评分放在纯 TypeScript domain 模块；
- 浏览器音频、MIDI、本地存储等副作用放在 adapter/service 层。

## Interaction and Accessibility

- 使用语义化元素，按钮和链接保留明确职责。
- 仅图标控件必须有 `aria-label` 或等价的可访问名称。
- 焦点样式不可移除；键盘用户必须能完成关键流程。
- 适配至少 320px 移动端宽度和桌面布局。
- 音频功能必须由用户手势启动，并为不可播放状态提供清晰反馈。

## State

当前首页状态和视图切换存在于 `App.vue`，唱名题目、判分和本轮结果存在于 `SolfegeMemoryPractice.vue`。这些状态均不持久化。引入全局状态库前，应先证明存在跨页面共享、复杂派生状态或调试需求；简单状态优先使用组件状态或 composable。
