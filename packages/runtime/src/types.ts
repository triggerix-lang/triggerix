import type { Event, Value } from '@triggerix/core'

/**
 * Event handler function type
 */
export type EventHandler = (payload?: Record<string, unknown>) => void

/**
 * Action handler function type
 */
export type ActionHandler = (params?: Record<string, Value>) => void | Promise<void>

/**
 * Event definition for registry
 */
export interface EventDefinition {
  type: string
}

/**
 * Action definition for registry
 */
export interface ActionDefinition {
  type: string
  handler: ActionHandler
}

/**
 * Runtime context - holds current state for condition evaluation
 */
export interface RuntimeContext {
  event: Event
  payload?: Record<string, unknown>
  [key: string]: unknown
}

/**
 * Runtime options
 */
export interface RuntimeOptions {
  /**
   * Whether to continue executing actions if one fails
   * @default false
   */
  continueOnError?: boolean
}
