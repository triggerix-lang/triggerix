# Triggerix

A language-agnostic, TypeScript-first trigger engine based on the **ECA (Event-Condition-Action)** model.

Triggerix lets you define triggers as data, validate them against a schema, edit them visually, and execute them at runtime — all from a single, cohesive monorepo.

## Packages

This repository is a [pnpm workspace](https://pnpm.io/workspaces) containing the following packages:

| Package | Description |
| --- | --- |
| [`@triggerix/core`](./packages/core) | Core type definitions shared across all packages. |
| [`@triggerix/schema`](./packages/schema) | Schema builder for authoring ECA triggers in code. |
| [`@triggerix/json-schema`](./packages/json-schema) | JSON Schema generator for trigger definitions. |
| [`@triggerix/validator`](./packages/validator) | Trigger validator that checks triggers against the schema. |
| [`@triggerix/runtime`](./packages/runtime) | Reference runtime implementation that executes triggers. |
| [`@triggerix/registry`](./packages/registry) | Type-safe registry for event/action/condition definitions. |
| [`@triggerix/editor`](./packages/editor) | Headless editor core with a descriptor-based slot/tool system. |
| [`triggerix`](./packages/triggerix) | The all-in-one aggregate package re-exporting the suite. |

## Installation

```bash
# Install the all-in-one package
npm install triggerix

# Or install individual packages as needed
npm install @triggerix/core @triggerix/schema @triggerix/runtime
```

## Usage

```ts
import { createRuntime, defineTrigger } from 'triggerix'

const trigger = defineTrigger({
  id: 'on-button-click',
  event: { type: 'button.click', source: 'confirm_btn' },
  actions: [{ type: 'log', params: { msg: 'clicked!' } }]
})

const runtime = createRuntime()
runtime.registerEvent('button.click')
runtime.registerAction('log', params => console.log(params.msg))
runtime.addTrigger(trigger)

await runtime.emit('button.click', { source: 'confirm_btn' })
```

See each package's README for detailed API documentation.

## Development

```bash
pnpm install        # install dependencies
pnpm stub           # set up dev stubs across packages
pnpm build          # build all packages
pnpm lint           # lint the workspace
pnpm update-readme  # sync this README into every package
```

## License

[MIT](./LICENSE)
