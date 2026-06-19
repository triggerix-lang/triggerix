import { validateEvent } from '@triggerix/validator'
import { describe, expect, it } from 'vitest'

describe('validateEvent', () => {
  describe('valid events', () => {
    it('should accept an event with only a type', () => {
      const result = validateEvent({ type: 'user.login' })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept an event with type and source', () => {
      const result = validateEvent({ type: 'click', source: 'button' })
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept an event with type, source, and payload', () => {
      const result = validateEvent({
        type: 'submit',
        source: 'form',
        payload: { foo: 'bar' }
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('invalid events', () => {
    it('should reject null', () => {
      const result = validateEvent(null)
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('event')
      expect(result.errors[0].message).toBe('Event must be an object')
    })

    it('should reject undefined', () => {
      const result = validateEvent(undefined)
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('event')
    })

    it('should reject empty object (missing type)', () => {
      const result = validateEvent({})
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('event.type')
      expect(result.errors[0].message).toContain('non-empty string')
    })

    it('should reject empty string type', () => {
      const result = validateEvent({ type: '' })
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('event.type')
    })

    it('should reject non-string type', () => {
      const result = validateEvent({ type: 123 })
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('event.type')
    })

    it('should reject non-string source', () => {
      const result = validateEvent({ type: 'click', source: 42 })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'event.source')).toBe(true)
    })

    it('should reject non-object payload', () => {
      const result = validateEvent({ type: 'click', payload: 'oops' })
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path === 'event.payload')).toBe(true)
    })

    it('should respect custom path', () => {
      const result = validateEvent(null, 'trigger.event')
      expect(result.valid).toBe(false)
      expect(result.errors[0].path).toBe('trigger.event')
    })
  })
})
