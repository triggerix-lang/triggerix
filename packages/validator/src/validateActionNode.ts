import type { ValidationError, ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'
import { validateAction } from './validateAction'
import { validateCondition, validateConditionGroup } from './validateCondition'

/**
 * Validate an ActionNode (Action or Flow control node)
 */
export function validateActionNode(node: unknown, path = 'action'): ValidationResult {
  if (!node || typeof node !== 'object') {
    return invalidResult([createError(path, 'ActionNode must be an object')])
  }

  const n = node as Record<string, unknown>

  // Check if it's a flow control node (has type field matching flow types)
  if (n.type === 'sequence')
    return validateActionSequence(n, path)
  if (n.type === 'parallel')
    return validateActionParallel(n, path)
  if (n.type === 'tryCatch')
    return validateActionTryCatch(n, path)
  if (n.type === 'if')
    return validateActionIf(n, path)

  // Otherwise treat as a regular Action
  return validateAction(node, path)
}

/**
 * Validate ActionSequence
 */
function validateActionSequence(n: Record<string, unknown>, path: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!Array.isArray(n.actions)) {
    errors.push(createError(`${path}.actions`, 'Sequence must have an actions array'))
  }
  else {
    for (let i = 0; i < n.actions.length; i++) {
      const r = validateActionNode(n.actions[i], `${path}.actions[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

/**
 * Validate ActionParallel
 */
function validateActionParallel(n: Record<string, unknown>, path: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!Array.isArray(n.actions)) {
    errors.push(createError(`${path}.actions`, 'Parallel must have an actions array'))
  }
  else {
    for (let i = 0; i < n.actions.length; i++) {
      const r = validateActionNode(n.actions[i], `${path}.actions[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

/**
 * Validate ActionTryCatch
 */
function validateActionTryCatch(n: Record<string, unknown>, path: string): ValidationResult {
  const errors: ValidationError[] = []

  // try is required
  if (!Array.isArray(n.try)) {
    errors.push(createError(`${path}.try`, 'TryCatch must have a try array'))
  }
  else {
    for (let i = 0; i < n.try.length; i++) {
      const r = validateActionNode(n.try[i], `${path}.try[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  // catch is optional
  if (n.catch !== undefined) {
    if (!Array.isArray(n.catch)) {
      errors.push(createError(`${path}.catch`, 'TryCatch catch must be an array'))
    }
    else {
      for (let i = 0; i < n.catch.length; i++) {
        const r = validateActionNode(n.catch[i], `${path}.catch[${i}]`)
        if (!r.valid)
          errors.push(...r.errors)
      }
    }
  }

  // finally is optional
  if (n.finally !== undefined) {
    if (!Array.isArray(n.finally)) {
      errors.push(createError(`${path}.finally`, 'TryCatch finally must be an array'))
    }
    else {
      for (let i = 0; i < n.finally.length; i++) {
        const r = validateActionNode(n.finally[i], `${path}.finally[${i}]`)
        if (!r.valid)
          errors.push(...r.errors)
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

/**
 * Validate ActionIf
 */
function validateActionIf(n: Record<string, unknown>, path: string): ValidationResult {
  const errors: ValidationError[] = []

  // condition is required
  if (!n.condition) {
    errors.push(createError(`${path}.condition`, 'If must have a condition'))
  }
  else {
    // Determine if it's a ConditionGroup or Condition
    const c = n.condition as Record<string, unknown>
    if (c.type && ['and', 'or', 'not'].includes(c.type as string)) {
      const r = validateConditionGroup(n.condition, `${path}.condition`)
      if (!r.valid)
        errors.push(...r.errors)
    }
    else {
      const r = validateCondition(n.condition, `${path}.condition`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  // then is required
  if (!Array.isArray(n.then)) {
    errors.push(createError(`${path}.then`, 'If must have a then array'))
  }
  else {
    for (let i = 0; i < n.then.length; i++) {
      const r = validateActionNode(n.then[i], `${path}.then[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  // else is optional
  if (n.else !== undefined) {
    if (!Array.isArray(n.else)) {
      errors.push(createError(`${path}.else`, 'If else must be an array'))
    }
    else {
      for (let i = 0; i < n.else.length; i++) {
        const r = validateActionNode(n.else[i], `${path}.else[${i}]`)
        if (!r.valid)
          errors.push(...r.errors)
      }
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
