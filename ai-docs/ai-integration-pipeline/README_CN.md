# AI 集成管线：端到端流程

本文档描述从开发者注册原子单元到用户交互的完整管线。

## 涉及的库

| 库 | 角色 | 仓库 |
|---|---|---|
| `@triggerix-ai/registry` | 注册事件/动作（带 AI 元数据） | triggerix-ai monorepo |
| `@triggerix-ai/component` | 组件协议层（AI 元数据 + 渲染器抽象 + 控件目录） | triggerix-ai monorepo |
| `@triggerix-ai/schema` | 生成约束 JSON Schema | triggerix-ai monorepo |
| `@triggerix-ai/prompt` | 生成系统提示词 | triggerix-ai monorepo |
| `@triggerix-ai/fn` | 一键生成 Function Calling 定义 | triggerix-ai monorepo |
| `triggerix-ai-component-native` | 原生 DOM 渲染器（无样式 Demo） | 独立仓库 |

---

## Phase 1：导入组件 + 配置事件映射

`triggerix-ai-component-native` 内部已定义好所有原生控件，库导出预建的组件对象。开发者只需配置事件映射：

```typescript
import { button, card, input, uploadButton } from 'triggerix-ai-component-native'

// 开发者配置：DOM 事件 → Triggerix 事件 ID
button.bind('click', 'button.click')
input.bind('blur', 'input.blur')
input.bind('change', 'input.change')
uploadButton.bind('change', 'upload.complete')
```

**关键设计**：
- 库本身只负责“怎么渲染”，不硬编码 Triggerix 事件 ID
- 开发者通过 `bind(domEvent, triggerixEventId)` 显式建立 DOM 事件与 Triggerix 事件的桥接
- 组件内部创建元素时，循环 bind 配置自动绑定 event listener

### 组件内部实现（库作者写好的，开发者无需关心）

```typescript
// triggerix-ai-component-native 内部
class NativeButton extends BaseNativeComponent {
  protected createElement(props: Record<string, unknown>): HTMLElement {
    const el = document.createElement('button')
    el.textContent = props.label as string
    return el
  }
}

// BaseNativeComponent 基类（继承自 @triggerix-ai/component 的 BaseRenderer 抽象）
abstract class BaseNativeComponent {
  private eventMappings = new Map<string, string>()

  bind(domEvent: string, triggerixEventId: string): this {
    this.eventMappings.set(domEvent, triggerixEventId)
    return this
  }

  // UI 注册表可读取已绑定的事件列表
  get events(): string[] {
    return [...this.eventMappings.values()]
  }

  // 内部：创建 DOM 元素 + 自动绑定事件
  create(props: Record<string, unknown>, emit: EmitFn): HTMLElement {
    const el = this.createElement(props)
    for (const [domEvent, triggerixEvent] of this.eventMappings) {
      el.addEventListener(domEvent, () => emit(triggerixEvent))
    }
    return el
  }

  protected abstract createElement(props: Record<string, unknown>): HTMLElement
}
```

---

## Phase 2：注册到组件目录（@triggerix-ai/component）

`component.use(components)` 自动从组件对象中提取 AI 元数据（包括 bind 配置的 events 列表）：

```typescript
import { createComponentRegistry } from '@triggerix-ai/component'
import { button, card, input, uploadButton } from 'triggerix-ai-component-native'

const component = createComponentRegistry()

// 一行注册：自动提取 type, label, description, props, events
component.use([button, input, card, uploadButton])

// component.use 内部实现：
// for (const comp of components) {
//   this.registerComponent({
//     type: comp.type,
//     label: comp.label,
//     description: comp.description,
//     props: comp.props,
//     container: comp.container,
//     events: comp.events  // ← 从 bind 配置中自动读取
//   })
// }
```

**两库协作关系**：

```
triggerix-ai-component-native              @triggerix-ai/component
┌────────────────────────┐    ┌────────────────────────┐
│ button (NativeButton)      │    │ ComponentRegistry         │
│   .type = 'button'        │    │                          │
│   .label = 'Button'       │───▶│ .use([button, input...])  │
│   .description = '...'    │    │   → 提取 AI 元数据         │
│   .props = { label: ... } │    │   → 提取 events 列表      │
│   .bind('click', '...')   │    │                          │
│   .events → ['button.click']│    │ → AI 知道控件能力       │
└────────────────────────┘    └────────────────────────┘
```

**核心理念**：AI 是组装者——从控件目录中自由选取和组合，没有预定义布局。

---

## Phase 3：注册事件和动作（@triggerix-ai/registry）

告诉 AI “触发器里能用什么事件和动作”：

```typescript
import { createAIRegistry, defineAIAction, defineAIEvent } from '@triggerix-ai/registry'

const registry = createAIRegistry()

registry.registerEvent(defineAIEvent({
  id: 'button.click',
  label: 'Button Click',
  description: 'Triggered when a button is clicked'
}))

registry.registerEvent(defineAIEvent({
  id: 'input.blur',
  label: 'Input Blur',
  description: 'Triggered when an input loses focus'
}))

registry.registerAction(defineAIAction({
  id: 'api.request',
  label: 'API Request',
  description: 'Send an HTTP request',
  params: {
    method: { type: 'string', enum: ['GET', 'POST', 'PUT'] },
    url: { type: 'string', description: 'API endpoint' },
    body: { type: 'object', description: 'Request body' }
  }
}))

registry.registerAction(defineAIAction({
  id: 'toast.show',
  label: 'Show Toast',
  description: 'Display a notification message',
  params: { message: { type: 'string' } }
}))
```

---

## Phase 4：一键生成 Function Calling 定义（@triggerix-ai/fn）

```typescript
import { defineFunctionCalling } from '@triggerix-ai/fn'

const { systemPrompt, tools } = defineFunctionCalling({ registry, component })
```

内部自动完成：
1. 合并基础提示词 + 已注册事件/动作描述 + 控件目录
2. 生成约束 Schema（event.type 枚举、action.type 枚举、控件类型枚举）
3. 输出 tools 定义（兼容 OpenAI/Anthropic Function Calling 格式）

---

## Phase 5：用户输入 → AI 生成输出

```typescript
const response = await ai.chat({
  system: systemPrompt,
  tools,
  messages: [{ role: 'user', content: '我要修改昵称' }]
})
```

AI 根据用户意图自主组装，输出：

```json
{
  "components": [
    { "type": "input", "name": "nickname", "props": { "placeholder": "请输入昵称" } },
    { "type": "button", "name": "save", "props": { "label": "保存" } }
  ],
  "triggers": [
    {
      "event": { "type": "input.blur", "source": "nickname" },
      "conditions": {
        "type": "and",
        "conditions": [
          { "left": { "$ref": "nickname.value" }, "operator": "eq", "right": "" }
        ]
      },
      "actions": [{ "type": "toast.show", "params": { "message": "昵称不能为空" } }]
    },
    {
      "event": { "type": "button.click", "source": "save" },
      "conditions": {
        "type": "and",
        "conditions": [
          { "left": { "$ref": "nickname.value" }, "operator": "neq", "right": "" }
        ]
      },
      "actions": [{ "type": "api.request", "params": { "method": "POST", "url": "/api/nickname", "body": { "nickname": { "$ref": "nickname.value" } } } }]
    }
  ]
}
```

**注意**：`name` 是语义化的局部名称（如 `"nickname"`、`"save"`），不是随机 ID。AI 只需保证同一轮输出内不重名。

---

## Phase 6：渲染器挂载 + 事件绑定（triggerix-ai-component-native）

```typescript
import { button, card, createNativeRenderer, input, uploadButton } from 'triggerix-ai-component-native'

const renderer = createNativeRenderer({
  components: [button, input, card, uploadButton],
  actions: {
    'api.request': async (params) => {
      await fetch(params.url, { method: params.method, body: JSON.stringify(params.body) })
    },
    'toast.show': (params) => {
      alert(params.message)
    }
  }
})

// 每轮 AI 输出调用 mount，创建隔离作用域
const scope = renderer.mount(aiOutput, document.getElementById('chat'))

// 不再需要时卸载
scope.unmount()
```

### mount 内部实现

```typescript
// renderer.mount 内部实现
function mount(output, container) {
  const elements = new Map<string, HTMLElement>()

  // 1. 创建所有控件（组件通过 bind 配置自动绑定 DOM 事件，通过 emit 上报）
  for (const instance of output.components) {
    const component = this.components.get(instance.type)
    const el = component.create(instance.props, (eventType, payload) => {
      // 2. 组件 emit → 匹配触发器并执行
      const matchedTriggers = output.triggers.filter(
        t => t.event.type === eventType && t.event.source === instance.name
      )
      for (const trigger of matchedTriggers) {
        const context = buildContext(elements)
        if (evaluateConditions(trigger.conditions, context)) {
          executeActions(trigger.actions, context)
        }
      }
    })
    if (instance.name)
      elements.set(instance.name, el)
    container.appendChild(el)
  }

  return { unmount() { /* 清理 DOM + 解除引用 */ } }
}
```

---

## 作用域隔离机制

### 隔离在 JS 层面，不在 DOM 层面

- 每次 `mount()` 创建一个独立的 `Map<name, element>`
- 事件监听直接绑定在元素引用上（不经过 DOM 查询）
- `$ref` 解析只从当前 scope 的 Map 中查找
- DOM 元素不需要 `id` 属性，不需要 Shadow DOM

### 页面上实际的结构

```html
<div id="chat">
  <!-- Scope 1 -->
  <div>
    <input type="text" placeholder="请输入昵称">   <!-- 没有 id 属性 -->
    <button>保存</button>                           <!-- 没有 id 属性 -->
  </div>

  <!-- Scope 2 -->
  <div>
    <img src="">
    <button>上传</button>                           <!-- 同名也不干扰 -->
  </div>
</div>
```

### 为什么不需要随机 ID

| 传统 ID 方案 | 作用域隔离方案 |
|---|---|
| 靠全局唯一 ID 区分元素 | 靠 scope 实例区分元素 |
| AI 需保证 ID 不与其他轮冲突 | AI 只需保证轮内不重名 |
| 查找方式：`getElementById(id)` | 查找方式：`elements.get(name)` |
| 需要随机后缀防碰撞 | 不需要，Map 本身就是隔离的 |
| 输出难读：`"save-x3k9"` | 输出可读：`"save"` |

### 隔离示意

```
mount(output1) → scope1 { elements: Map { "nickname" → <input>, "save" → <button> } }
mount(output2) → scope2 { elements: Map { "avatar" → <img>, "upload" → <button> } }

scope1 的 "save" 按钮点击 → 只触发 scope1 的触发器
scope2 的 "upload" 按钮点击 → 只触发 scope2 的触发器
```

---

## 完整时序图

```
用户输入"我要修改昵称"
       ↓
AI 生成 { components: [...], triggers: [...] }
       ↓
renderer.mount(aiOutput, container)
       ↓
创建 scope（局部 Map）
       ↓
遍历 ui[]，调用组件的 create(props, emit)
       ↓
create 内部：创建 DOM 元素 + 循环 bind 配置绑定 addEventListener + 存入 Map
       ↓
用户点击"保存"按钮
       ↓
DOM click 触发 → emit('button.click')（来自 bind('click', 'button.click') 配置）
       ↓
渲染器匹配触发器：event.type === 'button.click' && event.source === 'save'
       ↓
解析 $ref：从 scope Map 中取 elements.get("nickname").value
       ↓
检查 conditions：nickname.value !== ""
       ↓
执行 actions：调用开发者注册的 api.request handler
       ↓
fetch("/api/nickname", { method: "POST", body: { nickname: "张三" } })
```

---

## 三层架构定位

```
组件框架（骨骼）  ←→  Triggerix（肌肉）  ←→  Shinix（皮肤）
   UI 结构              交互行为              视觉样式
      ↑                       ↑                     ↑
@triggerix-ai/component   @triggerix-ai/registry     (未来 shinix-ai)
      ↑
triggerix-ai-component-native（原生渲染器 Demo）
未来 atom component（生产渲染器，同时对接 UI + Shinix）
```

- `@triggerix-ai/component`：协议层——定义控件目录、AI 元数据接口、渲染器抽象基类（BaseRenderer）
- `triggerix-ai-component-native`：实现层——继承 BaseRenderer，把协议变成真实 DOM，无样式，仅验证协议可行性
- 未来 atom component：生产实现层——同时对接 Triggerix 交互 + Shinix 样式

### 依赖方向

```
triggerix-ai-component-native  ──depends on──▶  @triggerix-ai/component
       （实现）                                  （抽象）

- @triggerix-ai/component 提供：BaseRenderer、AIComponentDef、ComponentDef<T>、EmitFn、Scope
- triggerix-ai-component-native 提供：NativeRenderer extends BaseRenderer<HTMLElement>、预定义组件对象
- 未来 React 渲染器：ReactRenderer extends BaseRenderer<ReactElement>
```
