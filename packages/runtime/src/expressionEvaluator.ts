import type { CompareOp, ExprNode, ExprOperand, Reference } from '@triggerix/core'
import type { RuntimeContext } from './types'
import { COMPARE_OPERATORS } from '@triggerix/core'
import { getNestedValue } from './utils'

/**
 * Function registry type
 */
export type FunctionRegistry = Map<string, (...args: unknown[]) => unknown>

/**
 * Default maximum recursion depth for expression evaluation
 */
const DEFAULT_MAX_DEPTH = 100

// Re-export for downstream consumers that need to validate compare operators
export { COMPARE_OPERATORS }
export type { CompareOp }

/**
 * Evaluate an ExprOperand (Literal | Reference | ExprNode)
 */
export function evaluateExprOperand(
  operand: ExprOperand,
  context: RuntimeContext,
  functions: FunctionRegistry,
  depth: number = 0,
  maxDepth: number = DEFAULT_MAX_DEPTH
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
    return evaluateExprNode(operand as ExprNode, context, functions, depth, maxDepth)
  }

  return undefined
}

/**
 * Evaluate an ExprNode recursively with depth limit protection
 */
export function evaluateExprNode(
  node: ExprNode,
  context: RuntimeContext,
  functions: FunctionRegistry,
  depth: number = 0,
  maxDepth: number = DEFAULT_MAX_DEPTH
): unknown {
  if (depth > maxDepth) {
    throw new Error(`Expression evaluation exceeds maximum depth (${maxDepth})`)
  }

  const nextDepth = depth + 1

  switch (node.type) {
    case 'binary': {
      const left = evaluateExprOperand(node.left, context, functions, nextDepth, maxDepth) as number
      const right = evaluateExprOperand(node.right, context, functions, nextDepth, maxDepth) as number
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
      const val = evaluateExprOperand(node.operand, context, functions, nextDepth, maxDepth)
      switch (node.operator) {
        case '-': return -(val as number)
        case '!': return !val
      }
      break
    }

    case 'compare': {
      const left = evaluateExprOperand(node.left, context, functions, nextDepth, maxDepth)
      const right = evaluateExprOperand(node.right, context, functions, nextDepth, maxDepth)
      switch (node.operator) {
        case 'eq': return left === right
        case 'neq': return left !== right
        case 'gt': return (left as number) > (right as number)
        case 'gte': return (left as number) >= (right as number)
        case 'lt': return (left as number) < (right as number)
        case 'lte': return (left as number) <= (right as number)
      }
      break
    }

    case 'logical': {
      switch (node.operator) {
        case 'and':
          return node.operands.every(o => Boolean(evaluateExprOperand(o, context, functions, nextDepth, maxDepth)))
        case 'or':
          return node.operands.some(o => Boolean(evaluateExprOperand(o, context, functions, nextDepth, maxDepth)))
        case 'not':
          return !evaluateExprOperand(node.operands[0], context, functions, nextDepth, maxDepth)
      }
      break
    }

    case 'call': {
      const fn = functions.get(node.name)
      if (!fn) {
        throw new Error(`Function not registered: ${node.name}`)
      }
      const args = node.args.map(a => evaluateExprOperand(a, context, functions, nextDepth, maxDepth))
      return fn(...args)
    }

    case 'concat': {
      return node.values
        .map(v => String(evaluateExprOperand(v, context, functions, nextDepth, maxDepth)))
        .join('')
    }

    case 'ternary': {
      const test = evaluateExprOperand(node.test, context, functions, nextDepth, maxDepth)
      return test
        ? evaluateExprOperand(node.consequent, context, functions, nextDepth, maxDepth)
        : evaluateExprOperand(node.alternate, context, functions, nextDepth, maxDepth)
    }
  }

  return undefined
}
