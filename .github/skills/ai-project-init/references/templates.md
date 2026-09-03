# Adaptable Templates

模板只提供信息形状。删除无证据章节，用仓库真实路径、命令和状态替换示例。

## Minimal AGENTS.md

```markdown
# Repository Guide

一句话说明项目和当前阶段。

## Commands

- `<install>`
- `<build>`
- `<test>`

只列实际存在的命令，并说明每个命令验证什么。

## Repository Map

- `<path>`：职责。

## Knowledge

- 架构：`<link>`
- 产品/领域：`<link>`
- 决策：`<link>`
- 执行计划：`<link>`

## Working Rules

列出仓库特有且会改变 Agent 行为的约束。

## Definition of Done

列出可以真实执行或观察的完成条件。
```

## Architecture Overview

```markdown
# Architecture

## System Summary

描述当前可确认的系统，而不是目标蓝图。

## Runtime Boundaries

列出 UI、服务、数据、外部系统、构建和部署边界。

## Data or Request Flow

用短文本图表示最重要的运行路径。

## Current Constraints

记录会影响下一次修改的限制和明确缺口。
```

## ADR

```markdown
# ADR NNNN: Decision title

- Status: proposed | accepted | superseded | rejected
- Date: YYYY-MM-DD

## Context

是什么压力或约束促成决定？

## Decision

选择了什么？

## Consequences

获得什么、付出什么、后续必须遵守什么？

## Verification

如何知道这个决定被正确实现？
```

## Execution Plan

```markdown
# Task

- Status: active
- Owner: ...
- Started: YYYY-MM-DD
- Updated: YYYY-MM-DD

## Goal
## Scope
## Investigation
## Decisions
## Steps
## Progress
## Verification
## Open Questions
```
