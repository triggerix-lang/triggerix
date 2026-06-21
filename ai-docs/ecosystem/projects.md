# Projects

A repo-by-repo survey of every `triggerix-*` repository under `D:/Projects/`. Each section follows the same shape: **identity → purpose → layout → public surface → dependencies → notable patterns**.

Jump to a project:
- [triggerix](#triggerix) — core monorepo (8 packages, ECA engine)
- [triggerix-ai](#triggerix-ai) — AI-generation monorepo (6 packages)
- [triggerix-ai-component-native](#triggerix-ai-component-native) — DOM renderer
- [triggerix-editor-vue](#triggerix-editor-vue) — Vue 3 binding layer
- [triggerix-editor-preset-war3](#triggerix-editor-preset-war3) — War3-style editor preset
- [triggerix-collective.github.io](#triggerix-collectivegithubio) — official showcase site

---

## triggerix

> **Repo**: `D:/Projects/triggerix/` · **License**: MIT
> **Role**: Core engine. Defines the ECA protocol, validates it, and executes it.

The main pnpm-workspace monorepo. Eight independently-publishable packages under `packages/`, all built with [`unbuild`](https://github.com/unjs/unbuild) and tested with [Vitest](https://vitest.dev/).

### Layout

```
triggerix/
├── packages/
│   ├── core/          # Zero-dep type & constant module
│   ├── schema/        # DSL builders (defineTrigger, expr, sequence…)
│   ├── json-schema/   # JSON Schema generator for triggers
│   ├── validator/     # Pure-function validator (never throws)
│   ├── runtime/       # Reference runtime implementation
│   ├── registry/      # Zero-dep BaseRegistry
│   ├── editor/        # Headless editor base (Editor interface + ObservableState)
│   └── triggerix/     # Aggregate re-export
├── tests/             # Parallel tree mirroring packages/
├── scripts/           # build.common.ts (defu-merged unbuild config) + update-readme.ts
├── ai-docs/           # AI-focused design docs (this directory is part of it)
├── .github/workflows/release.yaml  # OIDC publish + changelogithub
└── package.json       # pnpm workspaces + simple-git-hooks + nano-staged
```

### Package-by-package

| Package | Description | External deps | Internal deps |
|---|---|---|---|
| `@triggerix/core` | Canonical types, `as const` operator tuples, `isConditionGroup` guard | **none** | — |
| `@triggerix/schema` | DSL builders (`defineTrigger`, `defineAction`, `defineCondition`, `defineConditions`, `defineConditionGroup`, `defineEvent`, `ref`, `expr`, `binary`, `unary`, `exprCompare`, `logical`, `call`, `concat`, `ternary`, `sequence`, `parallel`, `tryCatch`, `actionIf`) | none | `core` |
| `@triggerix/json-schema` | Hand-rolled JSON Schema (draft-07 subset) generators — `generateTriggerSchema`, `generateEventSchema`, `generateActionSchema`, `generateConditionSchema`, `generateConditionItemSchema`, `generateConditionGroupSchema`, `generateOperatorSchema`, `generateValueSchema`, `generateExpressionSchema`, `generateExprNodeSchema` + binary/unary/compare/logical/call/concat/ternary/operand variants, `generateActionNodeSchema` + sequence/parallel/tryCatch/if variants | none | `core` |
| `@triggerix/validator` | Pure-function validator — `validateTrigger`, `validateEvent`, `validateAction`, `validateActionNode`, `validateCondition`, `validateConditionGroup`, `validateConditionItems`, `validateExpression`, `validateExprNode`, `validateExprOperand`, `validateValue`. Returns `{ valid, errors[] }` with `'structural'`/`'semantic'` classification. **Never throws.** | none | `core` |
| `@triggerix/runtime` | Reference runtime — `createRuntime`, `TriggerixRuntime`, `ActionRegistry`, `EventRegistry`, `compare` (fluent), `evaluateCondition`/`evaluateConditionGroup`/`evaluateConditions`, `evaluateExprNode`/`evaluateExprOperand`, `executeActionNode` (sequence/parallel/if/tryCatch), `resolveValue`, `getNestedValue`, `resolveRefsDeep`, `FunctionRegistry` (default max depth 100) | none | `core` |
| `@triggerix/registry` | `BaseRegistry<TEventDef, TActionDef, TConditionDef>` — three `Map`s + register/get/list. Zero deps. | **none** | — |
| `@triggerix/editor` | Framework-agnostic editor base — `ObservableState<T>` (pub/sub), `Editor<TState>` interface (`getState`, `onChange`, `toTrigger(id?)`, `reset`, `dispose`), `Preset<TEditor>` (`name`, `setup(editor)`). Re-exports `BaseRegistry`/`BaseItemDef`. | none | `core`, `registry` |
| `triggerix` | Aggregate — re-exports `core` + `schema` + `json-schema` + `validator` + `runtime`. **Deliberately excludes** `registry` and `editor` (those are opt-in extensions). | none | all 5 above |

### Dependency Graph (internal)

```
                       @triggerix/core
                            │
       ┌──────────┬─────────┼─────────┬──────────┐
       ▼          ▼         ▼         ▼          ▼
    schema   json-schema  validator runtime   registry
                                                    │
                                                    ▼
                                                 editor
```

The aggregate `triggerix` package sits above the first column. `editor` depends on `registry`, but neither is re-exported by the aggregate.

### Notable Patterns

1. **Single source of truth** — `VALID_OPERATORS`, `LOGICAL_OPERATORS`, `BINARY_OPERATORS`, etc. are `as const` tuples in `@triggerix/core`. Every package imports them, so runtime validation cannot drift from compile-time types.
2. **`not` is excluded from ConditionGroups by design** — negation is expressed via reverse comparisons (`eq` ↔ `neq`) or the expression system (`!`). Documented in core, schema, json-schema, and validator.
3. **Flat condition arrays with implicit AND** — non-group items imply AND, group items explicitly declare `and`/`or`. Three-phase evaluation partitions the array into implicit-AND + explicit-AND + explicit-OR for fast inner loops.
4. **`RefResolver` pattern** — `$ref` resolution is delegated to the runtime via a callback, so action handlers stay ref-unaware. The runtime can install a default resolver or accept a custom one.
5. **Validator never throws** — returns `ValidationResult`; runtime uses exceptions. Error paths are reported as dotted/indexed paths (`'actions[0].params.body.url'`).
6. **DSL builders are pure identity** — `@triggerix/schema`'s `define*` functions return their input unchanged; they exist for type anchoring and readability.
7. **Auto-synced READMEs** — the root `README.md` is the single source; `pnpm update-readme` propagates it into every package via `scripts/update-readme.ts`.
8. **Stub mode** — `pnpm stub` runs `unbuild --stub` in every package, giving live dev linking without rebuilds.

### Tooling

- **Build**: `unbuild` with a shared `scripts/build.common.ts` (defu-merged defaults: `rollup.emitCJS: true`, `rollup.esbuild.minify: true`, `rollup.dts.respectExternal: false`, `declaration: true`, `clean: true`)
- **Test**: Vitest + jsdom (where DOM is needed); tests live in `tests/<package-name>/*.test.ts` mirroring `packages/<package-name>/src/`
- **Lint**: ESLint with [`@antfu/eslint-config`](https://github.com/antfu/eslint-config) (flat config) — single override: `style/comma-dangle: never` (warn)
- **Pre-commit**: `simple-git-hooks` → `nano-staged` → `eslint --cache --fix`
- **Release**: `bumpp -r` locally; tag push triggers `.github/workflows/release.yaml` (OIDC trusted publishing + `changelogithub`)

---

## triggerix-ai

> **Repo**: `D:/Projects/triggerix-ai/`
> **Role**: AI-generation layer. Turns a registered catalog into LLM-ready system prompts + tool schemas.

A monorepo of six packages that bridges `@triggerix/registry` and `@triggerix-ai/component` to OpenAI/Anthropic Function Calling. Every package is independently publishable but developed together with workspace deps.

### Layout

```
triggerix-ai/
├── packages/
│   ├── registry/        # AI metadata for events/actions/conditions
│   ├── component/       # Component protocol + registry + BaseRenderer + mount
│   ├── schema/          # JSON Schema generator for AI tool inputs
│   ├── prompt/          # System prompt builder (static BASE + dynamic catalog)
│   ├── fn/              # One-call Function Calling definition
│   └── triggerix-ai/    # Facade re-export
├── tests/               # One folder per package + integration/end-to-end.test.ts
├── scripts/build.common.ts  # Shared unbuild config (defu-merged)
└── package.json         # pnpm workspaces + simple-git-hooks + nano-staged
```

### Package-by-package

| Package | Description | External deps | Internal deps |
|---|---|---|---|
| `@triggerix-ai/registry` | `AIRegistry extends BaseRegistry<AIEventDef, AIActionDef, AIConditionDef>`, `createAIRegistry()`, identity helpers `defineAIEvent`/`defineAIAction`/`defineAICondition`, `ParamSchema` type | `@triggerix/registry` | — |
| `@triggerix-ai/component` | Component protocol layer: `ComponentDef<T>` abstract + `defineAIComponent`, `ComponentRegistry` + `createComponentRegistry()` + `registerComponent` + `use(components)`, `BaseRenderer<T>` + `Renderer<T>` interface, `mount()` (renderer-agnostic), `RendererContext<TContainer, TElement>`, `MountEmitFn`, `Scope`, `AIOutput`, `ComponentInstance`, `ComponentPropSchema`, `AIComponentDef`. **Zero runtime deps.** | none | — |
| `@triggerix-ai/schema` | JSON Schema (draft-07 subset) generator for AI tool inputs. `generateToolSchema({ registry, component? })` (top-level tool params, with/without components), `generateRuleSchema(registry)` (single ECA rule), `JSONSchema` type | `@triggerix/core` | `component`, `registry` |
| `@triggerix-ai/prompt` | `BASE_SYSTEM_PROMPT` (static protocol spec) + `generateSystemPrompt({ registry, component? })`. Concatenates static protocol + dynamic catalog (events/actions/conditions/components + reverse component→event index) | none | `component`, `registry` |
| `@triggerix-ai/fn` | `defineFunctionCalling({ registry, component?, toolName?, toolDescription? })` returns `{ systemPrompt, tools }` — one call wires everything | none | `component`, `prompt`, `registry`, `schema` |
| `triggerix-ai` | Aggregate facade — `export * from '@triggerix-ai/{component,fn,prompt,registry,schema}'` | none | all 5 |

### Dependency Graph (internal)

```
   registry  ─┐
              ├──> schema ─┐
  component  ─┘            │
                           ├──> fn ──┐
   registry  ─┐            │        │
  component  ─┼──> prompt ─┘        │
                                   ├──> triggerix-ai (facade)
   registry  ─┐                    │
  component  ─┘────────────────────┘
```

Clean layered DAG; no cycles.

### Notable Patterns

1. **Registry-driven everything** — both the JSON Schema (enums constrained to registered IDs) and the system prompt (catalog of events/actions/components) are dynamically derived from `AIRegistry` + optional `ComponentRegistry`. Static `BASE_SYSTEM_PROMPT` is business-agnostic; everything domain-specific comes from the registries at runtime.
2. **Renderer abstraction in `@triggerix-ai/component`** — `BaseRenderer` and `mount()` are intentionally generic over `TContainer`/`TElement`. This monorepo ships **no DOM/Vue/React code** — concrete renderers live in sibling repos (`triggerix-ai-component-native`, future Vue/React renderers). `triggers: unknown[]` is left loosely typed in `AIOutput` to avoid cross-package type coupling.
3. **Single-source-of-truth for params** — `ParamSchema` (registry) and `ComponentPropSchema` (component) are structurally identical and feed the same JSON Schema pipeline.
4. **Two output modes** — `component` mode (`{ components, triggers }`) vs trigger-only mode (`{ triggers }`). All higher layers honor this toggle uniformly.
5. **Synchronized versioning** — `bumpp -r` bumps all 6 packages in lockstep. Identical `build.config.ts` shape (delegates to shared `build.common.ts`) keeps releases uniform.
6. **Dual publish** — every package independently publishable to npm with both ESM and CJS outputs, internally developed as a monorepo with workspace deps + path aliases (typical nuxt-/unjs-style ecosystem).

### Tooling

Same as `triggerix` — `unbuild` (shared `build.common.ts`) + Vitest + ESLint (`@antfu/eslint-config`) + `simple-git-hooks` + `nano-staged`. Path aliases in `tsconfig.json` and `vitest.config.ts` point each package at `packages/<name>/src/index.ts`.

---

## triggerix-ai-component-native

> **Repo**: `D:/Projects/triggerix-ai-component-native/`
> **Role**: Reference DOM renderer. Implements the `@triggerix-ai/component` protocol with 8 unstyled native elements.

A standalone single-package repo (not part of any workspace). Ships the **prototype renderer** that proves the protocol end-to-end; future production renderers (Vue, React, atom) will live elsewhere.

### Layout

```
triggerix-ai-component-native/
├── src/
│   ├── index.ts                    # Public re-exports + `components` array
│   ├── def.ts                      # NativeComponentDef abstract class
│   ├── renderer.ts                 # nativeRendererContext + mountNative
│   └── components/
│       ├── index.ts                # 8 component re-exports
│       ├── button.ts input.ts card.ts
│       ├── uploadButton.ts label.ts image.ts
│       └── checkbox.ts select.ts
└── tests/                          # 11 test files (vitest + jsdom)
    ├── def.test.ts renderer.test.ts components.test.ts
    └── components/{button,input,card,uploadButton,label,image,checkbox,select}.test.ts
```

### Public API

| Export | Kind | Description |
|---|---|---|
| `NativeComponentDef` | abstract class | Extends `ComponentDef<HTMLElement>` — base for custom native components |
| `ButtonComponent` … `SelectComponent` | 8 classes | One per component |
| `button`, `input`, `card`, `uploadButton`, `label`, `image`, `checkbox`, `select` | singleton instances | The 8 component objects, shared with `components` entries |
| `components` | `const` array | All 8 singletons in stable order |
| `mountNative(output, container, components, emit)` | function | Thin wrapper over `mount()` from `@triggerix-ai/component` |
| `nativeRendererContext` | `RendererContext<HTMLElement, HTMLElement>` | The DOM `appendChild`/`removeChild` adapter |
| `RendererContext`, `MountEmitFn` | types | Re-exported from `@triggerix-ai/component` |

### 8 Components

| Component | `type` | `container` | DOM tag | Binds | Payload |
|---|---|---|---|---|---|
| `button` | `'button'` | `false` | `<button>` | (developer binds) | — |
| `input` | `'input'` | `false` | `<input>` | (developer binds) | `{ value }` |
| `card` | `'card'` | **`true`** | `<div>` | — | accepts children; optional `title` → `<h3>` |
| `uploadButton` | `'uploadButton'` | `false` | `<label>` wrapping `<input type="file">` | (developer binds) | `{ files, count }` |
| `label` | `'label'` | `false` | `<label>` | — | honors `for` → `htmlFor` |
| `image` | `'image'` | `false` | `<img>` | — | honors `width`/`height` |
| `checkbox` | `'checkbox'` | `false` | `<label>` wrapping hidden `<input type="checkbox">` | (developer binds) | `{ checked }` |
| `select` | `'select'` | `false` | `<select>` | (developer binds) | `{ value }` |

> **Note**: No component pre-binds a default DOM event. Developers always call `.bind('click', 'button.click')` etc. in their `setup.ts`. The `PLAN.md` originally sketched pre-bound defaults; the shipped code does not.

### Dependencies

- **Runtime**: `@triggerix-ai/component` (entire protocol layer), `@triggerix/core` (declared but currently unused in `src/`)
- **Dev**: `@antfu/eslint-config`, `esno`, `jsdom`, `typescript`, `unbuild`, `vitest`
- **TS path aliases**: `@triggerix-ai/component` → `../triggerix-ai/packages/component/dist/index.d.ts`, `@triggerix/core` → `../triggerix/packages/core/dist/index.d.ts` (editor support only)

### Notable Patterns

1. **NativeComponentDef as thin extension** — `src/def.ts` is a one-line abstract class extending `ComponentDef<HTMLElement>`. The `bind(domEvent, eventId)` API and `events` getter come from the parent.
2. **Source captured via closure at mount time** — when `mount()` (from upstream) wires each component instance, it closure-captures `instance.name` as `source` and forwards `(eventId, source, payload)` to the application's `emit` callback. Concrete components never see `source`. Two buttons can both fire `'button.click'` with sources `'save'`/`'cancel'` and be correctly disambiguated by the runtime.
3. **Scope isolation via name map** — `Scope.elements: Map<string, HTMLElement>` is built from `instance.name`. `$ref` strings like `"nickname.value"` are resolved through `ctx.getValue(ref)` (splits on `.`, reads `(el as any)[prop]`). Two mounts are completely independent because each gets its own scope — **no DOM ids, no Shadow DOM**.
4. **Dual export (named + array)** — the 8 named singletons and the `components` array share object references, so `button.bind(...)` immediately reflects in `components[0]`.

### Caveats (documented for AI assistants)

- **`PLAN.md` is aspirational** — describes a local `src/runtime/{mount,context,evaluate,execute,resolve}.ts` layer that was never built; the actual implementation delegates everything to `@triggerix-ai/component`.
- **Scope isolation is "by name" only** — elements are tracked in `Map<name, element>`; no DOM `id` is set. Two mounts on the same container can visually overlap; consumers must use distinct containers for hard DOM isolation.
- **`@triggerix/core` is declared but unused** — reserved for future trigger/condition/action types; may be dropped or kept as a forward-looking dep.

### Tooling

`unbuild` (ESM + CJS + dts), Vitest + jsdom, ESLint (`@antfu/eslint-config`), strict TypeScript.

---

## triggerix-editor-vue

> **Repo**: `D:/Projects/triggerix-editor-vue/`
> **Role**: Vue 3 binding layer for `@triggerix/editor`. Wraps a framework-agnostic editor in Vue reactivity.

Single-package repo. Intentionally tiny — 5 source files, 13 test files. Zero runtime deps beyond Vue 3 and `@triggerix/editor`.

### Layout

```
triggerix-editor-vue/
├── src/
│   ├── index.ts                          # Barrel
│   ├── types.ts                          # Re-exports Editor, BaseItemDef, Preset + return-type interfaces
│   ├── context.ts                        # provideEditor / injectEditor (Vue InjectionKey)
│   └── composables/
│       ├── useEditor.ts                  # Main composable: shallowRef + onChange + onScopeDispose
│       └── useEditorState.ts             # Read-only child accessor
└── tests/
    ├── index.test.ts                     # Public API surface lock
    ├── context.test.ts
    ├── composables/{useEditor,useEditorState}.test.ts
    └── helpers/createMockEditor.ts       # Framework-free mock
```

### Public API

```ts
export { useEditor } from './composables/useEditor'
export { useEditorState } from './composables/useEditorState'
export { injectEditor, provideEditor } from './context'
export type { BaseItemDef, Editor, Preset } from './types'
```

### Core Composable

```ts
function useEditor<TState>(editor: Editor<TState>): {
  editor: Editor<TState>
  state: ShallowRef<TState>
  toTrigger: (id?: string) => ReturnType<Editor<TState>['toTrigger']>
  reset: () => ReturnType<Editor<TState>['reset']>
}
```

Lifecycle:
1. `shallowRef<TState>` hydrated synchronously from `editor.getState()` (no deep reactivity)
2. Subscribes to `editor.onChange` exactly once; mirrors new state on each tick
3. On scope dispose: unsubscribes and calls `editor.dispose()`
4. Calls `provideEditor(editor, state)` so descendants can read without manual wiring

### Notable Patterns

1. **Single responsibility** — one file per concern; no magic.
2. **`TState` generic flows from editor creation to descendant reads** — type-safe at the seam.
3. **Structural test coverage** — `index.test.ts` locks the public API surface; lifecycle tests cover "late update after unmount" edge case.
4. **Externals set exactly matches peer/runtime deps** — Vue and `@triggerix/editor` are external in `build.config.ts`, so the bundle is small and decoupled from internal upstream changes.
5. **Zero third-party runtime deps** — README explicitly calls this out as a feature.

### Dependencies

- **Runtime (1 dep + 1 peer)**: `@triggerix/editor`, `vue`
- **Dev**: `vue`, `@triggerix/core` (test type imports), `@vue/test-utils`, `happy-dom`, `vitest`, `@vitest/coverage-v8`, `unbuild`, `typescript`, `@antfu/eslint-config`, `bumpp`, `nano-staged`, `simple-git-hooks`, `eslint`

### Tooling

`unbuild` (ESM + CJS + dts, externals: `vue`, `@triggerix/editor`), Vitest + happy-dom + `@vue/test-utils`, ESLint (`@antfu/eslint-config`). Build/test/lint pre-commit via `simple-git-hooks` + `nano-staged`.

---

## triggerix-editor-preset-war3

> **Repo**: `D:/Projects/triggerix-editor-preset-war3/`
> **Role**: Domain-agnostic, template-driven editor implementation inspired by the Warcraft III World Editor trigger system.

Despite the "War3" branding, **this package ships no War3 catalog**. It is a generic preset that lets any domain (web automation, IoT rules, game scripting) compose triggers from natural-language templates with `${slot}` placeholders filled by typed Tools.

### Layout

```
triggerix-editor-preset-war3/
├── src/
│   ├── index.ts                          # Public re-exports
│   ├── createWar3Editor.ts               # Factory wiring registry + state + descriptors + serializer
│   ├── preset.ts                         # defineWar3Preset(options)
│   ├── helpers.ts                        # defineLeafTool / defineCompositeTool / defineCondition
│   ├── core/
│   │   ├── types.ts                      # All domain types
│   │   ├── parser.ts                     # parseTemplate → Segment[]
│   │   ├── registry.ts                   # War3Registry extends BaseRegistry (adds tools)
│   │   └── state.ts                      # War3EditorStateManager extends ObservableState
│   ├── presentation/
│   │   ├── descriptor.ts                 # getEventDescriptor / getActionDescriptor / getConditionDescriptor / getToolDescriptor / getSlotToolDescriptors
│   │   └── display.ts                    # resolveSlotDisplayText (deep-equality for object-valued select options)
│   └── serialization/
│       └── serializer.ts                 # resolveSlotValue (recursive) + toTrigger → standard Trigger JSON
└── tests/                                # 9 spec files mirroring src/
```

### Public API (key exports)

```text
// Factory & Preset
createWar3Editor(): War3Editor
defineWar3Preset(options): Preset<War3Editor>

// Tool builders
defineLeafTool<TIn, TOut>(def): LeafToolDef
defineCompositeTool<TSlotValues, TOut>(def): CompositeToolDef
defineCondition<TSlotValues>(def): ConditionDef

// War3Editor methods (full surface)
registerEvent / registerAction / registerCondition / registerTool
getRegistry / getAvailableEvents / getAvailableActions / getAvailableConditions
getEventDescriptor / getActionDescriptor(index) / getConditionDescriptor(index) / getToolDescriptor(name, slotValues?)
getSlotTools(slotDef) / getValueSources(valueType?)       // { conditions, tools } filtered by type
setEvent / clearEvent / setEventSlot
addAction / removeAction / moveAction / setActionSlot
addCondition / removeCondition / setConditionSlot
applyPreset(preset)
getState / onChange / reset / dispose                     // from base Editor
toTrigger(triggerId?) / resolveSlotValue(entry)           // serialization

// Pure helpers
parseTemplate(template, slots?, slotValues?): Segment[]
resolveSlotDisplayText(entry, registry, fallbackLabel): string

// Re-exported types: SlotDef, SlotValueEntry, LeafToolDef, CompositeToolDef, ToolDef,
//   War3EventDef, War3ActionDef, War3ConditionDef, Segment, ItemDescriptor, ToolDescriptor,
//   ItemState, War3EditorState, War3PresetOptions + (from @triggerix/editor) BaseItemDef, Preset
```

### Core Type Concepts

- **Template** — string with `${key}` placeholders, e.g. `"Player ${player} says ${message}"`.
- **Slot** — `SlotDef { label, tools: string[] }` declared by event/action/condition/tool.
- **Tool** — slot filler; `LeafTool` (single-value `text`/`number`/`select`) or `CompositeTool` (composes other tools through its own template).
- **Segment** — `{ type: 'text', content }` or `{ type: 'slot', key, label, tools, value, entry }`.
- **SlotValueEntry** — `{ tool, value, subSlots? }` — recursive (composite tools fill `subSlots`).
- **Value Source** — same-type `Condition`s + `Tool`s queryable via `getValueSources(type)`, so a slot can accept another slot's resolved value as its own input.

### Data Flow

```
Developer defines (template-driven)
  War3EventDef / War3ActionDef / War3ConditionDef / ToolDef
        │
        └── defineWar3Preset ──▶ Preset
                                       │
            editor.applyPreset(preset) │
                                       ▼
                                  War3Registry (with Tools)
                                       │
                state mutations       │
   setEvent / addAction / setActionSlot ... │
                                       ▼
                              War3EditorStateManager (ObservableState)
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
parseTemplate (→ Segment[])    resolveSlotDisplayText        toTrigger (→ Trigger JSON)
    ItemDescriptor /            human-readable                Action[] / Event / ConditionGroup
    ToolDescriptor              slot rendering                (compat with @triggerix/core)
```

### Notable Patterns

1. **`War3Registry extends BaseRegistry`** — adds `registerTool` / `getTool` / `getTools` / `getValueSources` on top of `@triggerix/registry`'s event/action/condition maps.
2. **`War3EditorStateManager extends ObservableState`** — adds template-style mutators (`setEvent`, `addAction`, `moveAction`, `setActionSlot`, …) and a private `setItemSlot(field, index, key, entry)` helper for immutable updates.
3. **Conditions are `Action[]` internally, cast to `ConditionGroup`** at serialization. Runtime maps semantics.
4. **`crypto.randomUUID` with fallback** — uses `crypto.randomUUID()` for IDs; falls back to `trigger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` if unavailable. Requires Node 18+ or modern browsers.
5. **`resolveSlotDisplayText` does deep equality** — for `select` slots whose options carry object values (e.g. `{ value: 'red', label: 'Red' }`), the matcher compares via deep-equal not by reference; falls back to `JSON.stringify` to avoid `[object Object]`.

### Dependencies

- **Runtime**: `@triggerix/core`, `@triggerix/editor` (both externals in `build.config.ts`)
- **Dev**: `@antfu/eslint-config`, `bumpp`, `eslint`, `jiti`, `nano-staged`, `simple-git-hooks`, `typescript`, `unbuild`, `vitest`

### Tooling

`unbuild` (single entry, `declaration: true`, `clean: true`, externals match runtime deps). Vitest + Node environment. TypeScript strict. ESLint (`@antfu/eslint-config`). GitHub Actions `changelogithub` + `pnpm publish` on tag push.

---

## triggerix-collective.github.io

> **Repo**: `D:/Projects/triggerix-collective.github.io/` (private)
> **Role**: Official showcase site. Demonstrates "visual editing a JSON-described trigger → runtime executes ECA logic" with 5 progressively more complex demos.

A Vue 3 SPA deployed to GitHub Pages via `.github/workflows/deploy-pages.yaml`. All UI copy is Chinese (zh-CN); README ships in both English (`README.md`) and Chinese (`README_CN.md`).

### Layout

```
triggerix-collective.github.io/
├── src/
│   ├── main.ts                          # createApp + router + reset/uno/style imports
│   ├── App.vue                          # Header + RouterView + draggable Monaco drawer
│   ├── router.ts                        # vue-router/auto-routes + HMR
│   ├── style.css                        # Dark surface reset (#121212)
│   ├── pages/
│   │   ├── index.vue                    # Hero + 5 scenario cards
│   │   └── demo/                        # File-routed, one per scenario
│   │       ├── button-click.vue         # Difficulty 1: simplest ECA
│   │       ├── input-focus.vue          # Difficulty 2: blur+focus triggers
│   │       ├── button-modify-input.vue  # Difficulty 3: action with parameter, $ref: document.title
│   │       ├── carousel-switch.vue      # Difficulty 4: one event → multiple actions
│   │       └── carousel-linkage.vue     # Difficulty 5: first composite-tool demo
│   ├── layouts/DemoLayout.vue           # 2-column Playground | Editor
│   ├── components/
│   │   ├── NavDropdown.vue              # Header nav with hover delay
│   │   ├── DemoToast.vue                # Bottom toast notification
│   │   ├── playground/                  # PlayButton / PlayInput / PlayCarousel
│   │   └── code-viewer/                 # CodeTabs + CodeViewer (Monaco)
│   ├── composables/                     # useCodePanel / useSyncCodePanel / useDemoRuntime
│   ├── definitions/                     # Trigger schemas per demo (events/actions/conditions/tools/handlers)
│   │   ├── helpers.ts shared-tools.ts shared-values.ts
│   │   ├── button-click.ts input-focus.ts button-modify-input.ts
│   │   ├── carousel-switch.ts carousel-linkage.ts
│   │   └── code-snippets/               # Read-only code shown in Monaco drawer
│   ├── trigger-ui/                      # War3-style editor UI (consumed by every demo)
│   │   ├── index.ts composables/{useTriggerEditor,useModal}.ts
│   │   └── components/{TriggerEditor,TriggerSection,TriggerItem,TriggerTabs,
│   │                    SegmentRenderer,SlotChip,ToolInput,
│   │                    ItemEditorModal,SlotFillModal,Modal}.vue
│   └── assets/hero.png
├── public/{favicon.svg, icons.svg}
├── .auto-generated/typed-router.d.ts    # vue-router generated route types
├── .vite-hooks/pre-commit               # vp staged hook
└── .github/workflows/deploy-pages.yaml  # pnpm install → vp check → vp build → upload dist
```

### 6 Routes (file-based)

| Path | Difficulty | What it shows |
|---|---|---|
| `/` | — | Hero + 5-card scenario grid |
| `/demo/button-click` | 1 | Two buttons → trigger fires → toast/alert |
| `/demo/input-focus` | 2 | Two triggers: `input_focus` → `show_tip`, `input_blur` → `hide_tip` |
| `/demo/button-modify-input` | 3 | Action with parameter, `$ref: document.title` resolved live |
| `/demo/carousel-switch` | 4 | One event → multiple actions (toast + change_bg_color) |
| `/demo/carousel-linkage` | 5 | First composite-tool demo: `$ref: carousel.<id>.index` wires left→right carousel |

### Tech Stack

- **Vue 3** with `<script setup lang="ts">` SFCs and Composition API
- **vue-router** with file-based routing via `vue-router/auto-routes` (typed router at `.auto-generated/typed-router.d.ts`)
- **Vite via `vite-plus`** (`vp dev`/`vp build`/`vp preview`/`vp check`/`vp staged`) — wraps Rolldown/Vitest/tsdown/Oxlint/Oxfmt
- **UnoCSS** with `presetWind3`, `presetAttributify`, `presetIcons` (Iconify from `https://esm.sh/`), transformers `directives`/`variantGroup`
- **`@unocss/reset/tailwind.css`** for Tailwind-like reset
- **`uno-colors`** for the custom palette (primary `#4fc3f7`); hand-rolled dark theme tokens (`surface-base`, `surface-subtle`, `border-subtle`, `text-soft`, `focus-ring-primary`, etc.)
- **`modern-monaco`** for the bottom code drawer — uses `monaco.editor.createModel` directly to avoid `workspace.openTextDocument` self-dispose race (documented in `.qoder/plans/monaco-nav-stuck-on-json.md`)
- **`@vueuse/core`** for `useLocalStorage` (drawer height) and `onClickOutside`
- **Google Fonts**: Cinzel (display) + JetBrains Mono (code), preconnected from `index.html`

### Triggerix Dependencies (the libraries being demoed)

Via `pnpm-workspace.yaml` `catalog:`:
- `@triggerix/runtime` — `createRuntime`, `registerEvent`, `registerAction`, `addTrigger`, `emit`
- `triggerix-editor-preset-war3` — `War3Editor`, `createWar3Editor`, `defineEvent/Action/Condition/LeafTool/CompositeTool`, `resolveSlotDisplayText`
- `triggerix-editor-vue` — `useEditor` composable

These three together power every demo. `@triggerix/core`, `@triggerix/editor`, `@triggerix/registry` are pinned under `minimumReleaseAgeExclude` to allow freshly-published "next" builds.

### How it Demonstrates Triggerix

1. **Definition stage** — `src/definitions/*.ts` describe each demo's events/actions/conditions, tools (leaf & composite), templates with `${slot}` placeholders, and handler signatures.
2. **Editing stage** — `trigger-ui/` provides the War3-style editor (`TriggerEditor.vue` = `TriggerSection` × 3 + modals + slot chips). Slot clicks open `SlotFillModal`, which lets users pick a tool and fill the value via `ToolInput.vue`. Composite tools (e.g. `carousel_index_ref`) expose nested sub-slots.
3. **Sync stage** — `useDemoRuntime` creates one `War3Editor` per trigger, mounts it with `useEditor`, registers events and action handlers on a shared `createRuntime()`, and watches each editor's state to re-call `runtime.addTrigger`. It auto-injects a `payload.source === <id>` condition so multiple triggers per event type can coexist without false matches.
4. **Execution stage** — Playground components (`PlayButton`/`PlayInput`/`PlayCarousel`) emit events like `button_click`, `input_focus`, `carousel_change` with `{ source, value?, index? }`. The runtime matches and dispatches handlers (`show_message`, `set_input_value`, `change_bg_color`, `show_tip`, `hide_tip`, `set_carousel_index`), which update demo-local state and surface toast messages.

The bottom Monaco drawer (draggable, height persisted in `localStorage`) shows source files (`setup.ts`, `handlers.ts`, Demo analogues) plus a live JSON dump of every trigger, so a developer sees the exact serialized output of their visual edits.

### Build / Deploy

`.github/workflows/deploy-pages.yaml` on push to `main`:
1. pnpm setup → Node LTS
2. `pnpm install --frozen-lockfile`
3. `pnpm run prepare` (generates `.auto-generated/typed-router.d.ts`)
4. `pnpm run lint` (`vp check`)
5. `pnpm run build` (`vp build`)
6. Copy `dist/index.html` → `dist/404.html` (SPA fallback)
7. Upload `dist` artifact → `actions/deploy-pages@v4`

Local: `pnpm dev` / `pnpm build` / `pnpm preview` / `pnpm lint`. Pre-commit: `vp staged`.

### Notable Observations

- **Not versioned for release** — private. This is essentially the official docs/showcase for the triggerix monorepo.
- **Only 3 triggerix packages are directly consumed**: `@triggerix/runtime`, `triggerix-editor-preset-war3`, `triggerix-editor-vue`.
- **No tests wired up** — no `vitest` config; `vp test` not in scripts.
- **No backend** — all examples are client-side; `set_input_value` uses `$ref` like `document.title`, `window.innerWidth`, `location.href` resolved at runtime by `resolveRefPath`.
- **Auto-generated routes** — adding a new file under `src/pages/` automatically produces a new route + typed-router declaration after running `pnpm run prepare`.

---

[← Back to README](./README.md) · [中文版 →](./README_CN.md) · [Libraries →](./libraries.md)
