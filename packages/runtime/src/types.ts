import type { Event, Value } from '@triggerix/core'
import type { RefResolver } from './utils'

/**
 * Event handler function type
 */
export type EventHandler = (payload?: Record<string, unknown>) => void

/**
 * Action handler function type
 *
 * The `params` received here are the **resolved** action parameters — every
 * `{ $ref: '...' }` has been replaced with the value returned by the
 * `refResolver` supplied to `createRuntime`. Handlers therefore work with
 * plain values and never need to know about the `$ref` syntax.
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
 *
 * `source` is the component instance name that triggered the event. It is
 * placed at the top level so Triggerix conditions can reference it directly
 * via `$ref: 'source'` or `$ref: 'event.source'` (both work).
 */
export interface RuntimeContext {
  event: Event
  source?: string
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

  /**
   * Resolver for `$ref` references inside action parameters, conditions and
   * expressions. When supplied, every `{ $ref: 'name.path' }` encountered
   * during execution is replaced with `resolver('name.path')` before reaching
   * the action handler.
   *
   * If omitted, `$ref` is left untouched (legacy behaviour).
   *
   * Concrete renderers provide an implementation that knows how to look up
   * the referenced value (e.g. read `.value` from a DOM input element by
   * component instance name).
   */
  refResolver?: RefResolver
}
