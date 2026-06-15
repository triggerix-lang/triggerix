import type { Rule } from '@triggerix/core'
import type { FunctionRegistry } from './expressionEvaluator'
import type { ActionHandler, RuntimeContext, RuntimeOptions } from './types'
import { ActionRegistry } from './actionRegistry'
import { evaluateConditionGroup } from './conditionEvaluator'
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
   * Add a rule to the runtime
   */
  addRule: (rule: Rule) => void

  /**
   * Remove a rule by id
   */
  removeRule: (id: string) => void

  /**
   * Emit an event - triggers matching rules
   */
  emit: (type: string, payload?: Record<string, unknown>) => Promise<void>

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
   * Get all added rules
   */
  listRules: () => Rule[]
}

/**
 * Create a new Triggerix runtime instance
 */
export function createRuntime(options: RuntimeOptions = {}): TriggerixRuntime {
  const eventRegistry = new EventRegistry()
  const actionRegistry = new ActionRegistry()
  const rules: Rule[] = []
  const functions: FunctionRegistry = new Map()

  const { continueOnError = false } = options

  function registerEvent(type: string): void {
    eventRegistry.register({ type })
  }

  function registerAction(type: string, handler: ActionHandler): void {
    actionRegistry.register({ type, handler })
  }

  function registerFunction(name: string, fn: (...args: unknown[]) => unknown): void {
    functions.set(name, fn)
  }

  function addRule(rule: Rule): void {
    rules.push(rule)
  }

  function removeRule(id: string): void {
    const index = rules.findIndex(r => r.id === id)
    if (index !== -1) {
      rules.splice(index, 1)
    }
  }

  async function emit(type: string, payload?: Record<string, unknown>): Promise<void> {
    // Find matching rules
    const matchingRules = rules.filter((rule) => {
      // Match event type
      if (rule.event.type !== type)
        return false

      // Match event source if specified
      if (rule.event.source) {
        // Source matching can be extended
      }

      return true
    })

    // Execute matching rules
    for (const rule of matchingRules) {
      const context: RuntimeContext = {
        event: { type, payload },
        payload,
        ...payload
      }

      // Evaluate conditions
      if (rule.conditions) {
        const passed = evaluateConditionGroup(rule.conditions, context, functions)
        if (!passed)
          continue
      }

      // Execute actions
      for (const action of rule.actions) {
        try {
          await executeActionNode(action, context, actionRegistry, functions)
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
    addRule,
    removeRule,
    emit,
    listEvents: () => eventRegistry.list(),
    listActions: () => actionRegistry.list(),
    listRules: () => [...rules]
  }
}
