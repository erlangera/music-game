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
                           -> question queue, shuffled options and scoring state
```

## Source Responsibilities

| 路径 | 当前职责 | 备注 |
| --- | --- | --- |
| `src/main.ts` | 应用启动、路由注册和全局样式导入 | 保持轻量，不承载业务逻辑 |
| `src/router/index.ts` | 路由表、hash history、滚动和页面标题 | hash 模式用于兼容 GitHub Pages 直接访问 |
| `src/App.vue` | 根路由出口 | 不承载页面业务逻辑 |
| `src/views/HomeView.vue` | 首页布局、阶段展示和临时交互 | 首页路由 `/` |
| `src/views/SolfegePracticeView.vue` | 唱名训练页编排和返回首页导航 | 训练路由 `/solfege` |
| `src/components/SolfegeMemoryPractice.vue` | 唱名 S1/S2 双向文字练习、即时判分和本轮报告 | 状态仅在组件内存中，退出或刷新后不保留 |
| `src/assets/main.css` | Tailwind 入口、设计 token、全局基线 | 当前实际被 `main.ts` 导入 |
| `src/assets/base.css` | Vue starter 遗留样式 | 当前未被入口导入 |
| `src/components/` | 可复用或可独立表达的交互组件 | 当前包含唱名记忆训练；目录中仍保留未引用的 Vue starter 示例 |
| `public/` | 原样发布的静态资源 | 当前包含 favicon |
| `vite.config.ts` | Vue/Tailwind 插件、别名、部署 base | GitHub Pages 路径依赖 base 配置 |

## Build and Delivery

1. `npm run build` 并行执行类型检查和 `vite build`。
2. Vite 将生产资源写入 `dist/`。
3. `.github/workflows/deploy-pages.yml` 在 `main` 推送、release 发布或手动触发时运行。
4. Workflow 使用 Node 24、`npm ci` 和 `npm run build`，随后把 `dist/` 发布到 GitHub Pages。

## Expected Evolution

以下是边界建议，不代表已经实现：

- 新增真实页面时在路由表中声明并放入 `src/views/`；不要为尚未实现的导航项建立空页面。
- 当学习进度需要跨页面共享时，再建立明确的状态与持久化边界。
- 把乐理规则、题目生成与评分建模为不依赖 Vue 的领域模块，方便确定性测试。
- 把 Web Audio、MIDI 和浏览器存储封装为适配器，不让平台 API 渗入领域规则。

任何引入新边界的实现都应先记录理由，并更新本页和 `ARCHITECTURE.md`。
