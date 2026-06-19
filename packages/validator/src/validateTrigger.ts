import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateActionNode } from './validateActionNode'
import { validateConditionGroup } from './validateCondition'
import { validateEvent } from './validateEvent'

/**
 * Validate a complete trigger
 */
export function validateTrigger(trigger: unknown): ValidationResult {
  const errors = []

  if (!trigger || typeof trigger !== 'object') {
    return invalidResult([createError('trigger', 'Trigger must be an object')])
  }

  const r = trigger as Record<string, unknown>

  // Validate id
  if (!r.id || typeof r.id !== 'string') {
    errors.push(createError('trigger.id', 'Trigger must have a non-empty string id'))
  }

  // Validate name (optional)
  if (r.name !== undefined && typeof r.name !== 'string') {
    errors.push(createError('trigger.name', 'Trigger name must be a string'))
  }

  // Validate event
  if (!r.event) {
    errors.push(createError('trigger.event', 'Trigger must have an event'))
  }
  else {
    const eventResult = validateEvent(r.event, 'trigger.event')
    if (!eventResult.valid) {
      errors.push(...eventResult.errors)
    }
  }

  // Validate conditions (optional)
  if (r.conditions !== undefined) {
    const condResult = validateConditionGroup(r.conditions, 'trigger.conditions')
    if (!condResult.valid) {
      errors.push(...condResult.errors)
    }
  }

  // Validate actions
  if (!Array.isArray(r.actions)) {
    errors.push(createError('trigger.actions', 'Trigger must have an actions array'))
  }
  else if (r.actions.length === 0) {
    errors.push(createError('trigger.actions', 'Trigger must have at least one action'))
  }
  else {
    for (let i = 0; i < r.actions.length; i++) {
      const actionResult = validateActionNode(r.actions[i], `trigger.actions[${i}]`)
      if (!actionResult.valid) {
        errors.push(...actionResult.errors)
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
