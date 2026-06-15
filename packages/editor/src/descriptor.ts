import type { Registry } from './registry'
import type { LeafToolDef, Segment, SlotDef } from './types'
import { parseTemplate } from './parser'

/**
 * Descriptor for an event/action/condition
 */
export interface ItemDescriptor {
  type: string
  segments: Segment[]
}

/**
 * Descriptor for a leaf tool
 */
export interface LeafToolDescriptor {
  name: string
  label: string
  type: 'leaf'
  input: LeafToolDef['input']
}

/**
 * Descriptor for a composite tool
 */
export interface CompositeToolDescriptor {
  name: string
  label: string
  type: 'composite'
  segments: Segment[]
}

/**
 * Tool descriptor (returned to UI layer)
 */
export type ToolDescriptor = LeafToolDescriptor | CompositeToolDescriptor

/**
 * Get the rendered descriptor for an event
 */
export function getEventDescriptor(
  registry: Registry,
  type: string,
  slotValues: Record<string, unknown> = {}
): ItemDescriptor | undefined {
  const def = registry.getEvent(type)
  if (!def)
    return undefined

  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots ?? {}, slotValues)
  }
}

/**
 * Get the rendered descriptor for an action
 */
export function getActionDescriptor(
  registry: Registry,
  type: string,
  slotValues: Record<string, unknown> = {}
): ItemDescriptor | undefined {
  const def = registry.getAction(type)
  if (!def)
    return undefined

  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots ?? {}, slotValues)
  }
}

/**
 * Get the rendered descriptor for a condition
 */
export function getConditionDescriptor(
  registry: Registry,
  type: string,
  slotValues: Record<string, unknown> = {}
): ItemDescriptor | undefined {
  const def = registry.getCondition(type)
  if (!def)
    return undefined

  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

/**
 * Get the descriptor for a tool (for rendering the tool's UI)
 */
export function getToolDescriptor(
  registry: Registry,
  toolName: string,
  slotValues: Record<string, unknown> = {}
): ToolDescriptor | undefined {
  const def = registry.getTool(toolName)
  if (!def)
    return undefined

  if (def.type === 'leaf') {
    return {
      name: toolName,
      label: def.label,
      type: 'leaf',
      input: def.input
    }
  }

  // composite tool
  return {
    name: toolName,
    label: def.label,
    type: 'composite',
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

/**
 * Get available tools for a slot (with their descriptors)
 */
export function getSlotToolDescriptors(
  registry: Registry,
  slotDef: SlotDef
): ToolDescriptor[] {
  const descriptors: ToolDescriptor[] = []

  for (const toolName of slotDef.tools) {
    const desc = getToolDescriptor(registry, toolName)
    if (desc)
      descriptors.push(desc)
  }

  return descriptors
}
