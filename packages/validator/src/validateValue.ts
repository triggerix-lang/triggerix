import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateExpression } from './validateExpression'

/**
 * Validate a Value (Literal or Reference)
 */
export function validateValue(value: unknown, path = 'value'): ValidationResult {
  // Literal: string, number, boolean
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return validResult()
  }

  // Reference: { $ref: string }
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>
    if ('$ref' in v) {
      if (typeof v.$ref !== 'string' || v.$ref.length === 0) {
        return invalidResult([createError(`${path}.$ref`, 'Reference $ref must be a non-empty string')])
      }
      return validResult()
    }

    // Expression: { $expr: ExprNode }
    if ('$expr' in v) {
      return validateExpression(value, path)
    }
  }

  return invalidResult([createError(path, 'Value must be a literal (string/number/boolean) or a reference ({ $ref: string })')])
}
