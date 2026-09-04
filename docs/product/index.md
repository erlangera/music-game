# Product Context

## Source of Truth

完整 MVP 目标、题型、判分规则、数据模型和验收标准见 [`../music-theory-ear-training-prd-v1.md`](../music-theory-ear-training-prd-v1.md)。产品规则发生变化时，先更新 PRD 或新增明确的产品决策，再修改实现。

## Product Promise

音阶阶帮助中文简谱初学者建立以下映射：

```text
简谱级数 1–7 <-> 首调唱名 do–si <-> 音名 <-> 钢琴键位 <-> 实际声音
```

训练采用小步、可检测的学习路径，最终服务于相对音高、短旋律听写和音乐创作。

## Module Knowledge

- [`solfege-memory-training.md`](solfege-memory-training.md)：模块一当前交互、随机规则、状态边界和实现经验。
- [`open-questions.md`](open-questions.md)：PRD 审阅中尚未解决、会影响实现或验收的问题。

## Current Implementation Status

截至 2026-09-04，仓库中可确认的实现包括首页/学习路径原型和模块一的 S1/S2 双向文字练习：

- 响应式侧栏和顶部导航；
- 今日推荐训练卡片；
- 四个学习阶段的展示状态；
- 周目标、连续学习和提示类本地交互。
- 从今日推荐或阶段 01 进入唱名记忆训练；
- 首页和唱名训练可通过 hash 路由直接访问，并支持浏览器前进、后退；
- 双向随机题：单唱名选择 `1–7`，或单个数字选择 `do–si`；两种答案按钮均随机排列；
- 正误即时反馈、10 题进度、完成报告和再练一组；
- 320px 起的响应式练习布局。

以下 PRD 能力仍是规划，不应在文档或交付说明中描述为已完成：

- S2 之外的完整题型；
- 音频引擎与调性建立；
- 虚拟钢琴和 Web MIDI；
- 跨会话判分记录、错题、掌握度与学习记录；
- 本地持久化；
- 阶段检测和解锁闭环。

## Scope Discipline

实现任务应标明属于 PRD 的 P0、P1 或 P2，优先完成最小纵向切片。不要因页面上存在占位入口，就默认其背后的业务流程已获授权或已经实现。
