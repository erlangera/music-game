# ADR 0002: Hash Routing for Static Hosting

- Status: accepted
- Date: 2026-09-04

## Context

首页和唱名训练已经成为独立页面，需要可复制 URL、直接刷新以及浏览器前进后退。应用由 GitHub Pages 静态托管，当前发布流程只上传 Vite 的 `dist/`，没有服务器端路由回退配置。

## Decision

- 引入 Vue Router，页面级组件放在 `src/views/`；
- 根组件 `App.vue` 只保留路由出口；
- 使用 `createWebHashHistory(import.meta.env.BASE_URL)`；
- 只为已经实现的页面注册路由，当前为 `/` 和 `/solfege`；
- 未匹配地址重定向至首页；
- 训练内部答题状态继续保留在组件内，刷新训练路由会开始新一轮。

## Consequences

- GitHub Pages 不需要额外的 404 回退或服务器配置即可直接打开训练 URL；
- URL 包含 `#`，搜索引擎可索引性弱于 HTML5 history，但当前产品是交互训练工具，静态托管可靠性优先；
- 新页面需要同时新增 view、路由记录和相应产品/架构事实；
- 页面导航与训练状态解耦，但尚未引入全局状态或持久化。

## Verification

- `/music-game/#/` 可进入首页；
- `/music-game/#/solfege` 可直接打开和刷新；
- 首页进入训练、训练返回首页及浏览器前进后退均保持 URL 和页面一致；
- `npm run build` 通过。
