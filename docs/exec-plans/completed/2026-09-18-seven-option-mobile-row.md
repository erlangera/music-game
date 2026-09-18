# 七音选项移动端单行布局

- Status: completed
- Owner: Codex
- Started: 2026-09-18
- Updated: 2026-09-18

## Goal

让所有恰好包含七个音名、唱名或简谱答案的选项区以 375px 手机屏幕为主要设计基准，在卡片内保持一行，同时兼容 320px 窄屏，并保留可辨识文字和足够的纵向点击高度。

## Scope

- In scope: 唱名训练、C 大调映射、自然大调三类七音题、半音/全音专项，以及唱名设置遮罩中的七音示例。
- Out of scope: 十二音键位选项、十二调设置、序列展示、钢琴键盘和非七项按钮组。

## Investigation

- 当前七音答题区统一在移动端使用四列，到 `sm` 或 `lg` 才切换七列。
- 涉及 `SolfegeMemoryPractice.vue`、`CmajorPractice.vue`、`MajorScalePractice.vue`、`ToneStepPractice.vue`。
- 375px 下七列按钮可在卡片内保持约 44px 宽；320px 下进一步收紧间距，仍保持单行且不产生横向滚动。

## Decisions

- 在全局样式中增加 `seven-option-grid`，仅用于恰好七个音乐答案的网格；以 375px 手机宽度优化，在卡片内部使用紧凑七列，`sm` 起恢复常规间距。
- 各题型保留自己的反馈颜色和业务逻辑，只统一网格与移动端字号、圆角、最小高度。

## Steps

- [x] 增加共享七选项网格样式与前端约定
- [x] 修改四个练习模块中的七音选项区
- [x] 完成静态检查及 375px、320px 浏览器验证

## Progress

- 2026-09-18：完成全仓检索，确认六处七音网格和一处设置占位示例需要调整。
- 2026-09-18：以 `seven-option-grid` 统一七处布局；根据视觉反馈移除视口全宽方案，改为在卡片内轻微扩展并以 375px 优化按钮大小，避免按钮脱离卡片。

## Verification

- `npm run check` 通过：lint、TypeScript、Vite 构建和 42 项领域测试全部通过。
- `git diff --check` 通过。
- 375×760 浏览器验证唱名数字、唱名文字、半音/全音、C 大调简谱、自然大调变化音/修复/音级映射均为卡片内单行七列；典型按钮宽约 44–45px、间距 4px。
- 320×640 窄屏回归仍为单行七列，按钮宽约 37px，没有越出卡片。
- 各验证页面 `scrollWidth === clientWidth`，无横向滚动；浏览器控制台无 warning/error。

## Open Questions

无阻塞问题。
