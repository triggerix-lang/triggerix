import type {
  ExprBinary,
  ExprCall,
  ExprCompare,
  ExprConcat,
  Expression,
  ExprLogical,
  ExprNode,
  ExprOperand,
  ExprTernary,
  ExprUnary
} from '@triggerix/core'

/**
 * Create an Expression value wrapper
 */
export function expr(node: ExprNode): Expression {
  return { $expr: node }
}

/**
 * Binary arithmetic operation
 */
export function binary(operator: ExprBinary['operator'], left: ExprOperand, right: ExprOperand): ExprBinary {
  return { type: 'binary', operator, left, right }
}

/**
 * Unary operation
 */
export function unary(operator: ExprUnary['operator'], operand: ExprOperand): ExprUnary {
  return { type: 'unary', operator, operand }
}

/**
 * Comparison operation
 */
export function exprCompare(operator: ExprCompare['operator'], left: ExprOperand, right: ExprOperand): ExprCompare {
  return { type: 'compare', operator, left, right }
}

/**
 * Logical combination
 */
export function logical(operator: ExprLogical['operator'], ...operands: ExprOperand[]): ExprLogical {
  return { type: 'logical', operator, operands }
}

/**
 * Function call
 */
export function call(name: string, ...args: ExprOperand[]): ExprCall {
  return { type: 'call', name, args }
}

/**
 * String concatenation
 */
export function concat(...values: ExprOperand[]): ExprConcat {
  return { type: 'concat', values }
}

/**
 * Ternary conditional
 */
export function ternary(test: ExprOperand, consequent: ExprOperand, alternate: ExprOperand): ExprTernary {
  return { type: 'ternary', test, consequent, alternate }
}
