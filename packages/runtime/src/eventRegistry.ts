import type { EventDefinition } from './types'

/**
 * Event registry - manages registered event types
 */
export class EventRegistry {
  private events = new Map<string, EventDefinition>()

  /**
   * Register an event type
   */
  register(definition: EventDefinition): void {
    this.events.set(definition.type, definition)
  }

  /**
   * Check if an event type is registered
   */
  has(type: string): boolean {
    return this.events.has(type)
  }

  /**
   * Get all registered event types
   */
  list(): string[] {
    return Array.from(this.events.keys())
  }
}
