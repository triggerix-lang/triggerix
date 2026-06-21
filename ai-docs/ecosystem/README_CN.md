# Triggerix 生态

本文档是对 `D:/Projects` 下所有 `triggerix-*` 仓库以及它们依赖的所有库（内部 + 外部）的汇总梳理，并补充了外部库对应的官方文档链接与能力摘要。

无论是给人类还是 AI 助手查阅，这都是一份"权威地图"。当需要确认"哪个包负责 X"、"哪些项目在用 Y"、"库 Z 到底干什么"时，从这里开始。

## 目录

- [项目列表](projects.md) —— 每个 `D:/Projects/triggerix*` 仓库一节
  - [triggerix](projects.md#triggerix) —— 核心 monorepo（8 个包，ECA 引擎）
  - [triggerix-ai](projects.md#triggerix-ai) —— AI 生成层 monorepo（6 个包）
  - [triggerix-ai-component-native](projects.md#triggerix-ai-component-native) —— DOM 渲染器
  - [triggerix-editor-vue](projects.md#triggerix-editor-vue) —— Vue 3 绑定层
  - [triggerix-editor-preset-war3](projects.md#triggerix-editor-preset-war3) —— War3 风编辑器预设
  - [triggerix-collective.github.io](projects.md#triggerix-collectivegithubio) —— 官方演示站
- [库清单](libraries.md) —— 内部包和外部库（含官方文档链接）
  - 内部：所有 `@triggerix/*` 和 `@triggerix-ai/*` 包
  - 外部：unbuild、vitest、vite-plus、unocss、vue、vue-router、vueuse、modern-monaco、typescript、eslint 等
- [分层模型](#分层模型) —— 三个项目如何组成 AI 愿景
- [仓库布局](#仓库布局) —— 六个仓库及其角色
- [数据流](#数据流) —— 从用户意图到渲染 UI

---

## 分层模型

Triggerix 生态实现了一个三层 AI-UI 体系中的"中间层"：

```
        AI (LLM)
          │
          │ 输出 JSON（Schema 描述）
          ▼
   ┌──────────────┬──────────────┬──────────────┐
   │   组件框架    │  Triggerix   │    Shinix    │
   │   (骨骼)     │   (肌肉)     │    (皮肤)    │
   └──────────────┴──────────────┴──────────────┘
                  │
                  ▼
              Runtime
```

| 层 | 对应项目 | 职责 | 协议格式 |
|---|---|---|---|
| 组件框架（骨骼） | `@triggerix-ai/component`、`triggerix-ai-component-native`、未来的 atom component | UI 结构：有哪些组件、如何组合 | JSON Schema |
| **Triggerix（肌肉）** | `triggerix/*`、`triggerix-editor-*`、`triggerix-collective.github.io` | 交互行为：事件、条件、动作 | ECA trigger schema |
| Shinix（皮肤） | （规划中） | 视觉表现：颜色、间距、动画、布局 | Style schema |

三层完全独立，都用 JSON Schema 表达，并通过统一的 Runtime 解析与执行。

## 仓库布局

`D:/Projects/` 下共有六个仓库。每个都是独立的 pnpm workspace 或单包仓库；仓库间的依赖通过已发布 npm 版本（`^` 范围）在各自 manifest 中声明。

```
D:/Projects/
├── triggerix/                       # 核心 monorepo —— ECA 引擎
│   └── packages/{core, schema, json-schema, validator,
│                  runtime, registry, editor, triggerix}
│
├── triggerix-ai/                    # AI 生成层 monorepo
│   └── packages/{registry, component, schema, prompt, fn, triggerix-ai}
│
├── triggerix-ai-component-native/   # DOM 渲染器（8 个无样式组件）
│
├── triggerix-editor-vue/            # @triggerix/editor 的 Vue 3 绑定
│
├── triggerix-editor-preset-war3/    # War3 风模板/槽位编辑器预设
│
└── triggerix-collective.github.io/  # 官方演示站（Vue 3 + UnoCSS）
```

> **工作区说明**：没有统一的 umbrella workspace；每个仓库都有自己的 `pnpm-workspace.yaml`（或没有）。跨仓库开发通过 `pnpm-workspace.yaml` 的 `minimumReleaseAgeExclude` 放行刚发布的 next 版本，通过 `tsconfig.json` 的 `paths` 回退到同级 `dist/` 目录，以获得 IDE 类型提示。

## 数据流

一个完整的端到端用户场景（例如"帮我修改昵称"）会贯穿所有层：

```
用户意图  →  AI (LLM)
                  │
                  │ prompt = generateSystemPrompt(registry, component)
                  │ tools  = generateToolSchema(registry, component)
                  ▼
        { components: [...], triggers: [...] }     （AI 输出）
                  │
   ┌──────────────┼──────────────────┐
   ▼              ▼                  ▼
组件实例       触发器定义          $ref 解析
   │              │                  │
   ▼              ▼                  ▼
mountNative    runtime.addTrigger   resolveRefsDeep
   │              │
   ▼              ▼
DOM 元素       触发器求值
   │
   ▼
用户点击 → DOM 事件 → component emit(eventId, source, payload)
   │
   ▼
runtime.emit(eventId, source, payload) → 匹配触发器 → 评估条件
   │
   ▼
executeActionNode → 开发者注册的 handler（如 api.request）
```

协议层深入解读见 [`ai-interaction-protocol/`](../ai-interaction-protocol/README_CN.md)；组件绑定深入解读见 [`ai-integration-pipeline/`](../ai-integration-pipeline/README_CN.md)。

## 如何阅读

- **`projects.md`** 回答"每个仓库发布什么、如何衔接"
- **`libraries.md`** 回答"每个库干什么、官方文档在哪"
- 两者都设计为可一次性加载到上下文中，作为唯一可信来源

## 维护说明

当包新增导出、或者生态加入新仓库时，请同步更新对应章节。

---

[← 返回 ai-docs 目录](../) · [English version →](./README.md)
