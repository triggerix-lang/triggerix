import type { Condition, ConditionGroup, Expression, Reference, Value } from '@triggerix/core'
import type { FunctionRegistry } from './expressionEvaluator'
import type { RuntimeContext } from './types'
import { evaluateExprNode } from './expressionEvaluator'

/**
 * Resolve a Value to its actual value given a runtime context
 */
export function resolveValue(value: Value, context: RuntimeContext, functions: FunctionRegistry = new Map()): unknown {
  // Literal value
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value
  }

  // Expression value: { $expr: ... } —— must come before Reference check
  if (value && typeof value === 'object' && '$expr' in value) {
    return evaluateExprNode((value as Expression).$expr, context, functions)
  }

  // Reference value
  if (value && typeof value === 'object' && '$ref' in value) {
    const ref = value as Reference
    return getNestedValue(context as unknown as Record<string, unknown>, ref.$ref)
  }

  return value
}

/**
 * Get a nested value from an object by dot-notation path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Evaluate a single condition
 */
export function evaluateCondition(condition: Condition, context: RuntimeContext, functions: FunctionRegistry = new Map()): boolean {
  const left = resolveValue(condition.left, context, functions)
  const right = condition.right !== undefined ? resolveValue(condition.right, context, functions) : undefined

  switch (condition.operator) {
    case 'eq':
      return left === right
    case 'neq':
      return left !== right
    case 'gt':
      return (left as number) > (right as number)
    case 'gte':
      return (left as number) >= (right as number)
    case 'lt':
      return (left as number) < (right as number)
    case 'lte':
      return (left as number) <= (right as number)
    case 'contains':
      return typeof left === 'string' && typeof right === 'string' && left.includes(right)
    case 'startsWith':
      return typeof left === 'string' && typeof right === 'string' && left.startsWith(right)
    case 'endsWith':
      return typeof left === 'string' && typeof right === 'string' && left.endsWith(right)
    case 'exists':
      return left !== undefined && left !== null
    default:
      return false
  }
}

/**
 * Evaluate a condition group (AND / OR / NOT)
 */
export function evaluateConditionGroup(group: ConditionGroup, context: RuntimeContext, functions: FunctionRegistry = new Map()): boolean {
  switch (group.type) {
    case 'and':
      return group.conditions.every(c => evaluateItem(c, context, functions))
    case 'or':
      return group.conditions.some(c => evaluateItem(c, context, functions))
    case 'not':
      return !group.conditions.some(c => evaluateItem(c, context, functions))
    default:
      return false
  }
}

/**
 * Evaluate a condition or condition group
 */
function evaluateItem(item: Condition | ConditionGroup, context: RuntimeContext, functions: FunctionRegistry): boolean {
  if ('operator' in item) {
    return evaluateCondition(item as Condition, context, functions)
  }
  return evaluateConditionGroup(item as ConditionGroup, context, functions)
}
