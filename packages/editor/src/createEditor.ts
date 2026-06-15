import type { ItemDescriptor, ToolDescriptor } from './descriptor'
import type { ChangeListener, EditorState, SlotValueEntry } from './state'
import type { ActionDef, ConditionDef, EventDef, SlotDef, ToolDef } from './types'
import {
  getActionDescriptor,
  getConditionDescriptor,
  getEventDescriptor,
  getSlotToolDescriptors,
  getToolDescriptor
} from './descriptor'
import { Registry } from './registry'
import { resolveSlotValue, toRule } from './serializer'
import { EditorStateManager } from './state'

export interface TriggerixEditor {
  // Registry
  registerEvent: (def: EventDef) => void
  registerAction: (def: ActionDef) => void
  registerCondition: (def: ConditionDef) => void
  registerTool: (name: string, def: ToolDef) => void

  // Query registry
  getAvailableEvents: () => EventDef[]
  getAvailableActions: () => ActionDef[]
  getAvailableConditions: () => ConditionDef[]

  // Descriptors (for UI rendering)
  getEventDescriptor: (slotValues?: Record<string, unknown>) => ItemDescriptor | undefined
  getActionDescriptor: (actionIndex: number) => ItemDescriptor | undefined
  getConditionDescriptor: (conditionIndex: number) => ItemDescriptor | undefined
  getToolDescriptor: (toolName: string, slotValues?: Record<string, unknown>) => ToolDescriptor | undefined
  getSlotTools: (slotDef: SlotDef) => ToolDescriptor[]

  // State mutations
  setEvent: (type: string) => void
  clearEvent: () => void
  setEventSlot: (key: string, entry: SlotValueEntry) => void
  addAction: (type: string) => void
  removeAction: (index: number) => void
  moveAction: (from: number, to: number) => void
  setActionSlot: (actionIndex: number, key: string, entry: SlotValueEntry) => void
  addCondition: (type: string) => void
  removeCondition: (index: number) => void
  setConditionSlot: (conditionIndex: number, key: string, entry: SlotValueEntry) => void
  reset: () => void

  // State reading
  getState: () => EditorState

  // Subscriptions
  onChange: (listener: ChangeListener) => () => void

  // Serialization
  toRule: (ruleId?: string) => Record<string, unknown> | null
  resolveSlotValue: (entry: SlotValueEntry) => unknown
}

/**
 * Create a Triggerix headless editor instance
 */
export function createEditor(): TriggerixEditor {
  const registry = new Registry()
  const state = new EditorStateManager()

  /**
   * Helper: convert SlotValueEntry map to plain value map for descriptor rendering
   */
  function toPlainValues(slotValues: Record<string, SlotValueEntry>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(slotValues)) {
      result[key] = entry.value
    }
    return result
  }

  return {
    // Registry
    registerEvent: def => registry.registerEvent(def),
    registerAction: def => registry.registerAction(def),
    registerCondition: def => registry.registerCondition(def),
    registerTool: (name, def) => registry.registerTool(name, def),

    // Query
    getAvailableEvents: () => registry.getEvents(),
    getAvailableActions: () => registry.getActions(),
    getAvailableConditions: () => registry.getConditions(),

    // Descriptors
    getEventDescriptor(slotValues) {
      const current = state.getState().event
      if (!current)
        return undefined
      const values = slotValues ?? toPlainValues(current.slotValues)
      return getEventDescriptor(registry, current.type, values)
    },

    getActionDescriptor(actionIndex) {
      const action = state.getState().actions[actionIndex]
      if (!action)
        return undefined
      return getActionDescriptor(registry, action.type, toPlainValues(action.slotValues))
    },

    getConditionDescriptor(conditionIndex) {
      const condition = state.getState().conditions[conditionIndex]
      if (!condition)
        return undefined
      return getConditionDescriptor(registry, condition.type, toPlainValues(condition.slotValues))
    },

    getToolDescriptor(toolName, slotValues = {}) {
      return getToolDescriptor(registry, toolName, slotValues)
    },

    getSlotTools(slotDef) {
      return getSlotToolDescriptors(registry, slotDef)
    },

    // State mutations
    setEvent: type => state.setEvent(type),
    clearEvent: () => state.clearEvent(),
    setEventSlot: (key, entry) => state.setEventSlot(key, entry),
    addAction: type => state.addAction(type),
    removeAction: index => state.removeAction(index),
    moveAction: (from, to) => state.moveAction(from, to),
    setActionSlot: (actionIndex, key, entry) => state.setActionSlot(actionIndex, key, entry),
    addCondition: type => state.addCondition(type),
    removeCondition: index => state.removeCondition(index),
    setConditionSlot: (conditionIndex, key, entry) => state.setConditionSlot(conditionIndex, key, entry),
    reset: () => state.reset(),

    // Reading
    getState: () => state.getState(),

    // Subscriptions
    onChange: listener => state.onChange(listener),

    // Serialization
    toRule: ruleId => toRule(state.getState(), registry, ruleId),
    resolveSlotValue: entry => resolveSlotValue(entry, registry)
  }
}
