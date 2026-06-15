/**
 * Leaf tool input configuration
 */
export interface LeafToolInputText {
  type: 'text'
  placeholder?: string
}

export interface LeafToolInputNumber {
  type: 'number'
  placeholder?: string
  min?: number
  max?: number
}

export interface LeafToolInputSelect {
  type: 'select'
  options: SelectOption[] | ((context: SlotContext) => SelectOption[])
}

export type LeafToolInput = LeafToolInputText | LeafToolInputNumber | LeafToolInputSelect

export interface SelectOption {
  value: unknown
  label: string
}

/**
 * Slot context - passed to dynamic option providers
 */
export interface SlotContext {
  /** Values of sibling slots in the same level */
  slots: Record<string, unknown>
}

/**
 * Leaf tool - terminal input, produces a value directly
 */
export interface LeafToolDef {
  label: string
  type: 'leaf'
  input: LeafToolInput
  resolve: (input: unknown) => unknown
}

/**
 * Composite tool - has its own template with sub-slots (recursive)
 */
export interface CompositeToolDef {
  label: string
  type: 'composite'
  template: string
  slots: Record<string, SlotDef>
  resolve: (slotValues: Record<string, unknown>) => unknown
}

/**
 * Tool definition - either leaf or composite
 */
export type ToolDef = LeafToolDef | CompositeToolDef

/**
 * Slot definition - a fillable parameter with one or more available tools
 */
export interface SlotDef {
  label: string
  tools: string[]
}

/**
 * Event definition - an event type with its display template
 */
export interface EventDef {
  type: string
  template: string
  slots?: Record<string, SlotDef>
}

/**
 * Action definition - an action type with its display template
 */
export interface ActionDef {
  type: string
  template: string
  slots?: Record<string, SlotDef>
}

/**
 * Condition definition - a condition template
 */
export interface ConditionDef {
  type: string
  template: string
  slots: Record<string, SlotDef>
}

/**
 * Text segment - static text in a rendered descriptor
 */
export interface TextSegment {
  type: 'text'
  content: string
}

/**
 * Slot segment - an interactive slot in a rendered descriptor
 */
export interface SlotSegment {
  type: 'slot'
  key: string
  label: string
  tools: string[]
  value: unknown | null
}

/**
 * A segment is either static text or an interactive slot
 */
export type Segment = TextSegment | SlotSegment
