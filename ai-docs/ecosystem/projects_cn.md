# 项目

`D:/Projects/` 下每一个 `triggerix-*` 仓库的逐库调研。每个章节都遵循相同的结构：**身份 → 用途 → 目录布局 → 公共接口 → 依赖 → 值得注意的模式**。

跳转到项目：
- [triggerix](#triggerix) — 核心 monorepo（8 个包，ECA 引擎）
- [triggerix-ai](#triggerix-ai) — AI 生成层 monorepo（6 个包）
- [triggerix-ai-component-native](#triggerix-ai-component-native) — DOM 渲染器
- [triggerix-editor-vue](#triggerix-editor-vue) — Vue 3 绑定层
- [triggerix-editor-preset-war3](#triggerix-editor-preset-war3) — War3 风格编辑器预设
- [triggerix-collective.github.io](#triggerix-collectivegithubio) — 官方展示站点

---

## triggerix

> **仓库**：`D:/Projects/triggerix/` · **协议**：MIT
> **定位**：核心引擎。定义 ECA 协议，对其进行校验并执行。

主 pnpm-workspace monorepo。`packages/` 下有 8 个可独立发布的包，全部使用 [`unbuild`](https://github.com/unjs/unbuild) 构建，并使用 [Vitest](https://vitest.dev/) 测试。

### 目录布局

```
triggerix/
├── packages/
│   ├── core/          # 零依赖的类型与常量模块
│   ├── schema/        # DSL 构建器（defineTrigger, expr, sequence…）
│   ├── json-schema/   # trigger 的 JSON Schema 生成器
│   ├── validator/     # 纯函数校验器（永不抛错）
│   ├── runtime/       # 参考运行时实现
│   ├── registry/      # 零依赖的 BaseRegistry
│   ├── editor/        # 无头编辑器基类（Editor 接口 + ObservableState）
│   └── triggerix/     # 聚合再导出
├── tests/             # 与 packages/ 平行的测试树
├── scripts/           # build.common.ts（defu 合并的 unbuild 配置）+ update-readme.ts
├── ai-docs/           # 面向 AI 的设计文档（本目录即为其一部分）
├── .github/workflows/release.yaml  # OIDC 发布 + changelogithub
└── package.json       # pnpm workspaces + simple-git-hooks + nano-staged
```

### 各包一览

| 包 | 描述 | 外部依赖 | 内部依赖 |
|---|---|---|---|
| `@triggerix/core` | 规范类型、`as const` 操作符元组、`isConditionGroup` 守卫 | **无** | — |
| `@triggerix/schema` | DSL 构建器（`defineTrigger`、`defineAction`、`defineCondition`、`defineConditions`、`defineConditionGroup`、`defineEvent`、`ref`、`expr`、`binary`、`unary`、`exprCompare`、`logical`、`call`、`concat`、`ternary`、`sequence`、`parallel`、`tryCatch`、`actionIf`） | 无 | `core` |
| `@triggerix/json-schema` | 手写的 JSON Schema（draft-07 子集）生成器 — `generateTriggerSchema`、`generateEventSchema`、`generateActionSchema`、`generateConditionSchema`、`generateConditionItemSchema`、`generateConditionGroupSchema`、`generateOperatorSchema`、`generateValueSchema`、`generateExpressionSchema`、`generateExprNodeSchema` + 二元/一元/比较/逻辑/调用/拼接/三元/操作数变体，`generateActionNodeSchema` + sequence/parallel/tryCatch/if 变体 | 无 | `core` |
| `@triggerix/validator` | 纯函数校验器 — `validateTrigger`、`validateEvent`、`validateAction`、`validateActionNode`、`validateCondition`、`validateConditionGroup`、`validateConditionItems`、`validateExpression`、`validateExprNode`、`validateExprOperand`、`validateValue`。返回 `{ valid, errors[] }`，错误按 `'structural'`/`'semantic'` 分类。**永不抛错。** | 无 | `core` |
| `@triggerix/runtime` | 参考运行时 — `createRuntime`、`TriggerixRuntime`、`ActionRegistry`、`EventRegistry`、`compare`（流式）、`evaluateCondition`/`evaluateConditionGroup`/`evaluateConditions`、`evaluateExprNode`/`evaluateExprOperand`、`executeActionNode`（sequence/parallel/if/tryCatch）、`resolveValue`、`getNestedValue`、`resolveRefsDeep`、`FunctionRegistry`（默认最大深度 100） | 无 | `core` |
| `@triggerix/registry` | `BaseRegistry<TEventDef, TActionDef, TConditionDef>` — 三个 `Map` 加 register/get/list。零依赖。 | **无** | — |
| `@triggerix/editor` | 框架无关的编辑器基类 — `ObservableState<T>`（发布/订阅）、`Editor<TState>` 接口（`getState`、`onChange`、`toTrigger(id?)`、`reset`、`dispose`）、`Preset<TEditor>`（`name`、`setup(editor)`）。再导出 `BaseRegistry`/`BaseItemDef`。 | 无 | `core`、`registry` |
| `triggerix` | 聚合包 — 再导出 `core` + `schema` + `json-schema` + `validator` + `runtime`。**刻意不包含** `registry` 与 `editor`（二者为可选扩展）。 | 无 | 上面全部 5 个 |

### 内部依赖图

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

聚合包 `triggerix` 位于第一列之上。`editor` 依赖 `registry`，但聚合包不会再次导出它们。

### 值得注意的模式

1. **单一事实来源** — `VALID_OPERATORS`、`LOGICAL_OPERATORS`、`BINARY_OPERATORS` 等都是在 `@triggerix/core` 中以 `as const` 元组声明的常量。每一个包都引用它们，因此运行时校验不会与编译期类型发生偏离。
2. **`not` 被刻意排除在 ConditionGroup 之外** — 取反通过反向比较（`eq` ↔ `neq`）或表达式系统的 `!` 来表达。在 core、schema、json-schema 与 validator 中均有文档说明。
3. **扁平条件数组 + 隐式 AND** — 非分组项隐含 AND，分组项显式声明 `and`/`or`。三阶段求值将数组划分为隐式 AND + 显式 AND + 显式 OR，以加速内层循环。
4. **`RefResolver` 模式** — `$ref` 的解析通过回调委托给运行时，因此 action handler 无需关心 ref。运行时既可以安装默认解析器，也可以接受自定义解析器。
5. **校验器永不抛错** — 返回 `ValidationResult`；运行时使用异常。错误路径以点号/下标形式报告（如 `'actions[0].params.body.url'`）。
6. **DSL 构建器是纯恒等函数** — `@triggerix/schema` 中的 `define*` 函数原样返回入参；它们仅服务于类型锚定与可读性。
7. **README 自动同步** — 根目录 `README.md` 是单一来源；`pnpm update-readme` 通过 `scripts/update-readme.ts` 将其同步到每一个包内。
8. **Stub 模式** — `pnpm stub` 在每个包内执行 `unbuild --stub`，实现无重建的实时开发链接。

### 工具链

- **构建**：`unbuild`，共用一份 `scripts/build.common.ts`（通过 defu 合并默认值：`rollup.emitCJS: true`、`rollup.esbuild.minify: true`、`rollup.dts.respectExternal: false`、`declaration: true`、`clean: true`）
- **测试**：Vitest + jsdom（需要 DOM 时使用）；测试位于 `tests/<package-name>/*.test.ts`，与 `packages/<package-name>/src/` 一一对应
- **Lint**：ESLint，使用 [`@antfu/eslint-config`](https://github.com/antfu/eslint-config)（扁平配置）— 唯一覆写：`style/comma-dangle: never`（警告）
- **预提交**：`simple-git-hooks` → `nano-staged` → `eslint --cache --fix`
- **发布**：本地 `bumpp -r`；推送 tag 触发 `.github/workflows/release.yaml`（OIDC 受信任发布 + `changelogithub`）

---

## triggerix-ai

> **仓库**：`D:/Projects/triggerix-ai/`
> **定位**：AI 生成层。将已注册的目录转换为可供 LLM 使用的系统提示与工具 schema。

由 6 个包组成的 monorepo，在 `@triggerix/registry` 与 `@triggerix-ai/component` 之间架起桥梁，使其与 OpenAI/Anthropic 的 Function Calling 对接。每个包都可独立发布，但通过 workspace 依赖共同开发。

### 目录布局

```
triggerix-ai/
├── packages/
│   ├── registry/        # 事件/动作/条件的 AI 元数据
│   ├── component/       # Component 协议 + registry + BaseRenderer + mount
│   ├── schema/          # AI 工具入参的 JSON Schema 生成器
│   ├── prompt/          # 系统提示构建器（静态 BASE + 动态目录）
│   ├── fn/              # 一键完成 Function Calling 定义
│   └── triggerix-ai/    # 总入口再导出
├── tests/               # 每个包对应一个目录 + integration/end-to-end.test.ts
├── scripts/build.common.ts  # 共用的 unbuild 配置（defu 合并）
└── package.json         # pnpm workspaces + simple-git-hooks + nano-staged
```

### 各包一览

| 包 | 描述 | 外部依赖 | 内部依赖 |
|---|---|---|---|
| `@triggerix-ai/registry` | `AIRegistry extends BaseRegistry<AIEventDef, AIActionDef, AIConditionDef>`，`createAIRegistry()`，恒等辅助函数 `defineAIEvent`/`defineAIAction`/`defineAICondition`，`ParamSchema` 类型 | `@triggerix/registry` | — |
| `@triggerix-ai/component` | Component 协议层：`ComponentDef<T>` 抽象类 + `defineAIComponent`，`ComponentRegistry` + `createComponentRegistry()` + `registerComponent` + `use(components)`，`BaseRenderer<T>` + `Renderer<T>` 接口，`mount()`（与渲染器无关），`RendererContext<TContainer, TElement>`，`MountEmitFn`，`Scope`，`AIOutput`，`ComponentInstance`，`ComponentPropSchema`，`AIComponentDef`。**零运行时依赖。** | 无 | — |
| `@triggerix-ai/schema` | AI 工具入参的 JSON Schema（draft-07 子集）生成器。`generateToolSchema({ registry, component? })`（顶层工具参数，含/不含 components）、`generateRuleSchema(registry)`（单条 ECA 规则）、`JSONSchema` 类型 | `@triggerix/core` | `component`、`registry` |
| `@triggerix-ai/prompt` | `BASE_SYSTEM_PROMPT`（静态协议规范）+ `generateSystemPrompt({ registry, component? })`。拼接静态协议与动态目录（events/actions/conditions/components + 反向 component→event 索引） | 无 | `component`、`registry` |
| `@triggerix-ai/fn` | `defineFunctionCalling({ registry, component?, toolName?, toolDescription? })` 返回 `{ systemPrompt, tools }` — 一次调用完成全部接线 | 无 | `component`、`prompt`、`registry`、`schema` |
| `triggerix-ai` | 聚合总入口 — `export * from '@triggerix-ai/{component,fn,prompt,registry,schema}'` | 无 | 上面全部 5 个 |

### 内部依赖图

```
   registry  ─┐
              ├──> schema ─┐
  component  ─┘            │
                           ├──> fn ──┐
   registry  ─┐            │        │
  component  ─┼──> prompt ─┘        │
                                   ├──> triggerix-ai（总入口）
   registry  ─┐                    │
  component  ─┘────────────────────┘
```

清晰的分层 DAG，无环。

### 值得注意的模式

1. **一切由 Registry 驱动** — JSON Schema（枚举被已注册 ID 约束）与系统提示（events/actions/components 目录）均由 `AIRegistry` 与可选的 `ComponentRegistry` 动态生成。静态的 `BASE_SYSTEM_PROMPT` 与业务无关；所有领域相关的部分都在运行时从 registry 获得。
2. **`@triggerix-ai/component` 中的渲染器抽象** — `BaseRenderer` 与 `mount()` 故意对 `TContainer`/`TElement` 保持泛型。本 monorepo **不包含任何 DOM/Vue/React 代码** — 具体渲染器位于兄弟仓库（`triggerix-ai-component-native` 以及未来的 Vue/React 渲染器）。`AIOutput` 中的 `triggers: unknown[]` 故意保持弱类型，以避免跨包类型耦合。
3. **参数的单一事实来源** — `ParamSchema`（registry）与 `ComponentPropSchema`（component）结构相同，并流入同一套 JSON Schema 流水线。
4. **两种输出模式** — `component` 模式（`{ components, triggers }`）与仅 trigger 模式（`{ triggers }`）。所有上层均一致遵守这一切换。
5. **版本同步** — `bumpp -r` 协同升版全部 6 个包。一致的 `build.config.ts` 结构（委托给共用的 `build.common.ts`）保证发布行为统一。
6. **双重发布** — 每个包均可独立发布到 npm，同时输出 ESM 与 CJS；内部以 monorepo + workspace 依赖 + 路径别名形式开发（典型的 nuxt/unjs 风格生态）。

### 工具链

与 `triggerix` 相同 — `unbuild`（共用 `build.common.ts`）+ Vitest + ESLint（`@antfu/eslint-config`）+ `simple-git-hooks` + `nano-staged`。`tsconfig.json` 与 `vitest.config.ts` 中的路径别名将各包指向 `packages/<name>/src/index.ts`。

---

## triggerix-ai-component-native

> **仓库**：`D:/Projects/triggerix-ai-component-native/`
> **定位**：参考 DOM 渲染器。基于 8 个未样式化的原生元素实现 `@triggerix-ai/component` 协议。

一个独立的单包仓库（不属于任何 workspace）。它交付**原型渲染器**，端到端验证该协议；未来的生产渲染器（Vue、React、atom）将在其它仓库中实现。

### 目录布局

```
triggerix-ai-component-native/
├── src/
│   ├── index.ts                    # 公共再导出 + `components` 数组
│   ├── def.ts                      # NativeComponentDef 抽象类
│   ├── renderer.ts                 # nativeRendererContext + mountNative
│   └── components/
│       ├── index.ts                # 8 个组件的再导出
│       ├── button.ts input.ts card.ts
│       ├── uploadButton.ts label.ts image.ts
│       └── checkbox.ts select.ts
└── tests/                          # 11 个测试文件（vitest + jsdom）
    ├── def.test.ts renderer.test.ts components.test.ts
    └── components/{button,input,card,uploadButton,label,image,checkbox,select}.test.ts
```

### 公共 API

| 导出 | 类型 | 描述 |
|---|---|---|
| `NativeComponentDef` | 抽象类 | 继承 `ComponentDef<HTMLElement>` — 自定义原生组件的基类 |
| `ButtonComponent` … `SelectComponent` | 8 个类 | 每个组件对应一个 |
| `button`、`input`、`card`、`uploadButton`、`label`、`image`、`checkbox`、`select` | 单例对象 | 8 个组件对象，与 `components` 数组中的项共享引用 |
| `components` | `const` 数组 | 按稳定顺序排列的全部 8 个单例 |
| `mountNative(output, container, components, emit)` | 函数 | 对 `@triggerix-ai/component` 中 `mount()` 的轻量包装 |
| `nativeRendererContext` | `RendererContext<HTMLElement, HTMLElement>` | DOM 的 `appendChild`/`removeChild` 适配器 |
| `RendererContext`、`MountEmitFn` | 类型 | 从 `@triggerix-ai/component` 再导出 |

### 8 个组件

| 组件 | `type` | `container` | DOM 标签 | 绑定 | 载荷 |
|---|---|---|---|---|---|
| `button` | `'button'` | `false` | `<button>` | （由开发者绑定） | — |
| `input` | `'input'` | `false` | `<input>` | （由开发者绑定） | `{ value }` |
| `card` | `'card'` | **`true`** | `<div>` | — | 接受子节点；可选 `title` → `<h3>` |
| `uploadButton` | `'uploadButton'` | `false` | `<label>` 包裹 `<input type="file">` | （由开发者绑定） | `{ files, count }` |
| `label` | `'label'` | `false` | `<label>` | — | 支持 `for` → `htmlFor` |
| `image` | `'image'` | `false` | `<img>` | — | 支持 `width`/`height` |
| `checkbox` | `'checkbox'` | `false` | `<label>` 包裹隐藏的 `<input type="checkbox">` | （由开发者绑定） | `{ checked }` |
| `select` | `'select'` | `false` | `<select>` | （由开发者绑定） | `{ value }` |

> **注意**：没有组件预先绑定默认的 DOM 事件。开发者始终在 `setup.ts` 中自行调用 `.bind('click', 'button.click')` 等。`PLAN.md` 原本规划了预绑定默认值；实际交付的代码并未这么做。

### 依赖

- **运行时**：`@triggerix-ai/component`（整个协议层），`@triggerix/core`（已声明但当前在 `src/` 中未使用）
- **开发依赖**：`@antfu/eslint-config`、`esno`、`jsdom`、`typescript`、`unbuild`、`vitest`
- **TS 路径别名**：`@triggerix-ai/component` → `../triggerix-ai/packages/component/dist/index.d.ts`，`@triggerix/core` → `../triggerix/packages/core/dist/index.d.ts`（仅供编辑器支持）

### 值得注意的模式

1. **NativeComponentDef 作为轻量扩展** — `src/def.ts` 是一个一行实现的抽象类，继承自 `ComponentDef<HTMLElement>`。`bind(domEvent, eventId)` API 与 `events` getter 都来自父类。
2. **挂载时通过闭包捕获 source** — 当上游 `mount()` 装配每个组件实例时，会以闭包形式捕获 `instance.name` 作为 `source`，并将 `(eventId, source, payload)` 转发给应用的 `emit` 回调。具体组件永远看不到 `source`。两个按钮都可以触发 `'button.click'`，但其 source 分别为 `'save'`/`'cancel'`，运行时能正确区分。
3. **通过名称映射实现 Scope 隔离** — `Scope.elements: Map<string, HTMLElement>` 由 `instance.name` 构建。形如 `"nickname.value"` 的 `$ref` 字符串通过 `ctx.getValue(ref)` 解析（按 `.` 拆分，读取 `(el as any)[prop]`）。由于每次挂载都拥有独立的 scope，两次挂载完全隔离 — **不使用 DOM id，也不使用 Shadow DOM**。
4. **双重导出（命名 + 数组）** — 8 个命名单例与 `components` 数组共享对象引用，因此 `button.bind(...)` 的修改会立即反映到 `components[0]` 中。

### 注意事项（供 AI 助手参考）

- **`PLAN.md` 仅是愿景** — 描述了一个本地的 `src/runtime/{mount,context,evaluate,execute,resolve}.ts` 层，但从未真正实现；实际实现将所有工作委托给 `@triggerix-ai/component`。
- **Scope 隔离只是"按名称"** — 元素保存在 `Map<name, element>` 中，没有设置 DOM `id`。对同一容器进行两次挂载可能在视觉上重叠；如需严格的 DOM 隔离，消费者应使用不同的容器。
- **`@triggerix/core` 已声明但未使用** — 为未来的 trigger/condition/action 类型预留；可能会被移除，也可能作为面向未来的依赖保留。

### 工具链

`unbuild`（ESM + CJS + dts），Vitest + jsdom，ESLint（`@antfu/eslint-config`），严格 TypeScript。

---

## triggerix-editor-vue

> **仓库**：`D:/Projects/triggerix-editor-vue/`
> **定位**：`@triggerix/editor` 的 Vue 3 绑定层。将框架无关的编辑器包装进 Vue 响应式系统。

单包仓库。刻意保持小巧 — 5 个源文件，13 个测试文件。除 Vue 3 与 `@triggerix/editor` 外没有任何运行时依赖。

### 目录布局

```
triggerix-editor-vue/
├── src/
│   ├── index.ts                          # 总入口
│   ├── types.ts                          # 再导出 Editor、BaseItemDef、Preset + 返回类型接口
│   ├── context.ts                        # provideEditor / injectEditor（Vue InjectionKey）
│   └── composables/
│       ├── useEditor.ts                  # 核心 composable：shallowRef + onChange + onScopeDispose
│       └── useEditorState.ts             # 只读的子组件访问器
└── tests/
    ├── index.test.ts                     # 公共 API 表面锁定
    ├── context.test.ts
    ├── composables/{useEditor,useEditorState}.test.ts
    └── helpers/createMockEditor.ts       # 脱离框架的 mock
```

### 公共 API

```ts
export { useEditor } from './composables/useEditor'
export { useEditorState } from './composables/useEditorState'
export { injectEditor, provideEditor } from './context'
export type { BaseItemDef, Editor, Preset } from './types'
```

### 核心 composable

```ts
function useEditor<TState>(editor: Editor<TState>): {
  editor: Editor<TState>
  state: ShallowRef<TState>
  toTrigger: (id?: string) => ReturnType<Editor<TState>['toTrigger']>
  reset: () => ReturnType<Editor<TState>['reset']>
}
```

生命周期：
1. 通过 `editor.getState()` 同步初始化 `shallowRef<TState>`（不做深度响应式）
2. 仅订阅一次 `editor.onChange`；每次变更时镜像新 state
3. scope 销毁时：取消订阅并调用 `editor.dispose()`
4. 调用 `provideEditor(editor, state)`，使后代无需手动接线即可读取

### 值得注意的模式

1. **单一职责** — 每个文件只关注一件事；没有魔法。
2. **`TState` 泛型从编辑器创建一直流向后代读取** — 在接合点保持类型安全。
3. **结构化测试覆盖** — `index.test.ts` 锁定公共 API 表面；生命周期测试覆盖「卸载后延迟更新」的边界情况。
4. **externals 与 peer/运行时依赖完全一致** — `build.config.ts` 中将 Vue 与 `@triggerix/editor` 标为 external，因此产物体积小，并与上游内部变更解耦。
5. **零三方运行时依赖** — README 明确将其作为卖点。

### 依赖

- **运行时（1 个依赖 + 1 个 peer）**：`@triggerix/editor`、`vue`
- **开发依赖**：`vue`、`@triggerix/core`（测试中的类型导入）、`@vue/test-utils`、`happy-dom`、`vitest`、`@vitest/coverage-v8`、`unbuild`、`typescript`、`@antfu/eslint-config`、`bumpp`、`nano-staged`、`simple-git-hooks`、`eslint`

### 工具链

`unbuild`（ESM + CJS + dts，externals：`vue`、`@triggerix/editor`），Vitest + happy-dom + `@vue/test-utils`，ESLint（`@antfu/eslint-config`）。通过 `simple-git-hooks` + `nano-staged` 在预提交阶段执行 build/test/lint。

---

## triggerix-editor-preset-war3

> **仓库**：`D:/Projects/triggerix-editor-preset-war3/`
> **定位**：受魔兽争霸 III 世界编辑器触发器系统启发的、领域无关、模板驱动的编辑器实现。

尽管冠以「War3」之名，**该包并不包含任何 War3 目录**。它是一个通用预设，允许任意领域（Web 自动化、IoT 规则、游戏脚本等）通过自然语言模板与 `${slot}` 占位符组合 trigger，占位符由带类型的 Tool 填充。

### 目录布局

```
triggerix-editor-preset-war3/
├── src/
│   ├── index.ts                          # 公共再导出
│   ├── createWar3Editor.ts               # 工厂，串联 registry + state + descriptors + serializer
│   ├── preset.ts                         # defineWar3Preset(options)
│   ├── helpers.ts                        # defineLeafTool / defineCompositeTool / defineCondition
│   ├── core/
│   │   ├── types.ts                      # 所有领域类型
│   │   ├── parser.ts                     # parseTemplate → Segment[]
│   │   ├── registry.ts                   # War3Registry extends BaseRegistry（新增 tools）
│   │   └── state.ts                      # War3EditorStateManager extends ObservableState
│   ├── presentation/
│   │   ├── descriptor.ts                 # getEventDescriptor / getActionDescriptor / getConditionDescriptor / getToolDescriptor / getSlotToolDescriptors
│   │   └── display.ts                    # resolveSlotDisplayText（对象值 select 选项使用深相等比较）
│   └── serialization/
│       └── serializer.ts                 # resolveSlotValue（递归）+ toTrigger → 标准 Trigger JSON
└── tests/                                # 9 个 spec 文件，与 src/ 镜像对应
```

### 公共 API（关键导出）

```text
// 工厂与预设
createWar3Editor(): War3Editor
defineWar3Preset(options): Preset<War3Editor>

// Tool 构建器
defineLeafTool<TIn, TOut>(def): LeafToolDef
defineCompositeTool<TSlotValues, TOut>(def): CompositeToolDef
defineCondition<TSlotValues>(def): ConditionDef

// War3Editor 方法（完整接口）
registerEvent / registerAction / registerCondition / registerTool
getRegistry / getAvailableEvents / getAvailableActions / getAvailableConditions
getEventDescriptor / getActionDescriptor(index) / getConditionDescriptor(index) / getToolDescriptor(name, slotValues?)
getSlotTools(slotDef) / getValueSources(valueType?)       // { conditions, tools } 按类型过滤
setEvent / clearEvent / setEventSlot
addAction / removeAction / moveAction / setActionSlot
addCondition / removeCondition / setConditionSlot
applyPreset(preset)
getState / onChange / reset / dispose                     // 来自基类 Editor
toTrigger(triggerId?) / resolveSlotValue(entry)           // 序列化

// 纯辅助函数
parseTemplate(template, slots?, slotValues?): Segment[]
resolveSlotDisplayText(entry, registry, fallbackLabel): string

// 再导出类型：SlotDef、SlotValueEntry、LeafToolDef、CompositeToolDef、ToolDef、
//   War3EventDef、War3ActionDef、War3ConditionDef、Segment、ItemDescriptor、ToolDescriptor、
//   ItemState、War3EditorState、War3PresetOptions + （来自 @triggerix/editor）BaseItemDef、Preset
```

### 核心类型概念

- **Template** — 带有 `${key}` 占位符的字符串，例如 `"Player ${player} says ${message}"`。
- **Slot** — `SlotDef { label, tools: string[] }`，由 event/action/condition/tool 声明。
- **Tool** — slot 的填充器；`LeafTool`（单值的 `text`/`number`/`select`）或 `CompositeTool`（通过自身模板组合其它 tool）。
- **Segment** — `{ type: 'text', content }` 或 `{ type: 'slot', key, label, tools, value, entry }`。
- **SlotValueEntry** — `{ tool, value, subSlots? }` — 递归结构（composite tool 填充 `subSlots`）。
- **Value Source** — 同类型的 `Condition` 与 `Tool` 可通过 `getValueSources(type)` 查询，使某个 slot 能以另一个 slot 的解析值作为输入。

### 数据流

```
开发者定义（模板驱动）
  War3EventDef / War3ActionDef / War3ConditionDef / ToolDef
        │
        └── defineWar3Preset ──▶ Preset
                                       │
            editor.applyPreset(preset) │
                                       ▼
                                  War3Registry（含 Tools）
                                       │
                state 变更            │
   setEvent / addAction / setActionSlot ... │
                                       ▼
                              War3EditorStateManager（ObservableState）
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        ▼                              ▼                              ▼
parseTemplate（→ Segment[]）    resolveSlotDisplayText        toTrigger（→ Trigger JSON）
    ItemDescriptor /            人类可读的                    Action[] / Event / ConditionGroup
    ToolDescriptor              slot 渲染                     （与 @triggerix/core 兼容）
```

### 值得注意的模式

1. **`War3Registry extends BaseRegistry`** — 在 `@triggerix/registry` 的 event/action/condition map 之上增加 `registerTool` / `getTool` / `getTools` / `getValueSources`。
2. **`War3EditorStateManager extends ObservableState`** — 增加模板风格的状态变更方法（`setEvent`、`addAction`、`moveAction`、`setActionSlot` 等），以及私有的 `setItemSlot(field, index, key, entry)` 辅助方法，用于不可变更新。
3. **Condition 内部实现为 `Action[]`，序列化时强制转型为 `ConditionGroup`**。运行时负责语义映射。
4. **`crypto.randomUUID` 带 fallback** — 使用 `crypto.randomUUID()` 生成 ID；若不可用则回退到 `trigger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`。需要 Node 18+ 或现代浏览器。
5. **`resolveSlotDisplayText` 使用深相等比较** — 对于选项为对象（如 `{ value: 'red', label: 'Red' }`）的 `select` slot，通过深相等（而非引用相等）进行匹配；最终回退到 `JSON.stringify`，避免出现 `[object Object]`。

### 依赖

- **运行时**：`@triggerix/core`、`@triggerix/editor`（在 `build.config.ts` 中均为 external）
- **开发依赖**：`@antfu/eslint-config`、`bumpp`、`eslint`、`jiti`、`nano-staged`、`simple-git-hooks`、`typescript`、`unbuild`、`vitest`

### 工具链

`unbuild`（单一入口，`declaration: true`，`clean: true`，externals 与运行时依赖一致）。Vitest + Node 环境。TypeScript 严格模式。ESLint（`@antfu/eslint-config`）。GitHub Actions `changelogithub` + 推送 tag 时执行 `pnpm publish`。

---

## triggerix-collective.github.io

> **仓库**：`D:/Projects/triggerix-collective.github.io/`（私有）
> **定位**：官方展示站点。通过 5 个由浅入深的演示展示「可视化编辑 JSON 描述的 trigger → 运行时执行 ECA 逻辑」。

一个 Vue 3 SPA，通过 `.github/workflows/deploy-pages.yaml` 部署到 GitHub Pages。所有界面文案均为中文（zh-CN）；README 同时提供英文（`README.md`）和中文（`README_CN.md`）。

### 目录布局

```
triggerix-collective.github.io/
├── src/
│   ├── main.ts                          # createApp + router + reset/uno/style 导入
│   ├── App.vue                          # 顶部导航 + RouterView + 可拖拽的 Monaco 抽屉
│   ├── router.ts                        # vue-router/auto-routes + HMR
│   ├── style.css                        # 深色基底重置（#121212）
│   ├── pages/
│   │   ├── index.vue                    # 主页 Hero + 5 个场景卡片
│   │   └── demo/                        # 文件路由，每个场景一个文件
│   │       ├── button-click.vue         # 难度 1：最简单的 ECA
│   │       ├── input-focus.vue          # 难度 2：blur+focus 触发器
│   │       ├── button-modify-input.vue  # 难度 3：带参数的 action，$ref: document.title
│   │       ├── carousel-switch.vue      # 难度 4：一个 event → 多个 action
│   │       └── carousel-linkage.vue     # 难度 5：首个 composite-tool 演示
│   ├── layouts/DemoLayout.vue           # 两栏 Playground | Editor
│   ├── components/
│   │   ├── NavDropdown.vue              # 顶部导航，含 hover 延迟
│   │   ├── DemoToast.vue                # 底部 toast 通知
│   │   ├── playground/                  # PlayButton / PlayInput / PlayCarousel
│   │   └── code-viewer/                 # CodeTabs + CodeViewer（Monaco）
│   ├── composables/                     # useCodePanel / useSyncCodePanel / useDemoRuntime
│   ├── definitions/                     # 每个 demo 的 trigger schema（events/actions/conditions/tools/handlers）
│   │   ├── helpers.ts shared-tools.ts shared-values.ts
│   │   ├── button-click.ts input-focus.ts button-modify-input.ts
│   │   ├── carousel-switch.ts carousel-linkage.ts
│   │   └── code-snippets/               # Monaco 抽屉中展示的只读代码
│   ├── trigger-ui/                      # War3 风格编辑器 UI（每个 demo 都用到）
│   │   ├── index.ts composables/{useTriggerEditor,useModal}.ts
│   │   └── components/{TriggerEditor,TriggerSection,TriggerItem,TriggerTabs,
│   │                    SegmentRenderer,SlotChip,ToolInput,
│   │                    ItemEditorModal,SlotFillModal,Modal}.vue
│   └── assets/hero.png
├── public/{favicon.svg, icons.svg}
├── .auto-generated/typed-router.d.ts    # vue-router 生成的路由类型
├── .vite-hooks/pre-commit               # vp staged 钩子
└── .github/workflows/deploy-pages.yaml  # pnpm install → vp check → vp build → 上传 dist
```

### 6 个路由（基于文件）

| 路径 | 难度 | 展示内容 |
|---|---|---|
| `/` | — | Hero + 5 个场景卡片网格 |
| `/demo/button-click` | 1 | 两个按钮 → 触发 trigger → toast/alert |
| `/demo/input-focus` | 2 | 两个 trigger：`input_focus` → `show_tip`，`input_blur` → `hide_tip` |
| `/demo/button-modify-input` | 3 | 带参数的 action，`$ref: document.title` 实时解析 |
| `/demo/carousel-switch` | 4 | 一个 event → 多个 action（toast + change_bg_color） |
| `/demo/carousel-linkage` | 5 | 首个 composite-tool 演示：`$ref: carousel.<id>.index` 连接左右轮播 |

### 技术栈

- **Vue 3**，SFC 使用 `<script setup lang="ts">`，采用 Composition API
- **vue-router**，通过 `vue-router/auto-routes` 实现基于文件的路由（类型化路由位于 `.auto-generated/typed-router.d.ts`）
- **Vite 通过 `vite-plus`**（`vp dev`/`vp build`/`vp preview`/`vp check`/`vp staged`）— 封装了 Rolldown/Vitest/tsdown/Oxlint/Oxfmt
- **UnoCSS**，使用 `presetWind3`、`presetAttributify`、`presetIcons`（Iconify 来自 `https://esm.sh/`），transformers `directives`/`variantGroup`
- **`@unocss/reset/tailwind.css`** 提供类似 Tailwind 的重置
- **`uno-colors`** 提供自定义调色板（主色 `#4fc3f7`）；自制的深色主题 token（`surface-base`、`surface-subtle`、`border-subtle`、`text-soft`、`focus-ring-primary` 等）
- **`modern-monaco`** 用于底部代码抽屉 — 直接使用 `monaco.editor.createModel`，避免 `workspace.openTextDocument` 自释放竞态（详见 `.qoder/plans/monaco-nav-stuck-on-json.md`）
- **`@vueuse/core`** 提供 `useLocalStorage`（抽屉高度）与 `onClickOutside`
- **Google 字体**：Cinzel（展示字体）+ JetBrains Mono（代码字体），通过 `index.html` 预先连接

### Triggerix 依赖（正在被演示的库）

通过 `pnpm-workspace.yaml` 中的 `catalog:`：
- `@triggerix/runtime` — `createRuntime`、`registerEvent`、`registerAction`、`addTrigger`、`emit`
- `triggerix-editor-preset-war3` — `War3Editor`、`createWar3Editor`、`defineEvent/Action/Condition/LeafTool/CompositeTool`、`resolveSlotDisplayText`
- `triggerix-editor-vue` — `useEditor` composable

这三个包共同支撑所有 demo。`@triggerix/core`、`@triggerix/editor`、`@triggerix/registry` 被列入 `minimumReleaseAgeExclude`，以允许使用刚刚发布的「next」构建。

### 它如何演示 Triggerix

1. **定义阶段** — `src/definitions/*.ts` 描述每个 demo 的 events/actions/conditions、tools（leaf 与 composite）、带有 `${slot}` 占位符的模板，以及 handler 签名。
2. **编辑阶段** — `trigger-ui/` 提供 War3 风格编辑器（`TriggerEditor.vue` = `TriggerSection` × 3 + 多个 modal + slot chip）。点击 slot 打开 `SlotFillModal`，用户在其中选择 tool 并通过 `ToolInput.vue` 填写值。Composite tool（如 `carousel_index_ref`）会暴露嵌套的 sub-slot。
3. **同步阶段** — `useDemoRuntime` 为每个 trigger 创建一个 `War3Editor`，通过 `useEditor` 挂载，将事件与 action handler 注册到共享的 `createRuntime()` 上，并监听每个 editor 的 state 以重新调用 `runtime.addTrigger`。它会自动注入 `payload.source === <id>` 条件，使同一事件类型的多个 trigger 可以共存而不会错误匹配。
4. **执行阶段** — Playground 组件（`PlayButton`/`PlayInput`/`PlayCarousel`）发出诸如 `button_click`、`input_focus`、`carousel_change` 等事件，并附带 `{ source, value?, index? }`。运行时匹配并派发 handler（`show_message`、`set_input_value`、`change_bg_color`、`show_tip`、`hide_tip`、`set_carousel_index`），它们更新 demo 局部状态并弹出 toast。

底部的 Monaco 抽屉（可拖拽，高度持久化在 `localStorage`）展示源码文件（`setup.ts`、`handlers.ts`、各 Demo 对应文件）以及每个 trigger 的实时 JSON 输出，让开发者看到可视化编辑后的精确序列化结果。

### 构建 / 部署

`.github/workflows/deploy-pages.yaml`，在 push 到 `main` 时触发：
1. pnpm 设置 → Node LTS
2. `pnpm install --frozen-lockfile`
3. `pnpm run prepare`（生成 `.auto-generated/typed-router.d.ts`）
4. `pnpm run lint`（`vp check`）
5. `pnpm run build`（`vp build`）
6. 拷贝 `dist/index.html` → `dist/404.html`（SPA fallback）
7. 上传 `dist` 产物 → `actions/deploy-pages@v4`

本地：`pnpm dev` / `pnpm build` / `pnpm preview` / `pnpm lint`。预提交：`vp staged`。

### 值得注意的观察

- **不进行版本发布** — 私有。它本质上是 triggerix monorepo 的官方文档与展示。
- **只直接使用 3 个 triggerix 包**：`@triggerix/runtime`、`triggerix-editor-preset-war3`、`triggerix-editor-vue`。
- **未接入测试** — 没有 `vitest` 配置；scripts 中也没有 `vp test`。
- **没有后端** — 所有示例都在客户端；`set_input_value` 使用形如 `document.title`、`window.innerWidth`、`location.href` 的 `$ref`，由 `resolveRefPath` 在运行时解析。
- **自动生成路由** — 在 `src/pages/` 下新增文件并在 `pnpm run prepare` 之后，会自动生成新路由与 typed-router 声明。

---

[← 返回 README](./README.md) · [中文版 →](./README_CN.md) · [类库 →](./libraries.md)