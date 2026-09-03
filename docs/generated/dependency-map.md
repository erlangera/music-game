# Dependency Map

- Generated: 2026-09-04
- Inputs: `package.json`, `vite.config.ts`, `src/main.ts`, `.github/workflows/deploy-pages.yml`
- Refresh when: 依赖、构建入口、Vite 插件或部署 workflow 变化
- Method: 可人工刷新

```text
Vue application
  ├── vue 3.5
  ├── TypeScript 6 + vue-tsc 3
  ├── Vite 8
  │    ├── @vitejs/plugin-vue 6
  │    ├── @tailwindcss/vite 4
  │    └── vite-plugin-vue-devtools 8 (development tooling)
  └── Tailwind CSS 4

Build
  └── npm-run-all2 -> type-check + vite build

Delivery
  └── GitHub Actions -> GitHub Pages
```

精确版本和传递依赖以 `package-lock.json` 为准。
