# Architecture Detail

## Current Topology

这是一个由 Vite 构建、在浏览器中运行的 Vue 3 SPA。目前没有服务端运行时。

```text
index.html
  -> /src/main.ts
       -> /src/assets/main.css
       -> /src/router/index.ts
       -> /src/composables/instrumentInjection.ts
            -> /src/audio/pianoInstrument.ts
       -> createApp(App)
            -> /src/App.vue (RouterView)
                 -> /src/views/HomeView.vue
                      -> local refs and static stage data
                      -> rendered learning-path prototype
                 -> /src/views/SolfegePracticeView.vue
                      -> /src/components/SolfegeMemoryPractice.vue
                           -> setup, session and feedback state
                           -> /src/domain/solfegePractice.ts
                                -> question types and controlled generation
                 -> /src/views/KeyboardPracticeView.vue
                      -> /src/components/KeyboardMemoryPractice.vue
                           -> /src/domain/keyboardPractice.ts
                           -> /src/domain/piano.ts
                           -> /src/domain/pitch.ts
                           -> /src/components/PianoKeyboard.vue
                           -> /src/composables/useInstrumentPlayer.ts
                                -> /src/audio/instrumentAudio.ts
                                -> /src/audio/tonePianoAudio.ts
                                     -> Tone.Sampler / Tone.PolySynth
                                     -> /public/audio/piano/salamander/
                 -> /src/views/tools/PianoToolView.vue
                      -> /src/tools/catalog.ts
                      -> /src/components/PianoKeyboard.vue
                      -> /src/domain/piano.ts
                      -> /src/composables/useInstrumentPlayer.ts
```

## Source Responsibilities

钢琴训练、自然大调和自由钢琴都使用 `PianoKeyboard.vue`；组件根据 MIDI 起止音生成一或多个八度，通过 mark 输入统一 `member/active/correct/wrong` 状态，只发出 MIDI note 事件。琴键几何、音名、快捷键和状态优先级位于不含 Vue 的 `piano.ts`。`main.ts` 把钢琴注册到应用级乐器注册表，`useInstrumentPlayer.ts` 按 id 注入乐器并统一预加载、解锁、单音、持续按键、活动高亮和可取消序列。`instrumentAudio.ts` 是平台无关的声音契约，`tonePianoAudio.ts` 只管理钢琴采样、音量、释放和合成降级。训练模块仍各自持有题目、判分和会话状态，没有抽象通用计分引擎。

| 路径 | 当前职责 | 备注 |
| --- | --- | --- |
| `src/main.ts` | 应用启动、路由注册和全局样式导入 | 保持轻量，不承载业务逻辑 |
| `src/router/index.ts` | 路由表、hash history、滚动和页面标题 | hash 模式用于兼容 GitHub Pages 直接访问 |
| `src/App.vue` | 根路由出口 | 不承载页面业务逻辑 |
| `src/views/HomeView.vue` | 首页布局、阶段展示和临时交互 | 首页路由 `/` |
| `src/views/tools/PianoToolView.vue` | 不出题、不计分的自由钢琴交互 | 工具路由 `/tools/piano` |
| `src/tools/catalog.ts` | 已上线工具的发现元数据 | 可供未来工具中心和导航复用，不承载运行状态 |
| `src/views/SolfegePracticeView.vue` | 唱名训练页编排和返回首页导航 | 训练路由 `/solfege` |
| `src/components/SolfegeMemoryPractice.vue` | 唱名 S1–S4 核心设置、单项/序列交互、会话与汇总 | 状态仅在组件内存中，退出或刷新后不保留 |
| `src/domain/solfegePractice.ts` | 唱名类型、平衡牌组、方向队列和题目映射 | 不依赖 Vue，可传入随机函数 |
| `src/domain/pitch.ts` | pitch class、MIDI note 构造与科学音高转换 | 不依赖 Vue/Tone；MIDI 范围在构造边界校验 |
| `src/domain/piano.ts` | 任意 MIDI 范围的琴键几何、音名、快捷键、mark 类型和状态优先级 | 同时供工具、键位训练和大调模块使用，不含题目或判分 |
| `src/audio/` | 通用乐器契约与注册表、钢琴定义、采样清单和 Tone.js 适配器 | 共享实例跨路由复用已解码采样；页面卸载只停止，不销毁缓存 |
| `src/composables/instrumentInjection.ts` | 把乐器注册表注入 Vue 应用并按稳定 id 解析乐器 | 新乐器通过注册定义接入，不要求练习导入具体声音实现 |
| `src/composables/useInstrumentPlayer.ts` | 统一声音状态、生命周期、活动音符、持续按键和可取消序列 | 视觉组件只消费 active notes，不依赖 Tone.js |
| `src/assets/main.css` | Tailwind 入口、设计 token、全局基线 | 当前实际被 `main.ts` 导入 |
| `src/assets/base.css` | Vue starter 遗留样式 | 当前未被入口导入 |
| `src/components/` | 可复用或可独立表达的交互组件 | 当前包含唱名记忆训练；目录中仍保留未引用的 Vue starter 示例 |
| `public/` | 原样发布的静态资源 | 包含唱名 MP3、Salamander 钢琴 MP3 和相邻授权说明 |
| `vite.config.ts` | Vue/Tailwind 插件、别名、部署 base | GitHub Pages 路径依赖 base 配置 |

## Build and Delivery

1. `npm run check` 并行执行 ESLint、`npm test` 和 `npm run build`；build 内部并行执行类型检查和 `vite build`。测试使用 Node 原生 TypeScript 支持，无新增测试依赖。
2. Vite 将生产资源写入 `dist/`。
3. `.github/workflows/deploy-pages.yml` 在 `main` 推送、release 发布或手动触发时运行。
4. Workflow 使用 Node 24、`npm ci` 和 `npm run check`，随后把 `dist/` 发布到 GitHub Pages。

## Expected Evolution

以下是边界建议，不代表已经实现：

- 新增真实页面时在路由表中声明并放入 `src/views/`；非测试工具使用 `/tools/<id>` 和 `src/views/tools/`，不要为尚未实现的导航项建立空页面。
- 当学习进度需要跨页面共享时，再建立明确的状态与持久化边界。
- 把乐理规则、题目生成与评分建模为不依赖 Vue 的领域模块，方便确定性测试。
- 当前通用控制器已提供基于浏览器时钟的可取消播放序列；需要节奏精度的听辨或演奏模块再将调度下沉到 Tone AudioContext，不提前增加空的节拍系统。
- Web MIDI 只负责把输入规范化为现有 `MidiNote` 和 0–1 velocity，不让设备 API 或 Tone 类型渗入题目和判分。

任何引入新边界的实现都应先记录理由，并更新本页和 `ARCHITECTURE.md`。
