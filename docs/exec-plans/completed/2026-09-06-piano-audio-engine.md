# 钢琴声音引擎与键位记忆接入

- Status: completed
- Owner: Codex
- Started: 2026-09-06
- Updated: 2026-09-06

## Goal

建立与 UI、题目判分解耦的浏览器声音边界，使用自托管 Salamander 轻量采样和 Tone.js 为键位记忆提供真实钢琴声；采样不可用时自动回退基础合成音，且为后续具体音高、序列调度、音量和 MIDI 力度扩展保留稳定的数据入口。

## Scope

- In scope:
  - 明确 pitch class、MIDI note 与显示音名的边界。
  - 新增最小声音引擎契约和 Tone.js 实现。
  - 自托管 C4–B4 所需的稀疏 Salamander MP3 采样并记录授权来源。
  - 键位记忆进入页面后预加载，用户开始训练时解锁音频，点击琴键时播放。
  - 加载失败或未就绪时使用合成器降级，不阻塞答题。
  - 更新架构、产品与质量文档并完成自动化/浏览器验证。
- Out of scope:
  - 自动播放反向视觉题、听辨题、通用训练会话或持久化。
  - 多力度采样、踏板、共鸣、混响、MIDI 设备接入。
  - 唱名语音迁移到同一引擎。

## Investigation

- 当前 `usePianoAudio.ts` 每次创建三角波单音并在组件卸载时关闭 AudioContext。
- `KeyboardMemoryPractice.vue` 只在“音名 → 琴键”作答时调用 `play(60 + pitchClass)`；视觉演示不发声。
- 当前领域类型 `Pitch` 表示 0–11 的 pitch class，具体 MIDI note 尚未建模。
- PRD 要求用户手势解锁、加载状态、合成器回退、统一停止、总音量和未来基于音频时间线的序列调度。
- Tone 官方 Salamander 浏览器集是单力度、稀疏锚点采样；C4、D#4、F#4、A4、C5 可让 C4–B4 内插值不超过一个半音。

## Decisions

- Tone.js 只存在于 `src/audio/` 适配器，不进入组件和领域判分。
- 当前实现只暴露已使用的 prepare/unlock/play/stop/volume/dispose 能力；未来序列播放在真正接入听辨模块时扩展，避免空抽象。
- 播放 API 接收 MIDI note，不接收 `C#4` 等显示字符串；等音拼写不影响发声。
- 采样按页面懒加载；Sampler 未就绪或失败时由同一 Tone 上下文中的 PolySynth 发声。
- 当前维持固定时长单音语义，不提前实现按下/抬起和力度层选择；选项中保留规范化 velocity，为 MIDI 接入留数据兼容点。
- 不加混响和游戏反馈音，优先保证音高辨识清晰且避免额外听觉线索。

## Steps

- [x] 添加 Tone.js、采样资产和第三方授权说明。
- [x] 建立 MIDI note 领域边界与声音引擎实现。
- [x] 接入键位记忆的预加载、用户手势解锁、播放和错误/降级状态。
- [x] 添加纯逻辑测试并更新长期文档。
- [x] 运行 `npm run check`，在正常与失败加载场景做浏览器验证。

## Progress

- 2026-09-06：完成现状、PRD、Tone.Sampler 和 Salamander 资源/授权调查，确定最小架构和 C4–B4 五采样集合。
- 2026-09-06：实现平台无关声音契约、共享 Tone.js adapter、Vue composable、MIDI note 类型与五采样清单；设置页展示加载/降级状态和 CC BY 署名。
- 2026-09-06：同步架构、产品、质量和 Agent 入口文档；完成正常采样与故障降级浏览器验证。

## Verification

- `npm run check`：通过；9 项 Node 测试全部通过，lint、vue-tsc 和 Vite 生产构建通过。
- 构建：Tone.js 仅进入懒加载的 KeyboardPracticeView chunk；该 chunk 256.10 kB、gzip 67.49 kB。五个 MP3 共约 342 KiB 并正确复制到 `dist/audio/piano/salamander/`。
- 浏览器正常路径：进入 `/keyboard` 后显示“钢琴音色已就绪”，选择“音名 → 琴键”、开始训练并点击正确琴键完成作答；控制台无 warning/error。
- 浏览器故障路径：临时隐藏 C4 样本并刷新，页面显示采样加载失败且切换基础音色；开始训练、点击琴键和判分均正常，控制台无 warning/error；随后恢复样本并再次确认 ready。
- 桌面布局截图检查通过。当前浏览器控制接口不提供 viewport override，本次没有重复 320px 人工验证；新增内容只位于已有纵向表单流内。

## Open Questions

- 真实手机扬声器上的主观音量、音色和点击到发声延迟仍需后续设备验证。
- 可取消的音频时间线、第二八度采样层和 MIDI note-on/note-off 在对应产品模块接入时继续扩展当前契约。
