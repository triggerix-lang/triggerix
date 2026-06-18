import type { FunctionRegistry, RuntimeContext } from '@triggerix/runtime'
import { evaluateExprNode, evaluateExprOperand } from '@triggerix/runtime'
import { describe, expect, it } from 'vitest'

function makeContext(extra: Record<string, unknown> = {}): RuntimeContext {
  return {
    event: { type: 'test' },
    payload: { x: 10 },
    x: 10,
    ...extra
  }
}

const emptyFns: FunctionRegistry = new Map()

describe('evaluateExprOperand', () => {
  it('resolves string literal', () => {
    expect(evaluateExprOperand('hello', makeContext(), emptyFns)).toBe('hello')
  })

  it('resolves number literal', () => {
    expect(evaluateExprOperand(42, makeContext(), emptyFns)).toBe(42)
  })

  it('resolves boolean literal', () => {
    expect(evaluateExprOperand(true, makeContext(), emptyFns)).toBe(true)
  })

  it('resolves Reference from context', () => {
    expect(evaluateExprOperand({ $ref: 'x' }, makeContext(), emptyFns)).toBe(10)
    expect(evaluateExprOperand({ $ref: 'payload.x' }, makeContext(), emptyFns)).toBe(10)
  })

  it('resolves nested ExprNode', () => {
    const operand = { type: 'binary' as const, operator: '+' as const, left: 1, right: 2 }
    expect(evaluateExprOperand(operand, makeContext(), emptyFns)).toBe(3)
  })
})

describe('evaluateExprNode binary', () => {
  const ctx = makeContext()

  it('+ adds operands', () => {
    expect(evaluateExprNode({ type: 'binary', operator: '+', left: 2, right: 3 }, ctx, emptyFns)).toBe(5)
  })

  it('- subtracts operands', () => {
    expect(evaluateExprNode({ type: 'binary', operator: '-', left: 10, right: 3 }, ctx, emptyFns)).toBe(7)
  })

  it('* multiplies operands', () => {
    expect(evaluateExprNode({ type: 'binary', operator: '*', left: 4, right: 3 }, ctx, emptyFns)).toBe(12)
  })

  it('/ divides operands', () => {
    expect(evaluateExprNode({ type: 'binary', operator: '/', left: 12, right: 3 }, ctx, emptyFns)).toBe(4)
  })

  it('% computes modulo', () => {
    expect(evaluateExprNode({ type: 'binary', operator: '%', left: 10, right: 3 }, ctx, emptyFns)).toBe(1)
  })
})

describe('evaluateExprNode unary', () => {
  const ctx = makeContext()

  it('- negates the operand', () => {
    expect(evaluateExprNode({ type: 'unary', operator: '-', operand: 5 }, ctx, emptyFns)).toBe(-5)
  })

  it('! inverts truthy operand', () => {
    expect(evaluateExprNode({ type: 'unary', operator: '!', operand: true }, ctx, emptyFns)).toBe(false)
  })

  it('! inverts falsy operand', () => {
    expect(evaluateExprNode({ type: 'unary', operator: '!', operand: false }, ctx, emptyFns)).toBe(true)
  })
})

describe('evaluateExprNode compare', () => {
  const ctx = makeContext()

  it('eq', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'eq', left: 1, right: 1 }, ctx, emptyFns)).toBe(true)
    expect(evaluateExprNode({ type: 'compare', operator: 'eq', left: 1, right: 2 }, ctx, emptyFns)).toBe(false)
  })

  it('neq', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'neq', left: 1, right: 2 }, ctx, emptyFns)).toBe(true)
  })

  it('gt', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'gt', left: 2, right: 1 }, ctx, emptyFns)).toBe(true)
  })

  it('gte', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'gte', left: 2, right: 2 }, ctx, emptyFns)).toBe(true)
  })

  it('lt', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'lt', left: 1, right: 2 }, ctx, emptyFns)).toBe(true)
  })

  it('lte', () => {
    expect(evaluateExprNode({ type: 'compare', operator: 'lte', left: 2, right: 2 }, ctx, emptyFns)).toBe(true)
  })
})

describe('evaluateExprNode logical', () => {
  const ctx = makeContext()

  it('and: returns true when all are truthy', () => {
    expect(evaluateExprNode({ type: 'logical', operator: 'and', operands: [true, 1, 'x'] }, ctx, emptyFns)).toBe(true)
  })

  it('and: returns false when any is falsy', () => {
    expect(evaluateExprNode({ type: 'logical', operator: 'and', operands: [true, 0] }, ctx, emptyFns)).toBe(false)
  })

  it('or: returns true when any is truthy', () => {
    expect(evaluateExprNode({ type: 'logical', operator: 'or', operands: [false, 0, 1] }, ctx, emptyFns)).toBe(true)
  })

  it('or: returns false when all are falsy', () => {
    expect(evaluateExprNode({ type: 'logical', operator: 'or', operands: [false, 0] }, ctx, emptyFns)).toBe(false)
  })

  it('not: inverts the first operand', () => {
    expect(evaluateExprNode({ type: 'logical', operator: 'not', operands: [false] }, ctx, emptyFns)).toBe(true)
    expect(evaluateExprNode({ type: 'logical', operator: 'not', operands: [true] }, ctx, emptyFns)).toBe(false)
  })
})

describe('evaluateExprNode call', () => {
  const ctx = makeContext()

  it('invokes a registered function', () => {
    const fns: FunctionRegistry = new Map([
      ['double', (n: unknown) => (n as number) * 2]
    ])
    const result = evaluateExprNode(
      { type: 'call', name: 'double', args: [5] },
      ctx,
      fns
    )
    expect(result).toBe(10)
  })

  it('throws when function is not registered', () => {
    expect(() =>
      evaluateExprNode({ type: 'call', name: 'unknown', args: [] }, ctx, emptyFns)
    ).toThrow(/Function not registered/)
  })
})

describe('evaluateExprNode concat', () => {
  const ctx = makeContext()

  it('concatenates multiple values into a string', () => {
    const result = evaluateExprNode(
      { type: 'concat', values: ['hello', ' ', 'world', '!', 1] },
      ctx,
      emptyFns
    )
    expect(result).toBe('hello world!1')
  })
})

describe('evaluateExprNode ternary', () => {
  const ctx = makeContext()

  it('returns consequent when test is truthy', () => {
    const result = evaluateExprNode(
      { type: 'ternary', test: true, consequent: 'yes', alternate: 'no' },
      ctx,
      emptyFns
    )
    expect(result).toBe('yes')
  })

  it('returns alternate when test is falsy', () => {
    const result = evaluateExprNode(
      { type: 'ternary', test: false, consequent: 'yes', alternate: 'no' },
      ctx,
      emptyFns
    )
    expect(result).toBe('no')
  })
})

describe('evaluateExprNode depth protection', () => {
  it('throws when depth exceeds maxDepth', () => {
    const ctx = makeContext()
    expect(() =>
      evaluateExprNode(
        { type: 'binary', operator: '+', left: 1, right: 2 },
        ctx,
        emptyFns,
        10,
        5
      )
    ).toThrow(/Expression evaluation exceeds maximum depth/)
  })
})
