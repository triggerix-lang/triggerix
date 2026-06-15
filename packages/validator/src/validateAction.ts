import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateValue } from './validateValue'

/**
 * Validate an action structure
 */
export function validateAction(action: unknown, path = 'action'): ValidationResult {
  const errors = []

  if (!action || typeof action !== 'object') {
    return invalidResult([createError(path, 'Action must be an object')])
  }

  const a = action as Record<string, unknown>

  if (!a.type || typeof a.type !== 'string') {
    errors.push(createError(`${path}.type`, 'Action type must be a non-empty string'))
  }

  if (a.params !== undefined) {
    if (typeof a.params !== 'object' || a.params === null) {
      errors.push(createError(`${path}.params`, 'Action params must be an object'))
    }
    else {
      const params = a.params as Record<string, unknown>
      for (const [key, value] of Object.entries(params)) {
        const valueResult = validateValue(value, `${path}.params.${key}`)
        if (!valueResult.valid) {
          errors.push(...valueResult.errors)
        }
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
