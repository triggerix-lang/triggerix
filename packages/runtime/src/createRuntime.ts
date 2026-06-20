import type { Trigger } from '@triggerix/core'
import type { FunctionRegistry } from './expressionEvaluator'
import type { ActionHandler, RuntimeContext, RuntimeOptions } from './types'
import { ActionRegistry } from './actionRegistry'
import { evaluateConditions } from './conditionEvaluator'
import { EventRegistry } from './eventRegistry'
import { executeActionNode } from './flowExecutor'

/**
 * Triggerix Runtime instance
 */
export interface TriggerixRuntime {
  /**
   * Register an event type
   */
  registerEvent: (type: string) => void

  /**
   * Register an action type with its handler
   */
  registerAction: (type: string, handler: ActionHandler) => void

  /**
   * Add a trigger to the runtime
   */
  addTrigger: (trigger: Trigger) => void

  /**
   * Remove a trigger by id
   */
  removeTrigger: (id: string) => void

  /**
   * Emit an event - runs all matching triggers.
   *
   * Matching uses OR semantics across `trigger.events`:
   * - `type`: the event type id (e.g. 'button.click').
   * - `source`: per-event `source` is checked individually.
   *   - An event with `source` unset matches any source (including `undefined`).
   *   - An event with `source` set must equal the incoming `source` exactly.
   * - `payload`: arbitrary event payload merged into the runtime context.
   */
  emit: (type: string, source?: string, payload?: Record<string, unknown>) => Promise<void>

  /**
   * Get all registered event types
   */
  listEvents: () => string[]

  /**
   * Get all registered action types
   */
  listActions: () => string[]

  /**
   * Register a custom function for expression evaluation
   */
  registerFunction: (name: string, fn: (...args: unknown[]) => unknown) => void

  /**
   * Get all added triggers
   */
  listTriggers: () => Trigger[]
}

/**
 * Create a new Triggerix runtime instance
 */
export function createRuntime(options: RuntimeOptions = {}): TriggerixRuntime {
  const eventRegistry = new EventRegistry()
  const actionRegistry = new ActionRegistry()
  const triggers: Trigger[] = []
  const functions: FunctionRegistry = new Map()

  const { continueOnError = false, refResolver } = options

  function registerEvent(type: string): void {
    eventRegistry.register({ type })
  }

  function registerAction(type: string, handler: ActionHandler): void {
    actionRegistry.register({ type, handler })
  }

  function registerFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    functions.set(name, fn)
  }

  function addTrigger(trigger: Trigger): void {
    triggers.push(trigger)
  }

  function removeTrigger(id: string): void {
    const index = triggers.findIndex(t => t.id === id)
    if (index !== -1) {
      triggers.splice(index, 1)
    }
  }

  async function emit(
    type: string,
    source?: string,
    payload?: Record<string, unknown>
  ): Promise<void> {
    // Find matching triggers (OR across trigger.events)
    const matchingTriggers = triggers.filter((trigger) => {
      return trigger.events.some((event) => {
        // type must match
        if (event.type !== type)
          return false
        // event.source matching:
        // - event.source unset -> matches any source (including undefined)
        // - event.source set   -> must equal incoming source exactly
        if (event.source !== undefined && event.source !== source) {
          return false
        }
        return true
      })
    })

    // Execute matching triggers
    for (const trigger of matchingTriggers) {
      const context: RuntimeContext = {
        event: { type, source, payload },
        source,
        payload,
        ...payload
      }

      // Evaluate conditions (flat array with implicit AND + explicit groups)
      if (trigger.conditions) {
        const passed = evaluateConditions(trigger.conditions, context, functions)
        if (!passed)
          continue
      }

      // Execute actions
      for (const action of trigger.actions) {
        try {
          await executeActionNode(action, context, actionRegistry, functions, refResolver)
        }
        catch (error) {
          if (!continueOnError) {
            throw error
          }
        }
      }
    }
  }

  return {
    registerEvent,
    registerAction,
    registerFunction,
    addTrigger,
    removeTrigger,
    emit,
    listEvents: () => eventRegistry.list(),
    listActions: () => actionRegistry.list(),
    listTriggers: () => [...triggers]
  }
}
