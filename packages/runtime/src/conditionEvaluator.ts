import type { Condition, ConditionGroup, Expression, Reference, Value } from '@triggerix/core'
import type { FunctionRegistry } from './expressionEvaluator'
import type { RuntimeContext } from './types'
import { evaluateExprNode } from './expressionEvaluator'
import { getNestedValue } from './utils'

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
 * Evaluate a single condition
 */
export function evaluateCondition(condition: Condition, context: RuntimeContext, functions: FunctionRegistry = new Map()): boolean {
  const left = resolveValue(condition.left, context, functions)

  // 'exists' requires no right operand
  if (condition.operator === 'exists') {
    return left !== undefined && left !== null
  }

  // Other operators require right operand
  if (condition.right === undefined) {
    throw new Error(`Operator '${condition.operator}' requires a right operand`)
  }

  const right = resolveValue(condition.right, context, functions)

  switch (condition.operator) {
    case 'eq':
      return left === right
    case 'neq':
      return left !== right
    case 'gt':
      return typeof left === 'number' && typeof right === 'number' && left > right
    case 'gte':
      return typeof left === 'number' && typeof right === 'number' && left >= right
    case 'lt':
      return typeof left === 'number' && typeof right === 'number' && left < right
    case 'lte':
      return typeof left === 'number' && typeof right === 'number' && left <= right
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
