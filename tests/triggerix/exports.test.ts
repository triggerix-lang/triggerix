import { describe, expect, it } from 'vitest'
import * as triggerix from '../../packages/triggerix/src/index'

describe('@triggerix/triggerix aggregate exports', () => {
  describe('re-exports from @triggerix/core', () => {
    it('should expose isConditionGroup', () => {
      expect(typeof triggerix.isConditionGroup).toBe('function')
    })

    it('should expose VALID_OPERATORS', () => {
      expect(triggerix.VALID_OPERATORS).toBeDefined()
      expect(Array.isArray(triggerix.VALID_OPERATORS)).toBe(true)
    })
  })

  describe('re-exports from @triggerix/schema', () => {
    it('should expose defineTrigger', () => {
      expect(typeof triggerix.defineTrigger).toBe('function')
    })

    it('should expose defineAction', () => {
      expect(typeof triggerix.defineAction).toBe('function')
    })

    it('should expose expr', () => {
      expect(typeof triggerix.expr).toBe('function')
    })

    it('should expose binary', () => {
      expect(typeof triggerix.binary).toBe('function')
    })

    it('should expose sequence', () => {
      expect(typeof triggerix.sequence).toBe('function')
    })
  })

  describe('re-exports from @triggerix/validator', () => {
    it('should expose validateTrigger', () => {
      expect(typeof triggerix.validateTrigger).toBe('function')
    })

    it('should expose validateCondition', () => {
      expect(typeof triggerix.validateCondition).toBe('function')
    })
  })

  describe('re-exports from @triggerix/runtime', () => {
    it('should expose createRuntime', () => {
      expect(typeof triggerix.createRuntime).toBe('function')
    })

    it('should expose ActionRegistry', () => {
      expect(typeof triggerix.ActionRegistry).toBe('function')
    })

    it('should expose evaluateCondition', () => {
      expect(typeof triggerix.evaluateCondition).toBe('function')
    })
  })

  describe('re-exports from @triggerix/json-schema', () => {
    it('should expose generateTriggerSchema', () => {
      expect(typeof triggerix.generateTriggerSchema).toBe('function')
    })
  })
})
