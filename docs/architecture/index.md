# Architecture Detail

## Current Topology

这是一个由 Vite 构建、在浏览器中运行的 Vue 3 SPA。目前没有服务端运行时。

```text
index.html
  -> /src/main.ts
       -> /src/assets/main.css
       -> /src/router/index.ts
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
                           -> /src/composables/usePianoAudio.ts
                                -> /src/audio/instrumentAudio.ts
                                -> /src/audio/tonePianoAudio.ts
                                     -> Tone.Sampler / Tone.PolySynth
                                     -> /public/audio/piano/salamander/
                 -> /src/views/tools/PianoToolView.vue
                      -> /src/tools/catalog.ts
                      -> /src/components/PianoKeyboard.vue
                      -> /src/domain/piano.ts
                      -> /src/composables/usePianoAudio.ts
```

## Source Responsibilities

钢琴训练使用独立 `KeyboardPracticeView.vue` → `KeyboardMemoryPractice.vue` → `PianoKeyboard.vue`，出题与判分位于 `keyboardPractice.ts`，琴键几何、音名和 MIDI 映射位于不含训练状态的 `piano.ts`。自由钢琴位于 `views/tools/`，只复用钢琴模型、琴键和声音，不依赖训练会话。`pitch.ts` 区分 pitch class、具体 MIDI note 和科学音高字符串；组件只把 MIDI note 交给 `usePianoAudio.ts`，后者订阅共享声音引擎状态，不直接依赖 Tone.js。`instrumentAudio.ts` 是平台无关的乐器契约，`tonePianoAudio.ts` 管理钢琴采样加载、用户手势解锁、主音量、复音释放和合成降级。两个训练模块保持独立会话，尚未抽象通用训练引擎或统一唱名/钢琴音频调度。

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
| `src/domain/piano.ts` | 一个八度琴键几何、音名、快捷键与 MIDI 映射 | 同时供工具和训练使用，不含题目或判分 |
| `src/audio/` | 通用乐器声音契约、钢琴采样清单和 Tone.js 适配器 | 共享实例跨路由复用已解码采样；页面卸载只停止，不销毁缓存 |
| `src/composables/usePianoAudio.ts` | 把声音引擎状态与生命周期接入 Vue | 组件卸载取消订阅并停止当前声音 |
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
- 后续音高序列应在通用乐器契约之上增加可取消的时间线能力并由 Tone AudioContext 时间调度；在真正接入听辨模块前不创建空的通用调度层。
- Web MIDI 只负责把输入规范化为现有 `MidiNote` 和 0–1 velocity，不让设备 API 或 Tone 类型渗入题目和判分。

任何引入新边界的实现都应先记录理由，并更新本页和 `ARCHITECTURE.md`。
