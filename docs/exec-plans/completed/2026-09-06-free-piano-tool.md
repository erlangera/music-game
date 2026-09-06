# Free Piano Tool

- Status: active
- Owner: Codex
- Started: 2026-09-06
- Updated: 2026-09-06

## Goal

新增不计分、不出题的自由钢琴工具页，并建立可继续加入其他乐器或音乐工具的路由、目录和音频边界。

## Scope

- In scope: 一个八度自由钢琴、鼠标/触摸/电脑键盘演奏、音量、声音状态、首页工具入口、工具元数据、通用乐器音频契约。
- Out of scope: 工具中心列表页、更多乐器、双八度、录音、延音踏板、MIDI 设备和练习记录。

## Investigation

- `PianoKeyboard.vue` 已有一个八度几何和可访问琴键，但视觉状态只覆盖测试反馈。
- `usePianoAudio.ts` 当前 `play` 会先停止全部声音，不能支持自由演奏中的和弦或按住发声。
- Tone adapter 已是多声音源，但公开契约只有定长播放和全停。
- 首页的导航项目前是字符串和占位点击，工具入口尚未建模。

## Decisions

- 新路由使用 `/tools/piano`，为同类工具保留稳定命名空间；暂不为空目录额外创建工具中心页面。
- 通用 `InstrumentAudioEngine` 定义持续音符和定长音符；具体钢琴采样仍封装在 piano adapter 中。
- 工具元数据单独放在 `src/tools/catalog.ts`，首页只消费元数据；新增工具无需进入训练领域。
- 自由钢琴不产生题目、判分、正确率或学习记录。

## Steps

- [x] 扩展音频契约和 Vue composable，支持复音按下/松开。
- [x] 扩展通用琴键组件的自由演奏视觉和指针事件。
- [x] 新增工具清单、自由钢琴页面、路由和首页入口。
- [x] 更新架构、产品与质量文档。
- [x] 运行完整检查并完成浏览器定向验证。

## Progress

- 2026-09-06：确认现有琴键、路由和声音引擎边界，完成方案拆分。
- 2026-09-06：实现 `/tools/piano`、工具目录和首页入口；通用音频契约增加复音按下/松开，保留共享钢琴采样缓存。
- 2026-09-06：将钢琴几何与 MIDI 映射从训练领域拆到 `domain/piano.ts`，完成门禁和浏览器回归。

## Verification

- `npm run check`：通过；ESLint 无警告，Vue/TypeScript 类型检查、Vite 生产构建和 9 项 Node 测试通过。
- `git diff --check`：通过。
- 浏览器：从首页移动导航进入 `/tools/piano`；Salamander 状态 ready；12 键可操作，音量 72% → 35% 同步；电脑键盘顺序输入触发；返回训练页开始一题并点击正确黑键，原训练语义仍隐藏音名且判题正常。
- 复音按下/松开由 Tone `triggerAttack/triggerRelease` 和独立 active note 集合实现；自动化环境未进行主观音色、触摸多指或实体设备听感验收。

## Open Questions

无阻塞问题。
