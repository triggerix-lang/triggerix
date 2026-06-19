import { generateTriggerSchema } from '@triggerix/json-schema'
import { describe, expect, it } from 'vitest'

describe('generateTriggerSchema', () => {
  const schema = generateTriggerSchema()

  describe('top-level metadata', () => {
    it('should include $schema field', () => {
      expect(schema.$schema).toBe('http://json-schema.org/draft-07/schema#')
    })

    it('should include $id field', () => {
      expect(schema.$id).toBe('https://triggerix.dev/schema/trigger.json')
    })

    it('should include title field', () => {
      expect(schema.title).toBe('Triggerix Trigger')
    })

    it('should include description field', () => {
      expect(typeof schema.description).toBe('string')
      expect((schema.description as string).length).toBeGreaterThan(0)
    })

    it('should declare type as object', () => {
      expect(schema.type).toBe('object')
    })

    it('should set additionalProperties to false', () => {
      expect(schema.additionalProperties).toBe(false)
    })
  })

  describe('properties', () => {
    it('should contain id, name, event, conditions, actions', () => {
      const properties = schema.properties as Record<string, unknown>
      expect(properties).toBeDefined()
      expect(properties.id).toBeDefined()
      expect(properties.name).toBeDefined()
      expect(properties.event).toBeDefined()
      expect(properties.conditions).toBeDefined()
      expect(properties.actions).toBeDefined()
    })
  })

  describe('required', () => {
    it('should require id, event, and actions', () => {
      expect(schema.required).toEqual(['id', 'event', 'actions'])
    })
  })

  describe('definitions', () => {
    const expectedKeys = [
      'Event',
      'Condition',
      'ConditionGroup',
      'Action',
      'ActionNode',
      'ActionSequence',
      'ActionParallel',
      'ActionTryCatch',
      'ActionIf',
      'Value',
      'Expression',
      'ExprNode',
      'ExprOperand',
      'ExprBinary',
      'ExprUnary',
      'ExprCompare',
      'ExprLogical',
      'ExprCall',
      'ExprConcat',
      'ExprTernary'
    ]

    it('should contain all required definition keys', () => {
      const definitions = schema.definitions as Record<string, unknown>
      expect(definitions).toBeDefined()
      for (const key of expectedKeys) {
        expect(definitions[key]).toBeDefined()
      }
    })
  })
})
