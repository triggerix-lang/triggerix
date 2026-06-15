import type { JSONSchema } from './types'

/**
 * Generate JSON Schema for ExprOperand (Literal | Reference | ExprNode)
 */
export function generateExprOperandSchema(): JSONSchema {
  return {
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      {
        type: 'object',
        properties: {
          $ref: { type: 'string' }
        },
        required: ['$ref'],
        additionalProperties: false
      },
      { $ref: '#/definitions/ExprNode' }
    ]
  }
}

/**
 * Generate JSON Schema for ExprNode (all expression node types)
 */
export function generateExprNodeSchema(): JSONSchema {
  return {
    oneOf: [
      { $ref: '#/definitions/ExprBinary' },
      { $ref: '#/definitions/ExprUnary' },
      { $ref: '#/definitions/ExprCompare' },
      { $ref: '#/definitions/ExprLogical' },
      { $ref: '#/definitions/ExprCall' },
      { $ref: '#/definitions/ExprConcat' },
      { $ref: '#/definitions/ExprTernary' }
    ]
  }
}

/**
 * Generate JSON Schema for ExprBinary
 */
export function generateExprBinarySchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'binary' },
      operator: { type: 'string', enum: ['+', '-', '*', '/', '%'] },
      left: { $ref: '#/definitions/ExprOperand' },
      right: { $ref: '#/definitions/ExprOperand' }
    },
    required: ['type', 'operator', 'left', 'right'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprUnary
 */
export function generateExprUnarySchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'unary' },
      operator: { type: 'string', enum: ['-', '!'] },
      operand: { $ref: '#/definitions/ExprOperand' }
    },
    required: ['type', 'operator', 'operand'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprCompare
 */
export function generateExprCompareSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'compare' },
      operator: { type: 'string', enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith'] },
      left: { $ref: '#/definitions/ExprOperand' },
      right: { $ref: '#/definitions/ExprOperand' }
    },
    required: ['type', 'operator', 'left', 'right'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprLogical
 */
export function generateExprLogicalSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'logical' },
      operator: { type: 'string', enum: ['and', 'or', 'not'] },
      operands: {
        type: 'array',
        items: { $ref: '#/definitions/ExprOperand' },
        minItems: 1
      }
    },
    required: ['type', 'operator', 'operands'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprCall
 */
export function generateExprCallSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'call' },
      name: { type: 'string' },
      args: {
        type: 'array',
        items: { $ref: '#/definitions/ExprOperand' }
      }
    },
    required: ['type', 'name', 'args'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprConcat
 */
export function generateExprConcatSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'concat' },
      values: {
        type: 'array',
        items: { $ref: '#/definitions/ExprOperand' },
        minItems: 1
      }
    },
    required: ['type', 'values'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ExprTernary
 */
export function generateExprTernarySchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'ternary' },
      test: { $ref: '#/definitions/ExprOperand' },
      consequent: { $ref: '#/definitions/ExprOperand' },
      alternate: { $ref: '#/definitions/ExprOperand' }
    },
    required: ['type', 'test', 'consequent', 'alternate'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for Expression wrapper { $expr: ExprNode }
 */
export function generateExpressionSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      $expr: { $ref: '#/definitions/ExprNode' }
    },
    required: ['$expr'],
    additionalProperties: false
  }
}
