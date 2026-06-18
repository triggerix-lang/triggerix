import type { Rule } from '@triggerix/core'

/**
 * Common interface for all editor implementations.
 */
export interface Editor<TState = unknown> {
  /** Get current editor state */
  getState: () => TState
  /** Subscribe to state changes */
  onChange: (listener: () => void) => () => void
  /** Serialize to Rule JSON */
  toRule: (ruleId?: string) => Rule
  /** Reset editor state */
  reset: () => void
  /** Dispose and release resources */
  dispose: () => void
}

/**
 * Preset interface for batch-registering definitions.
 */
export interface Preset<TEditor extends Editor> {
  name: string
  setup: (editor: TEditor) => void
}
