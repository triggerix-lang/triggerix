import { compare } from '@triggerix/runtime'
import { describe, expect, it } from 'vitest'

describe('compare', () => {
  describe('eq', () => {
    it('should return true for equal values', () => {
      expect(compare.left(1).eq.right(1)).toBe(true)
      expect(compare.left('hello').eq.right('hello')).toBe(true)
      expect(compare.left(true).eq.right(true)).toBe(true)
    })

    it('should return false for unequal values', () => {
      expect(compare.left(1).eq.right(2)).toBe(false)
      expect(compare.left('a').eq.right('b')).toBe(false)
    })
  })

  describe('neq', () => {
    it('should return true for unequal values', () => {
      expect(compare.left(1).neq.right(2)).toBe(true)
    })

    it('should return false for equal values', () => {
      expect(compare.left(1).neq.right(1)).toBe(false)
    })
  })

  describe('gt', () => {
    it('should compare numbers correctly', () => {
      expect(compare.left(10).gt.right(5)).toBe(true)
      expect(compare.left(5).gt.right(10)).toBe(false)
      expect(compare.left(5).gt.right(5)).toBe(false)
    })

    it('should return false for non-number types', () => {
      expect(compare.left('a').gt.right('b')).toBe(false)
      expect(compare.left(true).gt.right(false)).toBe(false)
    })
  })

  describe('gte', () => {
    it('should compare numbers correctly', () => {
      expect(compare.left(10).gte.right(5)).toBe(true)
      expect(compare.left(5).gte.right(5)).toBe(true)
      expect(compare.left(4).gte.right(5)).toBe(false)
    })
  })

  describe('lt', () => {
    it('should compare numbers correctly', () => {
      expect(compare.left(5).lt.right(10)).toBe(true)
      expect(compare.left(10).lt.right(5)).toBe(false)
      expect(compare.left(5).lt.right(5)).toBe(false)
    })
  })

  describe('lte', () => {
    it('should compare numbers correctly', () => {
      expect(compare.left(5).lte.right(10)).toBe(true)
      expect(compare.left(5).lte.right(5)).toBe(true)
      expect(compare.left(6).lte.right(5)).toBe(false)
    })
  })

  describe('exists', () => {
    it('should return true for non-null/undefined values', () => {
      expect(compare.left(0).exists).toBe(true)
      expect(compare.left('').exists).toBe(true)
      expect(compare.left(false).exists).toBe(true)
    })

    it('should return false for null or undefined', () => {
      expect(compare.left(null).exists).toBe(false)
      expect(compare.left(undefined).exists).toBe(false)
    })
  })

  describe('function value sources', () => {
    it('should execute functions to get values', () => {
      expect(compare.left(() => 42).eq.right(() => 42)).toBe(true)
      expect(compare.left(() => 10).gt.right(() => 5)).toBe(true)
    })

    it('should support mixed function and literal', () => {
      expect(compare.left(() => 'hello').eq.right('hello')).toBe(true)
      expect(compare.left(100).gt.right(() => 50)).toBe(true)
    })

    it('should execute function for exists check', () => {
      expect(compare.left(() => 'value').exists).toBe(true)
      expect(compare.left(() => null).exists).toBe(false)
    })
  })
})
