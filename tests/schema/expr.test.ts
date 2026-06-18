import {
  binary,
  call,
  concat,
  expr,
  exprCompare,
  logical,
  ternary,
  unary
} from '@triggerix/schema'
import { describe, expect, it } from 'vitest'

describe('expression builders', () => {
  it('expr wraps a node into an Expression', () => {
    const node = binary('+', 1, 2)
    expect(expr(node)).toEqual({ $expr: node })
  })

  it('binary builds a binary arithmetic node', () => {
    expect(binary('+', 1, 2)).toEqual({
      type: 'binary',
      operator: '+',
      left: 1,
      right: 2
    })
  })

  it('unary builds a unary node', () => {
    expect(unary('-', 5)).toEqual({
      type: 'unary',
      operator: '-',
      operand: 5
    })
  })

  it('exprCompare builds a comparison node', () => {
    expect(exprCompare('eq', 'a', 'b')).toEqual({
      type: 'compare',
      operator: 'eq',
      left: 'a',
      right: 'b'
    })
  })

  it('logical builds a logical node from variadic operands', () => {
    expect(logical('and', true, false)).toEqual({
      type: 'logical',
      operator: 'and',
      operands: [true, false]
    })
  })

  it('call builds a function call node from variadic args', () => {
    expect(call('sum', 1, 2, 3)).toEqual({
      type: 'call',
      name: 'sum',
      args: [1, 2, 3]
    })
  })

  it('concat builds a concat node from variadic values', () => {
    expect(concat('hello', ' ', 'world')).toEqual({
      type: 'concat',
      values: ['hello', ' ', 'world']
    })
  })

  it('ternary builds a ternary node', () => {
    expect(ternary(true, 'yes', 'no')).toEqual({
      type: 'ternary',
      test: true,
      consequent: 'yes',
      alternate: 'no'
    })
  })
})
