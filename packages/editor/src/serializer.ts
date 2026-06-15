import type { Registry } from './registry'
import type { EditorState, ItemState, SlotValueEntry } from './state'
import type { CompositeToolDef } from './types'

/**
 * Resolve a single slot value through its tool's resolve function
 */
export function resolveSlotValue(
  entry: SlotValueEntry,
  registry: Registry
): unknown {
  if (!entry.tool)
    return null

  const toolDef = registry.getTool(entry.tool)
  if (!toolDef)
    return null

  if (toolDef.type === 'leaf') {
    return toolDef.resolve(entry.value)
  }

  // Composite tool: recursively resolve sub-slots first
  const resolvedSubSlots: Record<string, unknown> = {}

  if (entry.subSlots) {
    for (const [key, subEntry] of Object.entries(entry.subSlots)) {
      resolvedSubSlots[key] = resolveSlotValue(subEntry, registry)
    }
  }

  return (toolDef as CompositeToolDef).resolve(resolvedSubSlots)
}

/**
 * Resolve all slot values in an item state to a params object
 */
function resolveItemParams(
  item: ItemState,
  registry: Registry
): Record<string, unknown> {
  const params: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(item.slotValues)) {
    params[key] = resolveSlotValue(entry, registry)
  }

  return params
}

/**
 * Serialize the full editor state to a Triggerix Rule JSON.
 * Returns null if the state is incomplete (no event selected).
 */
export function toRule(
  state: EditorState,
  registry: Registry,
  ruleId?: string
): Record<string, unknown> | null {
  if (!state.event)
    return null

  const rule: Record<string, unknown> = {
    id: ruleId ?? generateId(),
    event: {
      type: state.event.type,
      ...(Object.keys(state.event.slotValues).length > 0 && {
        params: resolveItemParams(state.event, registry)
      })
    }
  }

  // Conditions
  if (state.conditions.length > 0) {
    const conditions = state.conditions.map(cond => ({
      ...resolveItemParams(cond, registry)
    }))

    rule.conditions = { type: 'and', conditions }
  }

  // Actions
  if (state.actions.length > 0) {
    rule.actions = state.actions.map(action => ({
      type: action.type,
      ...(Object.keys(action.slotValues).length > 0 && {
        params: resolveItemParams(action, registry)
      })
    }))
  }
  else {
    rule.actions = []
  }

  return rule
}

function generateId(): string {
  return `rule-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
