import type { ExprNode, ExprOperand, Reference } from '@triggerix/core'
import type { RuntimeContext } from './types'

/**
 * Function registry type
 */
export type FunctionRegistry = Map<string, (...args: unknown[]) => unknown>

/**
 * Resolve a nested value from an object by dot-notation path
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
 * Evaluate an ExprOperand (Literal | Reference | ExprNode)
 */
export function evaluateExprOperand(
  operand: ExprOperand,
  context: RuntimeContext,
  functions: FunctionRegistry
): unknown {
  // Literal: string, number, boolean
  if (typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean') {
    return operand
  }

  // Reference: { $ref: string }
  if (operand && typeof operand === 'object' && '$ref' in operand) {
    return getNestedValue(context as unknown as Record<string, unknown>, (operand as Reference).$ref)
  }

  // ExprNode: { type: ... }
  if (operand && typeof operand === 'object' && 'type' in operand) {
    return evaluateExprNode(operand as ExprNode, context, functions)
  }

  return undefined
}

/**
 * Evaluate an ExprNode recursively
 */
export function evaluateExprNode(
  node: ExprNode,
  context: RuntimeContext,
  functions: FunctionRegistry
): unknown {
  switch (node.type) {
    case 'binary': {
      const left = evaluateExprOperand(node.left, context, functions) as number
      const right = evaluateExprOperand(node.right, context, functions) as number
      switch (node.operator) {
        case '+': return left + right
        case '-': return left - right
        case '*': return left * right
        case '/': return left / right
        case '%': return left % right
      }
      break
    }

    case 'unary': {
      const val = evaluateExprOperand(node.operand, context, functions)
      switch (node.operator) {
        case '-': return -(val as number)
        case '!': return !val
      }
      break
    }

    case 'compare': {
      const left = evaluateExprOperand(node.left, context, functions)
      const right = evaluateExprOperand(node.right, context, functions)
      switch (node.operator) {
        case 'eq': return left === right
        case 'neq': return left !== right
        case 'gt': return (left as number) > (right as number)
        case 'gte': return (left as number) >= (right as number)
        case 'lt': return (left as number) < (right as number)
        case 'lte': return (left as number) <= (right as number)
        case 'contains': return String(left).includes(String(right))
        case 'startsWith': return String(left).startsWith(String(right))
        case 'endsWith': return String(left).endsWith(String(right))
      }
      break
    }

    case 'logical': {
      const operands = node.operands.map(o => evaluateExprOperand(o, context, functions))
      switch (node.operator) {
        case 'and': return operands.every(Boolean)
        case 'or': return operands.some(Boolean)
        case 'not': return !operands[0]
      }
      break
    }

    case 'call': {
      const fn = functions.get(node.name)
      if (!fn) {
        throw new Error(`Function not registered: ${node.name}`)
      }
      const args = node.args.map(a => evaluateExprOperand(a, context, functions))
      return fn(...args)
    }

    case 'concat': {
      return node.values
        .map(v => String(evaluateExprOperand(v, context, functions)))
        .join('')
    }

    case 'ternary': {
      const test = evaluateExprOperand(node.test, context, functions)
      return test
        ? evaluateExprOperand(node.consequent, context, functions)
        : evaluateExprOperand(node.alternate, context, functions)
    }
  }

  return undefined
}
