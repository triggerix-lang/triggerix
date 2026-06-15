import type { Reference } from '@triggerix/core'

/**
 * Create a reference value
 */
export function ref(path: string): Reference {
  return { $ref: path }
}
