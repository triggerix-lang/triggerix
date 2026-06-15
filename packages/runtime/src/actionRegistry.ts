import type { Value } from '@triggerix/core'
import type { ActionDefinition } from './types'

/**
 * Action registry - manages registered action types and their handlers
 */
export class ActionRegistry {
  private actions = new Map<string, ActionDefinition>()

  /**
   * Register an action type with its handler
   */
  register(definition: ActionDefinition): void {
    this.actions.set(definition.type, definition)
  }

  /**
   * Check if an action type is registered
   */
  has(type: string): boolean {
    return this.actions.has(type)
  }

  /**
   * Execute an action by type
   */
  async execute(type: string, params?: Record<string, Value>): Promise<void> {
    const definition = this.actions.get(type)
    if (!definition) {
      throw new Error(`Action not registered: ${type}`)
    }
    await definition.handler(params)
  }

  /**
   * Get all registered action types
   */
  list(): string[] {
    return Array.from(this.actions.keys())
  }
}
