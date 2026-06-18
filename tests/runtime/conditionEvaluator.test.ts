import type { RuntimeContext } from '@triggerix/runtime'
import { evaluateCondition, evaluateConditionGroup, resolveValue } from '@triggerix/runtime'
import { describe, expect, it } from 'vitest'

function makeContext(payload: Record<string, unknown> = {}): RuntimeContext {
  return {
    event: { type: 'test' },
    payload,
    ...payload
  }
}

describe('resolveValue', () => {
  it('returns string literal directly', () => {
    expect(resolveValue('hello', makeContext())).toBe('hello')
  })

  it('returns number literal directly', () => {
    expect(resolveValue(42, makeContext())).toBe(42)
  })

  it('returns boolean literal directly', () => {
    expect(resolveValue(true, makeContext())).toBe(true)
    expect(resolveValue(false, makeContext())).toBe(false)
  })

  it('resolves Reference from context using dot path', () => {
    const ctx = makeContext({ name: 'alice' })
    expect(resolveValue({ $ref: 'payload.name' }, ctx)).toBe('alice')
  })

  it('resolves nested Reference', () => {
    const ctx: RuntimeContext = {
      event: { type: 'test' },
      payload: { user: { profile: { age: 18 } } }
    }
    expect(resolveValue({ $ref: 'payload.user.profile.age' }, ctx)).toBe(18)
  })

  it('returns undefined for missing Reference path', () => {
    expect(resolveValue({ $ref: 'payload.missing' }, makeContext())).toBeUndefined()
  })

  it('evaluates Expression value', () => {
    const result = resolveValue(
      { $expr: { type: 'binary', operator: '+', left: 1, right: 2 } },
      makeContext()
    )
    expect(result).toBe(3)
  })
})

describe('evaluateCondition', () => {
  const ctx = makeContext()

  it('eq returns true when equal', () => {
    expect(evaluateCondition({ left: 1, operator: 'eq', right: 1 }, ctx)).toBe(true)
  })

  it('eq returns false when not equal', () => {
    expect(evaluateCondition({ left: 1, operator: 'eq', right: 2 }, ctx)).toBe(false)
  })

  it('neq operator', () => {
    expect(evaluateCondition({ left: 1, operator: 'neq', right: 2 }, ctx)).toBe(true)
    expect(evaluateCondition({ left: 1, operator: 'neq', right: 1 }, ctx)).toBe(false)
  })

  it('gt operator', () => {
    expect(evaluateCondition({ left: 2, operator: 'gt', right: 1 }, ctx)).toBe(true)
    expect(evaluateCondition({ left: 1, operator: 'gt', right: 2 }, ctx)).toBe(false)
  })

  it('gte operator', () => {
    expect(evaluateCondition({ left: 2, operator: 'gte', right: 2 }, ctx)).toBe(true)
    expect(evaluateCondition({ left: 1, operator: 'gte', right: 2 }, ctx)).toBe(false)
  })

  it('lt operator', () => {
    expect(evaluateCondition({ left: 1, operator: 'lt', right: 2 }, ctx)).toBe(true)
    expect(evaluateCondition({ left: 2, operator: 'lt', right: 1 }, ctx)).toBe(false)
  })

  it('lte operator', () => {
    expect(evaluateCondition({ left: 2, operator: 'lte', right: 2 }, ctx)).toBe(true)
    expect(evaluateCondition({ left: 3, operator: 'lte', right: 2 }, ctx)).toBe(false)
  })

  it('exists returns true when value exists', () => {
    const c = makeContext({ name: 'alice' })
    expect(evaluateCondition({ left: { $ref: 'payload.name' }, operator: 'exists' }, c)).toBe(true)
  })

  it('exists returns false when value does not exist', () => {
    const c = makeContext()
    expect(evaluateCondition({ left: { $ref: 'payload.missing' }, operator: 'exists' }, c)).toBe(false)
  })

  it('throws when right operand missing for non-exists operator', () => {
    expect(() => evaluateCondition({ left: 1, operator: 'eq' }, ctx)).toThrow(/requires a right operand/)
  })
})

describe('evaluateConditionGroup', () => {
  const ctx = makeContext()

  it('and: returns true when all conditions are true', () => {
    const group = {
      type: 'and' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 1 },
        { left: 2, operator: 'eq' as const, right: 2 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(true)
  })

  it('and: returns false when any condition is false', () => {
    const group = {
      type: 'and' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 1 },
        { left: 2, operator: 'eq' as const, right: 3 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(false)
  })

  it('or: returns true when any condition is true', () => {
    const group = {
      type: 'or' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 2 },
        { left: 2, operator: 'eq' as const, right: 2 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(true)
  })

  it('or: returns false when all conditions are false', () => {
    const group = {
      type: 'or' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 2 },
        { left: 2, operator: 'eq' as const, right: 3 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(false)
  })

  it('not: returns true when all conditions are false', () => {
    const group = {
      type: 'not' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 2 },
        { left: 2, operator: 'eq' as const, right: 3 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(true)
  })

  it('not: returns false when any condition is true', () => {
    const group = {
      type: 'not' as const,
      conditions: [
        { left: 1, operator: 'eq' as const, right: 1 },
        { left: 2, operator: 'eq' as const, right: 3 }
      ]
    }
    expect(evaluateConditionGroup(group, ctx)).toBe(false)
  })
})
