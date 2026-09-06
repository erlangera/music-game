# Quality and Verification

## Current Automated Gate

```bash
npm run check
```

该命令并行运行以下检查，GitHub Pages workflow 在部署前执行同一命令：

- `npm run lint`：使用 Antfu preset 检查 Vue、TypeScript 和仓库配置；使用 `eslint-plugin-better-tailwindcss` 检查 Vue 模板中的 Tailwind CSS 4 class；
- `npm run build`：运行 Vue/TypeScript 类型检查和 Vite 生产构建。
- `npm test`：Node 原生测试器运行钢琴领域确定性测试（所有1–12序列长度、十二音与等价写法、方向配额、可控时钟下的高亮生命周期、MIDI note 转换，以及 C4–B4 到最近采样不超过一个半音）。

可使用 `npm run lint:fix` 应用 ESLint 的安全自动修复；CI 只检查，不自动修改文件。

## Current Gaps

仓库目前没有以下脚本或配置：

- Vue组件测试（钢琴领域单元测试已建立）；
- E2E 测试；
- 覆盖率门槛。

因此交付说明必须准确区分“check 通过”和“功能已测试”。在自动化测试建立前，交互改动应记录针对性的浏览器验证。

自由钢琴需定向验证鼠标/触摸按压态、电脑键盘按下与松开、复音、音量以及离开页面后不残留长音。

## Verification by Change Type

| 改动类型 | 最低验证 |
| --- | --- |
| 文档/Agent 规则 | 链接、路径、命令和事实来源检查 |
| TypeScript/Vue/Tailwind | `npm run check` |
| 响应式 UI | check + 移动端和桌面端关键视口人工检查 |
| 交互状态 | check + 成功、空状态和不可用状态的针对性检查 |
| 音频/MIDI | check + 正常采样、合成降级、不支持/未授权环境检查；纯音高转换和采样覆盖使用单元测试，真实播放仍需浏览器验证 |
| 领域规则/评分 | 建立对应模块时必须补确定性单元测试 |

## Testability Direction

未来新增题目生成、音阶映射和评分逻辑时，应先放入纯 TypeScript 模块并增加单元测试。浏览器 E2E 重点覆盖真实用户闭环，不重复穷举领域规则。
