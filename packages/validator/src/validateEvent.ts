import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'

/**
 * Validate an event structure
 */
export function validateEvent(event: unknown, path = 'event'): ValidationResult {
  const errors = []

  if (!event || typeof event !== 'object') {
    return invalidResult([createError(path, 'Event must be an object')])
  }

  const e = event as Record<string, unknown>

  if (!e.type || typeof e.type !== 'string') {
    errors.push(createError(`${path}.type`, 'Event type must be a non-empty string'))
  }

  if (e.source !== undefined && typeof e.source !== 'string') {
    errors.push(createError(`${path}.source`, 'Event source must be a string'))
  }

  if (e.payload !== undefined && (typeof e.payload !== 'object' || e.payload === null)) {
    errors.push(createError(`${path}.payload`, 'Event payload must be an object'))
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
