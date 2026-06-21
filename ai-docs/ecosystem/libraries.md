# Libraries

Every library used across the six `triggerix-*` repos — internal Triggerix packages and external dependencies — with the official documentation for each external library.

## Table of Contents

- [Internal: Triggerix packages](#internal-triggerix-packages)
  - [`@triggerix/core`](#triggerixcore) · [`@triggerix/schema`](#triggerixschema) · [`@triggerix/json-schema`](#triggerixjson-schema) · [`@triggerix/validator`](#triggerixvalidator) · [`@triggerix/runtime`](#triggerixruntime) · [`@triggerix/registry`](#triggerixregistry) · [`@triggerix/editor`](#triggerixeditor) · [`triggerix` (aggregate)](#triggerix-aggregate)
  - [`@triggerix-ai/registry`](#triggerix-airegistry) · [`@triggerix-ai/component`](#triggerix-aicomponent) · [`@triggerix-ai/schema`](#triggerix-aischema) · [`@triggerix-ai/prompt`](#triggerix-aiprompt) · [`@triggerix-ai/fn`](#triggerix-aifn) · [`triggerix-ai` (aggregate)](#triggerix-ai-aggregate)
- [External: Build & Tooling](#external-build--tooling)
  - [`unbuild`](#unbuild) · [`vitest`](#vitest) · [`vite-plus` (`vp`)](#vite-plus-vp) · [`vite`](#vite) · [`typescript`](#typescript) · [`eslint`](#eslint) · [`@antfu/eslint-config`](#antfueslint-config) · [`defu`](#defu) · [`bumpp`](#bumpp) · [`esno`](#esno) · [`jiti`](#jiti) · [`simple-git-hooks`](#simple-git-hooks) · [`nano-staged`](#nano-staged)
- [External: Vue ecosystem](#external-vue-ecosystem)
  - [`vue`](#vue) · [`vue-router`](#vue-router) · [`@vueuse/core`](#vueusecore) · [`@vue/test-utils`](#vuetest-utils) · [`@vitejs/plugin-vue`](#vitejsplugin-vue)
- [External: Styles & Assets](#external-styles--assets)
  - [`unocss`](#unocss) · [`@unocss/reset`](#unocssreset) · [`uno-colors`](#uno-colors)
- [External: Code & DOM](#external-code--dom)
  - [`modern-monaco`](#modern-monaco) · [`jsdom`](#jsdom) · [`happy-dom`](#happy-dom)
- [External: Package management](#external-package-management)
  - [`pnpm`](#pnpm)

---

## Internal: Triggerix packages

The Triggerix ecosystem ships 14 publishable packages across two monorepos. Every package is independently publishable; internal development uses `workspace:*` deps that resolve at publish time to actual `^` version ranges.

> **Naming convention**:
> - `@triggerix/*` — core ECA engine (`D:/Projects/triggerix/packages/`)
> - `@triggerix-ai/*` — AI-generation layer (`D:/Projects/triggerix-ai/packages/`)
> - Two unscoped aggregate packages: `triggerix`, `triggerix-ai`

### `@triggerix/core`

> Repo: `D:/Projects/triggerix/packages/core/` · Zero deps

The single source of truth for the ECA protocol — types, `as const` operator tuples, and a structural type guard. **Zero runtime dependencies.**

**Exports**:
- **Constants** (the canonical tuples from which all `as` types are derived):
  - `VALID_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists']`
  - `BINARY_OPERATORS = ['+', '-', '*', '/', '%']`
  - `UNARY_OPERATORS = ['-', '!']`
  - `COMPARE_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte']`
  - `LOGICAL_OPERATORS = ['and', 'or', 'not']` *(note: `not` is excluded from ConditionGroups — use reverse comparisons or expression `!`)*
  - `CONDITION_GROUP_TYPES = ['and', 'or']`
- **Types**: `Operator`, `BinaryOp`, `UnaryOp`, `CompareOp`, `LogicalOp`, `ConditionGroupOp`, `Literal`, `Reference`, `Value`, `Event`, `Condition`, `ConditionGroup`, `ConditionItem`, `Action`, `Trigger`, `ExprOperand`, `ExprBinary`, `ExprUnary`, `ExprCompare`, `ExprLogical`, `ExprCall`, `ExprConcat`, `ExprTernary`, `ExprNode`, `Expression`, `ActionSequence`, `ActionParallel`, `ActionTryCatch`, `ActionIf`, `ActionNode`
- **Function**: `isConditionGroup(value): value is ConditionGroup` — structural guard

### `@triggerix/schema`

> Repo: `D:/Projects/triggerix/packages/schema/` · Deps: `core`

DSL builders — the developer-friendly authoring API. Most `define*` functions are identity (return input unchanged) for type anchoring; the expression and flow builders construct AST nodes.

**Exports**:
- *Identity helpers*: `defineAction`, `defineCondition`, `defineConditionGroup`, `defineConditions`, `defineEvent`, `defineTrigger`, `ref`
- *Expression DSL*: `expr`, `binary`, `unary`, `exprCompare`, `logical`, `call`, `concat`, `ternary`
- *Flow builders*: `sequence`, `parallel`, `tryCatch`, `actionIf`

### `@triggerix/json-schema`

> Repo: `D:/Projects/triggerix/packages/json-schema/` · Deps: `core`

JSON Schema (draft-07 subset) generator. Hand-rolled `JSONSchema` type — no `ajv` or similar runtime deps.

**Exports**:
- *Type*: `JSONSchema` (custom subset)
- *Top-level*: `generateTriggerSchema`, `generateValueSchema`, `generateExpressionSchema`, `generateEventSchema`, `generateActionSchema`
- *Condition*: `generateOperatorSchema`, `generateConditionSchema`, `generateConditionItemSchema`, `generateConditionGroupSchema`
- *Expression* (9): `generateExprOperandSchema`, `generateExprNodeSchema`, `generateExprBinarySchema`, `generateExprUnarySchema`, `generateExprCompareSchema`, `generateExprLogicalSchema`, `generateExprCallSchema`, `generateExprConcatSchema`, `generateExprTernarySchema`
- *Flow* (5): `generateActionNodeSchema`, `generateActionSequenceSchema`, `generateActionParallelSchema`, `generateActionTryCatchSchema`, `generateActionIfSchema`

### `@triggerix/validator`

> Repo: `D:/Projects/triggerix/packages/validator/` · Deps: `core`

Pure-function validator. **Never throws** — returns `{ valid, errors[] }` with errors classified as `'structural'` or `'semantic'` and reported via dotted/indexed paths (`'actions[0].params.body.url'`).

**Exports**: `validateAction`, `validateActionNode`, `validateCondition`, `validateConditionGroup`, `validateConditionItems`, `validateEvent`, `validateExpression`, `validateExprNode`, `validateExprOperand`, `validateTrigger`, `validateValue` — and types `ValidationError`, `ValidationResult`.

### `@triggerix/runtime`

> Repo: `D:/Projects/triggerix/packages/runtime/` · Deps: `core`

Reference runtime implementation. The only package that *executes* triggers; everything else is authoring/validation.

**Exports**:
- *Factory*: `createRuntime(options?) → TriggerixRuntime`
- *Classes*: `ActionRegistry`, `EventRegistry`
- *Comparison*: `compare` (fluent: `.left(v).eq/.neq/.gt/.gte/.lt/.lte/.exists`)
- *Conditions*: `evaluateCondition`, `evaluateConditionGroup`, `evaluateConditions`
- *Expressions*: `evaluateExprNode`, `evaluateExprOperand`, `FunctionRegistry`
- *Flow*: `executeActionNode` (dispatches sequence/parallel/if/tryCatch)
- *Refs*: `resolveValue`, `getNestedValue`, `resolveRefsDeep`, `RefResolver`
- *Types*: `TriggerixRuntime`, `EventDefinition`, `EventHandler`, `ActionDefinition`, `ActionHandler`, `RuntimeContext`, `RuntimeOptions`, `FunctionRegistry`, `CompareBuilder`, `CompareOperators`, `CompareRight`

**`TriggerixRuntime` API**: `registerEvent`, `registerAction`, `registerFunction`, `addTrigger`, `removeTrigger`, `emit(type, source?, payload?)`, `listEvents`, `listActions`, `listTriggers`.

### `@triggerix/registry`

> Repo: `D:/Projects/triggerix/packages/registry/` · Zero deps

Generic, framework-agnostic registry. Three `Map`s (events/actions/conditions), O(1) lookups, tree-shakable, zero deps. `BaseRegistry<TEventDef, TActionDef, TConditionDef>` is the base that both `@triggerix-ai/registry` and `@triggerix/editor`'s War3 preset extend.

**Exports**: class `BaseRegistry`, type `BaseItemDef`.

### `@triggerix/editor`

> Repo: `D:/Projects/triggerix/packages/editor/` · Deps: `core`, `registry`

Framework-agnostic editor infrastructure. Defines the `Editor<TState>` interface that any framework-specific binding (Vue, React, future atom) implements on top of, and `ObservableState<T>` pub/sub primitive.

**Exports**:
- *Class*: `ObservableState<T>` (`getState`, `setState` protected, `onChange(listener) → disposer`, `notify` protected, `dispose`)
- *Types*: `Editor<TState>`, `Preset<TEditor>`
- *Re-exports*: `BaseRegistry`, `BaseItemDef`

### `triggerix` (aggregate)

> Repo: `D:/Projects/triggerix/packages/triggerix/`

Re-exports `core` + `schema` + `json-schema` + `validator` + `runtime`. **Deliberately excludes** `registry` and `editor` (those are opt-in extensions).

### `@triggerix-ai/registry`

> Repo: `D:/Projects/triggerix-ai/packages/registry/` · Deps: `@triggerix/registry`

AI metadata for events/actions/conditions — extends `BaseRegistry` with descriptions, label, params schema, etc.

**Exports**: `AIRegistry` class, `createAIRegistry()`, identity helpers `defineAIEvent`/`defineAIAction`/`defineAICondition`, types `AIEventDef`, `AIActionDef`, `AIConditionDef`, `ParamSchema`.

### `@triggerix-ai/component`

> Repo: `D:/Projects/triggerix-ai/packages/component/` · Zero runtime deps

Component protocol layer — `ComponentDef<T>`, `ComponentRegistry`, `BaseRenderer<T>`, `Renderer<T>`, renderer-agnostic `mount()`, and the renderer context (`appendChild`/`removeChild`) abstraction. **Zero runtime deps**; concrete renderers live downstream.

**Exports**:
- *Component*: `ComponentDef<T>` abstract + `defineAIComponent`, `ComponentRegistry` + `createComponentRegistry()`, `use(components)`, `registerComponent`
- *Renderer*: `BaseRenderer<T>`, `Renderer<T>` interface, `mount(output, container, components, emit, ctx)` generic
- *Types*: `RendererContext<TContainer, TElement>`, `MountEmitFn`, `Scope`, `AIOutput`, `ComponentInstance`, `ComponentPropSchema`, `AIComponentDef`, `EmitFn`

### `@triggerix-ai/schema`

> Repo: `D:/Projects/triggerix-ai/packages/schema/` · Deps: `@triggerix/core`, `@triggerix-ai/component`, `@triggerix-ai/registry`

JSON Schema generator for AI tool inputs. Supports both trigger-only mode and component+trigger mode; constrains enum IDs to the registered catalog.

**Exports**: `generateToolSchema({ registry, component? })`, `generateRuleSchema(registry)`, types `GenerateToolSchemaOptions`, `JSONSchema`.

### `@triggerix-ai/prompt`

> Repo: `D:/Projects/triggerix-ai/packages/prompt/` · Deps: `@triggerix-ai/component`, `@triggerix-ai/registry`

System prompt builder. Concatenates `BASE_SYSTEM_PROMPT` (static protocol spec) with dynamic catalog sections (events, actions, conditions, components, reverse component→event index).

**Exports**: `BASE_SYSTEM_PROMPT` (string), `generateSystemPrompt({ registry, component? })`, type `GenerateSystemPromptOptions`.

### `@triggerix-ai/fn`

> Repo: `D:/Projects/triggerix-ai/packages/fn/` · Deps: all `@triggerix-ai/*`

One-call Function Calling definition — bundles prompt + tools into a single object ready for any LLM SDK.

**Exports**: `defineFunctionCalling({ registry, component?, toolName?, toolDescription? }) → { systemPrompt, tools }`, types `ToolDefinition`, `FunctionCallingResult`, `DefineFunctionCallingOptions`.

### `triggerix-ai` (aggregate)

> Repo: `D:/Projects/triggerix-ai/packages/triggerix-ai/`

Facade re-export of all 5 `@triggerix-ai/*` packages. Single import line for consumers.

### Internal: triggerix-editor-* (separate repos)

Three more internal packages live in their own repos:

| Package | Repo | Role |
|---|---|---|
| `triggerix-editor-vue` | `D:/Projects/triggerix-editor-vue/` | Vue 3 binding for `@triggerix/editor` — `useEditor`/`useEditorState`/`provideEditor`/`injectEditor`. Zero deps beyond Vue + `@triggerix/editor`. |
| `triggerix-editor-preset-war3` | `D:/Projects/triggerix-editor-preset-war3/` | War3-style template/slot editor preset — `createWar3Editor`, `defineWar3Preset`, `defineLeafTool`, `defineCompositeTool`, full War3 editor surface. Deps: `@triggerix/core`, `@triggerix/editor`. |
| `triggerix-ai-component-native` | `D:/Projects/triggerix-ai-component-native/` | Reference DOM renderer — 8 unstyled components, `NativeComponentDef`, `mountNative`, `nativeRendererContext`. Deps: `@triggerix-ai/component`, `@triggerix/core`. |

See [`projects.md`](./projects.md) for full detail on each.

---

## External: Build & Tooling

### `unbuild`

> [github.com/unjs/unbuild](https://github.com/unjs/unbuild) · MIT · unjs

The unified JavaScript build system used by every Triggerix package. Rollup-based, with first-class TypeScript and dual ESM + CJS + type declarations.

**Why this project uses it**: every Triggerix package is a library published to npm with both `import` and `require` resolutions plus `.d.ts`. `unbuild` does this with one shared `build.config.ts` per package, no per-target hand-rolling.

**Key config fields used across this codebase**:
- `entries: ['src/index']` — single entry per package
- `declaration: true` — emits `.d.ts` (`compatible` mode → `.d.mts`, `.d.cts`, `.d.ts`)
- `clean: true` — wipes `dist/` before each build
- `rollup.emitCJS: true` — dual ESM + CJS output
- `rollup.esbuild.minify: true` — minified ESM output
- `rollup.dts.respectExternal: false` — inlines externals into the `.d.ts` bundle
- `externals: [...]` — every package lists its peer/workspace deps as external so they aren't bundled

**Stub mode**: `pnpm stub` runs `unbuild --stub` once per package, generating live dev links that don't require rebuilds (powered by `jiti`).

**Shared config**: `scripts/build.common.ts` in both monorepos uses [`defu`](#defu) to merge a default config object into each package's `build.config.ts`.

**Notable features** (vs tsup/libuild): rollup-based (vs esbuild-based), first-class `mkdist` integration for bundleless output, dependency hygiene checks (missing/unused) that fail CI, dual-format output with flexible declaration strategies (`compatible` vs `node16`), explicit stub mode.

**Future direction**: the unjs team is experimenting with [obuild](https://github.com/unjs/obuild), a rolldown-based successor.

### `vitest`

> [vitest.dev](https://vitest.dev) · [github.com/vitest-dev/vitest](https://github.com/vitest-dev/vitest) · MIT · VoidZero Inc. + community

A next-generation testing framework powered by Vite. Reuses Vite's config, transformers, resolvers, and plugins. Jest-compatible API (`expect`, `it`, `describe`, mocks, spies, snapshots).

**Why this project uses it**:
- Reuses the project's TypeScript + ESM setup without separate test config
- Native ESM, top-level await, out-of-box TS/JSX support
- Environment switching: `jsdom` for DOM-heavy tests (`triggerix-ai-component-native`), `happy-dom` for lighter Vue scenarios (`triggerix-editor-vue`), default `node` for pure logic
- Coverage via `@vitest/coverage-v8` (v8 engine)
- Fast watch mode

**Used in**: every Triggerix package. Tests live under `tests/<package-name>/*.test.ts` mirroring `packages/<package-name>/src/`.

**Configuration used**:
- `vitest.config.ts` at monorepo root resolves package aliases via `tsconfig.json` paths (so tests import directly from `packages/*/src/index.ts` without a build step)
- `happy-dom` environment for `triggerix-editor-vue`
- `jsdom` environment for `triggerix-ai-component-native`
- Coverage: `text` + `html` formats

**Requirements**: Vite >=6, Node >=22 (latest minor).

### `vite-plus` (`vp`)

> [github.com/voidzero-dev/vite-plus](https://github.com/voidzero-dev/vite-plus) · VoidZero · Alpha

A unified, zero-config CLI front-end that bundles Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task into one `vp` binary. Manages Node runtime and package manager.

**Why `triggerix-collective.github.io` uses it**: the showcase site bundles every frontend tool into one CLI, with one config surface (`vite.config.ts`) for Vite + Vitest + Oxlint + Oxfmt + staged-files pre-commit + `vue-router/auto-routes`. No scattered `.oxlintrc*` / `.oxfmtrc*` / lint-staged configs.

**Bundled tools**:
- **Vite** — dev server + production builds
- **Rolldown** — Rust-based bundler for production
- **Vitest** — test runner
- **tsdown** — library packaging
- **Oxlint / Oxfmt** — linting + formatting
- **Vite Task** — monorepo task running with caching

**Key commands used**:
- `vp dev` — Vite dev server with HMR
- `vp build` — production build via Vite + Rolldown
- `vp preview` — preview built site
- `vp check` — runs format, lint, and type checks in one pass
- `vp staged` — runs checks on staged files (used in `.vite-hooks/pre-commit`)
- `vp config` — configures hooks and agent integration

**Differences vs plain Vite**: one CLI replaces many; unified config; built-in runtime + package management (`vp env`, `vp install`); monorepo task caching via `vp run`; `vp migrate` consolidates scattered configs.

### `vite`

> [vitejs.dev](https://vitejs.dev) · MIT · VoidZero + community

The default Vite installation is aliased to `@voidzero-dev/vite-plus-core` in `triggerix-collective.github.io` (vite-plus bundles its own Vite). Used directly via `vp dev`/`vp build` commands.

### `typescript`

> [typescriptlang.org](https://www.typescriptlang.org) · Apache-2.0 · Microsoft

Strict TypeScript across the entire codebase.

**Config used everywhere**:
- `target: ESNext`, `module: ESNext`, `moduleResolution: Bundler`
- `strict: true`, `strictNullChecks: true`
- `verbatimModuleSyntax: true`, `isolatedModules: true`
- `esModuleInterop: true` (when needed)
- Path aliases for every workspace package

**Specific extras**:
- `triggerix-ai-component-native` adds `lib: ["ESNext", "DOM", "DOM.Iterable"]` for DOM APIs
- `triggerix-editor-vue` includes `tests/**/*.ts` and `vitest.config.ts` in the project
- `triggerix-collective.github.io` includes `.auto-generated/typed-router.d.ts` (vue-router generated types)

### `eslint`

> [eslint.org](https://eslint.org) · MIT · OpenJS Foundation

Used via the flat-config format (`eslint.config.ts` or `eslint.config.mjs`) with [`@antfu/eslint-config`](#antfueslint-config) preset. Triggerix projects ship a single override on top of the preset.

### `@antfu/eslint-config`

> [github.com/antfu/eslint-config](https://github.com/antfu/eslint-config) · MIT · Anthony Fu

Opinionated, ready-to-use flat-config ESLint preset by Anthony Fu (core team Vite/Vue, author of Vitest/VueUse/UnoCSS).

**Why this project uses it**: replaces the need to assemble rule sets by hand. Ships TypeScript, Vue, JSX, import sorting, and stylistic preferences out of the box; users extend or override rather than starting from zero.

**Used in**: every Triggerix repo. Single common override across all six: `style/comma-dangle: never` (warn). The showcase site additionally enforces `1 statement per line` (error) and disables `test/prefer-lowercase-title`.

### `defu`

> [github.com/unjs/defu](https://github.com/unjs/defu) · MIT · unjs

Recursive object merge with default values. Used in `scripts/build.common.ts` of both monorepos to merge a shared default build config into each package's `build.config.ts`.

### `bumpp`

> [github.com/antfu-collective/bumpp](https://github.com/antfu-collective/bumpp) · MIT

Interactive version bumper. The `pnpm release` script in both monorepos runs `bumpp -r` (recursive across workspaces) to bump every package in lockstep.

### `esno`

> [github.com/antfu-collectiverse/esno](https://github.com/antfu-collectiverse/esno) · MIT

TypeScript execution helper. Used by `pnpm update-readme` in the root `package.json` (runs `scripts/update-readme.ts`).

### `jiti`

> [github.com/unjs/jiti](https://github.com/unjs/jiti) · MIT · unjs

Just-In-Time TypeScript/ESM loader. Used by `unbuild --stub` mode to load `.ts` config files at runtime without a separate transpile step.

### `simple-git-hooks`

> [github.com/toplenboren/simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) · MIT

Zero-deps git hook manager. Installs hooks via `prepare` script.

**Config (every Triggerix repo)**:
```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm nano-staged"
  }
}
```

### `nano-staged`

> [github.com/usmanyunusov/nano-staged](https://github.com/usmanyunusov/nano-staged) · MIT

Tiny pre-commit runner that applies commands only to staged files. Combined with `simple-git-hooks`:

```json
{
  "nano-staged": {
    "*": "eslint --cache --fix"
  }
}
```

---

## External: Vue ecosystem

### `vue`

> [vuejs.org](https://vuejs.org) · MIT · Vue.js Team

Vue 3 with the Composition API and `<script setup>` SFCs throughout `triggerix-editor-vue` and `triggerix-collective.github.io`.

**Features used**:
- `shallowRef` for editor state (no deep reactivity)
- `provide`/`inject` with `InjectionKey<...>` (for `provideEditor`/`injectEditor`)
- `onScopeDispose` for lifecycle
- `defineComponent`, `h`, `nextTick` (in tests)
- `<script setup lang="ts">` everywhere

### `vue-router`

> [router.vuejs.org](https://router.vuejs.org) · MIT

Vue's official router, with **file-based routing** via `vue-router/auto-routes`. Used by `triggerix-collective.github.io`.

**Key features**:
- File-based routes from `src/pages/` automatically generate route records
- `.auto-generated/typed-router.d.ts` is the typed router declaration, included in `tsconfig.json`
- HMR via `handleHotUpdate`

### `@vueuse/core`

> [vueuse.org](https://vueuse.org) · MIT · Anthony Fu + contributors

A collection of 200+ essential Vue Composition API utilities. Tree-shakeable, type-strong, SSR-friendly. Used by `triggerix-collective.github.io`.

**Functions used**:
- `useLocalStorage` — persist Monaco drawer height
- `onClickOutside` — close dropdowns

### `@vue/test-utils`

> [vue-test-utils.vuejs.org](https://vue-test-utils.vuejs.org) · MIT

Vue 3 component testing utilities. Used by `triggerix-editor-vue` to test composables in `defineComponent` harnesses.

### `@vitejs/plugin-vue`

> [github.com/vitejs/vite-plugin-vue](https://github.com/vitejs/vite-plugin-vue) · MIT

Official Vue SFC support for Vite. Used by `triggerix-collective.github.io` (via vite-plus's Vite).

---

## External: Styles & Assets

### `unocss`

> [unocss.dev](https://unocss.dev) · MIT · Anthony Fu + contributors

Instant on-demand atomic CSS engine. ~6kb min+brotli, zero deps, ~5x faster than Windi/Tailwind JIT.

**Why this project uses it**: dramatically faster than Tailwind in dev, ships no unused CSS, works seamlessly with Vue SFC attribute scanning.

**Presets used in `triggerix-collective.github.io`**:
- `presetWind3` — Tailwind-compatible utilities
- `presetAttributify` — group utilities in HTML attributes (`bg-white text-lg` → `bg-white text-lg` as attributes)
- `presetIcons` — Iconify from `https://esm.sh/`

**Transformers**:
- `variantGroup` — `hover:(bg-white text-lg)` shorthand
- `directives` — `@apply` directive in CSS

**Custom shortcuts** (in `uno.config.ts`): `surface-base`, `surface-subtle`, `border-subtle`, `text-soft`, `focus-ring-primary`, `interactive-soft`, `card`, `card-hover`, `btn-primary`, `btn-secondary`, `input-base`, plus flex helpers (`fcc`, `fccc`, `fxc`, `fyc`, `fbc`, `fsc`).

### `@unocss/reset`

UnoCSS's reset packages. `triggerix-collective.github.io` imports `@unocss/reset/tailwind.css` in `main.ts` for Tailwind-like base styles.

### `uno-colors`

> [github.com/imba97/uno-colors](https://github.com/imba97/uno-colors) · MIT · imba97

Project-local color helper package. Used to derive the custom palette (primary `#4fc3f7`, dark surface tones) in `triggerix-collective.github.io`'s `uno.config.ts`.

---

## External: Code & DOM

### `modern-monaco`

> Used in `triggerix-collective.github.io` for the bottom code drawer

A modern Vue 3 wrapper around Monaco editor. The showcase site uses it via `monaco.editor.createModel` directly (not the `workspace.openTextDocument` path) to avoid a race where Monaco's workspace disposes the model between the user switching demos. The race is documented in `.qoder/plans/monaco-nav-stuck-on-json.md`; the workaround (one shared editor, per-file models) is implemented in `CodeViewer.vue`.

### `jsdom`

> [github.com/jsdom/jsdom](https://github.com/jsdom/jsdom) · MIT

JavaScript implementation of the WHATWG DOM for Node. Used by `triggerix-ai-component-native` (vitest `environment: 'jsdom'`) so the 8 component tests can `document.createElement` and dispatch DOM events.

### `happy-dom`

> [github.com/capricorn86/happy-dom](https://github.com/capricorn86/happy-dom) · MIT

Faster, lighter alternative to jsdom. Used by `triggerix-editor-vue` (vitest `environment: 'happy-dom'`).

---

## External: Package management

### `pnpm`

> [pnpm.io](https://pnpm.io) · MIT (via Corepack)

The package manager across the entire Triggerix ecosystem. Key features used:

- **Workspaces** (`pnpm-workspace.yaml`) — `packages: ['packages/*']` in both monorepos
- **`catalog:` protocol** — shared dependency version pinning across the showcase site's workspace
- **`minimumReleaseAgeExclude`** — bypasses pnpm's newly-published-release quarantine for `@types/node`, `@triggerix/core`, `@triggerix/editor`, `@triggerix/registry`, etc. (treats them as trusted)
- **`trustPolicy: no-downgrade`** — refuses to install older versions of a trusted package
- **`allowBuilds`** — explicitly allows `esbuild` and `simple-git-hooks` to run install scripts
- **`shellEmulator: true`** — enables shell features on Windows for install hooks
- **`--frozen-lockfile`** — used by CI to ensure deterministic installs
- **`bumpp -r`** — recursive version bump across workspaces

---

[← Back to README](./README.md) · [中文版 →](./README_CN.md) · [Projects →](./projects.md)
