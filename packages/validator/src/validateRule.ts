import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateActionNode } from './validateActionNode'
import { validateConditionGroup } from './validateCondition'
import { validateEvent } from './validateEvent'

/**
 * Validate a complete rule
 */
export function validateRule(rule: unknown): ValidationResult {
  const errors = []

  if (!rule || typeof rule !== 'object') {
    return invalidResult([createError('rule', 'Rule must be an object')])
  }

  const r = rule as Record<string, unknown>

  // Validate id
  if (!r.id || typeof r.id !== 'string') {
    errors.push(createError('rule.id', 'Rule must have a non-empty string id'))
  }

  // Validate name (optional)
  if (r.name !== undefined && typeof r.name !== 'string') {
    errors.push(createError('rule.name', 'Rule name must be a string'))
  }

  // Validate event
  if (!r.event) {
    errors.push(createError('rule.event', 'Rule must have an event'))
  }
  else {
    const eventResult = validateEvent(r.event, 'rule.event')
    if (!eventResult.valid) {
      errors.push(...eventResult.errors)
    }
  }

  // Validate conditions (optional)
  if (r.conditions !== undefined) {
    const condResult = validateConditionGroup(r.conditions, 'rule.conditions')
    if (!condResult.valid) {
      errors.push(...condResult.errors)
    }
  }

  // Validate actions
  if (!Array.isArray(r.actions)) {
    errors.push(createError('rule.actions', 'Rule must have an actions array'))
  }
  else if (r.actions.length === 0) {
    errors.push(createError('rule.actions', 'Rule must have at least one action'))
  }
  else {
    for (let i = 0; i < r.actions.length; i++) {
      const actionResult = validateActionNode(r.actions[i], `rule.actions[${i}]`)
      if (!actionResult.valid) {
        errors.push(...actionResult.errors)
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
