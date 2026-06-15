import type { ValidationResult } from './errors'
import { createError, invalidResult, validResult } from './errors'

const BINARY_OPERATORS = ['+', '-', '*', '/', '%']
const UNARY_OPERATORS = ['-', '!']
const COMPARE_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith']
const LOGICAL_OPERATORS = ['and', 'or', 'not']

/**
 * Validate an Expression wrapper { $expr: ExprNode }
 */
export function validateExpression(expr: unknown, path = 'expression'): ValidationResult {
  if (!expr || typeof expr !== 'object') {
    return invalidResult([createError(path, 'Expression must be an object')])
  }

  const e = expr as Record<string, unknown>

  if (!('$expr' in e)) {
    return invalidResult([createError(path, 'Expression must have a $expr field')])
  }

  return validateExprNode(e.$expr, `${path}.$expr`)
}

/**
 * Validate an ExprNode (recursive)
 */
export function validateExprNode(node: unknown, path = 'expr'): ValidationResult {
  if (!node || typeof node !== 'object') {
    return invalidResult([createError(path, 'ExprNode must be an object')])
  }

  const n = node as Record<string, unknown>

  if (!n.type || typeof n.type !== 'string') {
    return invalidResult([createError(`${path}.type`, 'ExprNode must have a string type field')])
  }

  switch (n.type) {
    case 'binary':
      return validateExprBinary(n, path)
    case 'unary':
      return validateExprUnary(n, path)
    case 'compare':
      return validateExprCompare(n, path)
    case 'logical':
      return validateExprLogical(n, path)
    case 'call':
      return validateExprCall(n, path)
    case 'concat':
      return validateExprConcat(n, path)
    case 'ternary':
      return validateExprTernary(n, path)
    default:
      return invalidResult([createError(`${path}.type`, `Unknown ExprNode type: ${n.type}`)])
  }
}

/**
 * Validate an ExprOperand (Literal | Reference | ExprNode)
 */
export function validateExprOperand(operand: unknown, path = 'operand'): ValidationResult {
  // Literal: string, number, boolean
  if (typeof operand === 'string' || typeof operand === 'number' || typeof operand === 'boolean') {
    return validResult()
  }

  if (!operand || typeof operand !== 'object') {
    return invalidResult([createError(path, 'ExprOperand must be a literal, reference, or expression node')])
  }

  const o = operand as Record<string, unknown>

  // Reference: { $ref: string }
  if ('$ref' in o) {
    if (typeof o.$ref !== 'string' || o.$ref.length === 0) {
      return invalidResult([createError(`${path}.$ref`, 'Reference $ref must be a non-empty string')])
    }
    return validResult()
  }

  // ExprNode: { type: ... }
  if ('type' in o) {
    return validateExprNode(o, path)
  }

  return invalidResult([createError(path, 'ExprOperand must be a literal, reference ({ $ref }), or expression node ({ type })')])
}

function validateExprBinary(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!BINARY_OPERATORS.includes(n.operator as string)) {
    errors.push(createError(`${path}.operator`, `Binary operator must be one of: ${BINARY_OPERATORS.join(', ')}`))
  }

  if (!('left' in n)) {
    errors.push(createError(`${path}.left`, 'Binary expression must have a left operand'))
  }
  else {
    const r = validateExprOperand(n.left, `${path}.left`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  if (!('right' in n)) {
    errors.push(createError(`${path}.right`, 'Binary expression must have a right operand'))
  }
  else {
    const r = validateExprOperand(n.right, `${path}.right`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprUnary(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!UNARY_OPERATORS.includes(n.operator as string)) {
    errors.push(createError(`${path}.operator`, `Unary operator must be one of: ${UNARY_OPERATORS.join(', ')}`))
  }

  if (!('operand' in n)) {
    errors.push(createError(`${path}.operand`, 'Unary expression must have an operand'))
  }
  else {
    const r = validateExprOperand(n.operand, `${path}.operand`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprCompare(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!COMPARE_OPERATORS.includes(n.operator as string)) {
    errors.push(createError(`${path}.operator`, `Compare operator must be one of: ${COMPARE_OPERATORS.join(', ')}`, 'semantic'))
  }

  if (!('left' in n)) {
    errors.push(createError(`${path}.left`, 'Compare expression must have a left operand'))
  }
  else {
    const r = validateExprOperand(n.left, `${path}.left`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  if (!('right' in n)) {
    errors.push(createError(`${path}.right`, 'Compare expression must have a right operand'))
  }
  else {
    const r = validateExprOperand(n.right, `${path}.right`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprLogical(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!LOGICAL_OPERATORS.includes(n.operator as string)) {
    errors.push(createError(`${path}.operator`, `Logical operator must be one of: ${LOGICAL_OPERATORS.join(', ')}`))
  }

  if (!Array.isArray(n.operands)) {
    errors.push(createError(`${path}.operands`, 'Logical expression must have an operands array'))
  }
  else {
    for (let i = 0; i < n.operands.length; i++) {
      const r = validateExprOperand(n.operands[i], `${path}.operands[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprCall(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!n.name || typeof n.name !== 'string') {
    errors.push(createError(`${path}.name`, 'Call expression must have a non-empty string name'))
  }

  if (!Array.isArray(n.args)) {
    errors.push(createError(`${path}.args`, 'Call expression must have an args array'))
  }
  else {
    for (let i = 0; i < n.args.length; i++) {
      const r = validateExprOperand(n.args[i], `${path}.args[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprConcat(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!Array.isArray(n.values)) {
    errors.push(createError(`${path}.values`, 'Concat expression must have a values array'))
  }
  else {
    for (let i = 0; i < n.values.length; i++) {
      const r = validateExprOperand(n.values[i], `${path}.values[${i}]`)
      if (!r.valid)
        errors.push(...r.errors)
    }
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}

function validateExprTernary(n: Record<string, unknown>, path: string): ValidationResult {
  const errors = []

  if (!('test' in n)) {
    errors.push(createError(`${path}.test`, 'Ternary expression must have a test operand'))
  }
  else {
    const r = validateExprOperand(n.test, `${path}.test`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  if (!('consequent' in n)) {
    errors.push(createError(`${path}.consequent`, 'Ternary expression must have a consequent operand'))
  }
  else {
    const r = validateExprOperand(n.consequent, `${path}.consequent`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  if (!('alternate' in n)) {
    errors.push(createError(`${path}.alternate`, 'Ternary expression must have an alternate operand'))
  }
  else {
    const r = validateExprOperand(n.alternate, `${path}.alternate`)
    if (!r.valid)
      errors.push(...r.errors)
  }

  return errors.length > 0 ? invalidResult(errors) : validResult()
}
