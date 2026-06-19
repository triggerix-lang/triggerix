import { validateTrigger } from '@triggerix/validator'
import { describe, expect, it } from 'vitest'

describe('validateTrigger', () => {
  describe('valid triggers', () => {
    it('should accept a minimal valid trigger', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept a trigger with optional name', () => {
      const result = validateTrigger({
        id: 't1',
        name: 'My Trigger',
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(true)
    })

    it('should accept a trigger with conditions', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        conditions: {
          type: 'and',
          conditions: [{ left: 1, operator: 'eq', right: 1 }]
        },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(true)
    })

    it('should accept multiple actions', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        actions: [{ type: 'log' }, { type: 'navigate' }]
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid triggers', () => {
    it('should reject null', () => {
      const result = validateTrigger(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('trigger')
      expect(result.errors[0].message).toBe('Trigger must be an object')
    })

    it('should reject non-object', () => {
      const result = validateTrigger('not a trigger')
      expect(result.valid).toBe(false)
      expect(result.errors[0].message).toBe('Trigger must be an object')
    })

    it('should reject trigger missing id', () => {
      const result = validateTrigger({
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.id')).toBe(true)
    })

    it('should reject trigger with non-string id', () => {
      const result = validateTrigger({
        id: 123,
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.id')).toBe(true)
    })

    it('should reject trigger with empty string id', () => {
      const result = validateTrigger({
        id: '',
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.id')).toBe(true)
    })

    it('should reject trigger with non-string name', () => {
      const result = validateTrigger({
        id: 't1',
        name: 123,
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.name')).toBe(true)
    })

    it('should accept undefined name', () => {
      const result = validateTrigger({
        id: 't1',
        name: undefined,
        event: { type: 'click' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(true)
    })

    it('should reject trigger missing event', () => {
      const result = validateTrigger({
        id: 't1',
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.event')).toBe(true)
    })

    it('should propagate errors from invalid event', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: '' },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.event.type')).toBe(true)
    })

    it('should reject trigger missing actions', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' }
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.actions')).toBe(true)
    })

    it('should reject trigger with non-array actions', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        actions: 'not array'
      })
      expect(result.valid).toBe(false)
      const err = result.errors.find(e => e.path === 'trigger.actions')
      expect(err?.message).toContain('actions array')
    })

    it('should reject trigger with empty actions array', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        actions: []
      })
      expect(result.valid).toBe(false)
      const err = result.errors.find(e => e.path === 'trigger.actions')
      expect(err?.message).toContain('at least one action')
    })

    it('should propagate errors from invalid action elements', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        actions: [{ type: '' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path.startsWith('trigger.actions[0]'))).toBe(true)
    })

    it('should propagate errors from invalid conditions', () => {
      const result = validateTrigger({
        id: 't1',
        event: { type: 'click' },
        conditions: { type: 'invalid', conditions: [] },
        actions: [{ type: 'log' }]
      })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'trigger.conditions.type')).toBe(true)
    })
  })
})
