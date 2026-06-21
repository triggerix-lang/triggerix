# Triggerix Ecosystem

A consolidated survey of every `triggerix-*` project under `D:/Projects` and every library (internal + external) they depend on, augmented with the official documentation of those external libraries.

This document is the canonical map of the ecosystem for both humans and AI assistants. When you need to know "what package owns X", "which projects consume Y", or "what library Z actually does", start here.

## Table of Contents

- [Projects](projects.md) — one section per repo under `D:/Projects/triggerix*`
  - [triggerix](projects.md#triggerix) — core monorepo (8 packages, ECA engine)
  - [triggerix-ai](projects.md#triggerix-ai) — AI-generation monorepo (6 packages)
  - [triggerix-ai-component-native](projects.md#triggerix-ai-component-native) — DOM renderer
  - [triggerix-editor-vue](projects.md#triggerix-editor-vue) — Vue 3 binding layer
  - [triggerix-editor-preset-war3](projects.md#triggerix-editor-preset-war3) — War3-style editor preset
  - [triggerix-collective.github.io](projects.md#triggerix-collectivegithubio) — official showcase site
- [Libraries](libraries.md) — internal packages and external libraries with official docs
  - Internal: every `@triggerix/*` and `@triggerix-ai/*` package
  - External: unbuild, vitest, vite-plus, unocss, vue, vue-router, vueuse, modern-monaco, typescript, eslint, …
- [Layer Model](#layer-model) — how the three projects compose into the AI vision
- [Repository Layout](#repository-layout) — all six repos and their roles
- [Data Flow](#data-flow) — from user intent to rendered UI

---

## Layer Model

The Triggerix ecosystem implements the middle layer of a three-layer AI-UI stack:

```
        AI (LLM)
          │
          │ emits JSON (schema-described)
          ▼
   ┌──────────────┬──────────────┬──────────────┐
   │  Component   │  Triggerix   │    Shinix    │
   │  Framework   │   (muscle)   │   (skin)     │
   │  (skeleton)  │  interaction │    style     │
   └──────────────┴──────────────┴──────────────┘
                  │
                  ▼
              Runtime
```

| Layer | Project(s) | Responsibility | Protocol |
|---|---|---|---|
| Component Framework (skeleton) | `@triggerix-ai/component`, `triggerix-ai-component-native`, future atom component | UI structure: which components exist, how they compose | JSON Schema |
| **Triggerix (muscle)** | `triggerix/*`, `triggerix-editor-*`, `triggerix-collective.github.io` | Interaction behaviour: events, conditions, actions | ECA trigger schema |
| Shinix (skin) | (planned) | Visual presentation: colour, spacing, animation, layout | Style schema |

All three layers are independent, each expressed as JSON Schema, and uniformly parsed and executed by a single Runtime.

## Repository Layout

Six repositories live under `D:/Projects/`. Each is an independent pnpm workspace or single-package repo; their inter-dependencies are declared via npm `^` ranges in published manifests.

```
D:/Projects/
├── triggerix/                       # Core monorepo — ECA engine
│   └── packages/{core, schema, json-schema, validator,
│                  runtime, registry, editor, triggerix}
│
├── triggerix-ai/                    # AI-generation monorepo
│   └── packages/{registry, component, schema, prompt, fn, triggerix-ai}
│
├── triggerix-ai-component-native/   # DOM renderer (8 unstyled components)
│
├── triggerix-editor-vue/            # Vue 3 binding for @triggerix/editor
│
├── triggerix-editor-preset-war3/    # War3-style template/slot editor preset
│
└── triggerix-collective.github.io/  # Official showcase site (Vue 3 + UnoCSS)
```

> **Workspace note**: There is no umbrella workspace; each repo has its own `pnpm-workspace.yaml` (or none). Cross-repo development uses `pnpm-workspace.yaml` `minimumReleaseAgeExclude` to allow freshly-published "next" versions, and `paths` in `tsconfig.json` to fall back to sibling `dist/` folders for IDE type resolution.

## Data Flow

A single end-to-end user scenario (e.g. *"help me change my nickname"*) exercises every layer:

```
User intent  →  AI (LLM)
                  │
                  │ prompt = generateSystemPrompt(registry, component)
                  │ tools  = generateToolSchema(registry, component)
                  ▼
        { components: [...], triggers: [...] }     (AI output)
                  │
   ┌──────────────┼──────────────────┐
   ▼              ▼                  ▼
component     trigger             $ref
instances     definitions         resolver
   │              │                  │
   ▼              ▼                  ▼
mountNative    runtime.addTrigger   resolveRefsDeep
   │              │
   ▼              ▼
DOM elements   trigger eval
   │
   ▼
User clicks → DOM event → component emit(eventId, source, payload)
   │
   ▼
runtime.emit(eventId, source, payload) → match trigger → evaluate conditions
   │
   ▼
executeActionNode → developer-registered handler (e.g. api.request)
```

For the protocol-level deep-dive see [`ai-interaction-protocol/`](../ai-interaction-protocol/README.md). For the component-binding deep-dive see [`ai-integration-pipeline/`](../ai-integration-pipeline/README_CN.md).

## How to read this doc

- **`projects.md`** answers *"what does each repo ship, and how does it fit together?"*
- **`libraries.md`** answers *"what does each library do, and where do I read the official docs?"*
- Both are designed to be loaded into context as a single source of truth.

## Maintenance

When a package adds new exports or a new repo joins the ecosystem, update the corresponding section.

---

[← Back to ai-docs](../) · [中文版 →](./README_CN.md)
