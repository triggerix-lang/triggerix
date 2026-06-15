import type { Operator } from '@triggerix/core'
import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateValue } from './validateValue'

const VALID_OPERATORS: Operator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'startsWith',
  'endsWith',
  'exists'
]

/**
 * Validate a single condition
 */
export function validateCondition(condition: unknown, path = 'condition'): ValidationResult {
  const errors = []

  if (!condition || typeof condition !== 'object') {
    return invalidResult([createError(path, 'Condition must be an object')])
  }

  const c = condition as Record<string, unknown>

  // Validate left
  if (!('left' in c)) {
    errors.push(createError(`${path}.left`, 'Condition must have a left value'))
  }
  else {
    const leftResult = validateValue(c.left, `${path}.left`)
    if (!leftResult.valid) {
      errors.push(...leftResult.errors)
    }
  }

  // Validate operator
  if (!('operator' in c)) {
    errors.push(createError(`${path}.operator`, 'Condition must have an operator'))
  }
  else if (typeof c.operator !== 'string' || !VALID_OPERATORS.includes(c.operator as Operator)) {
    errors.push(createError(`${path}.operator`, `Invalid operator: ${c.operator}. Must be one of: ${VALID_OPERATORS.join(', ')}`, 'semantic'))
  }

  // Validate right (optional, but required for most operators)
  if ('right' in c && c.right !== undefined) {
    const rightResult = validateValue(c.right, `${path}.right`)
    if (!rightResult.valid) {
      errors.push(...rightResult.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

/**
 * Validate a condition group (AND / OR / NOT)
 */
export function validateConditionGroup(group: unknown, path = 'conditions'): ValidationResult {
  const errors = []

  if (!group || typeof group !== 'object') {
    return invalidResult([createError(path, 'ConditionGroup must be an object')])
  }

  const g = group as Record<string, unknown>

  // Validate type
  if (!g.type || !['and', 'or', 'not'].includes(g.type as string)) {
    errors.push(createError(`${path}.type`, 'ConditionGroup type must be "and", "or", or "not"'))
  }

  // Validate conditions array
  if (!Array.isArray(g.conditions)) {
    errors.push(createError(`${path}.conditions`, 'ConditionGroup must have a conditions array'))
  }
  else {
    for (let i = 0; i < g.conditions.length; i++) {
      const item = g.conditions[i]
      const itemPath = `${path}.conditions[${i}]`

      // Determine if it's a ConditionGroup or a Condition
      if (item && typeof item === 'object' && 'type' in item && ['and', 'or', 'not'].includes((item as Record<string, unknown>).type as string)) {
        const groupResult = validateConditionGroup(item, itemPath)
        if (!groupResult.valid) {
          errors.push(...groupResult.errors)
        }
      }
      else {
        const condResult = validateCondition(item, itemPath)
        if (!condResult.valid) {
          errors.push(...condResult.errors)
        }
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
