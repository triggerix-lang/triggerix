import { BaseRegistry } from '@triggerix/registry'
import { describe, expect, it } from 'vitest'

describe('baseRegistry', () => {
  describe('events', () => {
    it('should register and retrieve an event by type', () => {
      const registry = new BaseRegistry()
      const def = { id: 'click', label: 'Click Event' }
      registry.registerEvent(def)
      expect(registry.getEvent('click')).toEqual(def)
    })

    it('should return undefined for unknown event type', () => {
      const registry = new BaseRegistry()
      expect(registry.getEvent('unknown')).toBeUndefined()
    })

    it('should return all registered events', () => {
      const registry = new BaseRegistry()
      const def1 = { id: 'click', label: 'Click' }
      const def2 = { id: 'hover', label: 'Hover' }
      registry.registerEvent(def1)
      registry.registerEvent(def2)
      const events = registry.getEvents()
      expect(events).toHaveLength(2)
      expect(events).toContainEqual(def1)
      expect(events).toContainEqual(def2)
    })

    it('should override previous registration when registering with same type', () => {
      const registry = new BaseRegistry()
      registry.registerEvent({ id: 'click', label: 'Old' })
      registry.registerEvent({ id: 'click', label: 'New' })
      expect(registry.getEvent('click')).toEqual({ id: 'click', label: 'New' })
      expect(registry.getEvents()).toHaveLength(1)
    })
  })

  describe('actions', () => {
    it('should register and retrieve an action by type', () => {
      const registry = new BaseRegistry()
      const def = { id: 'log', label: 'Log Action' }
      registry.registerAction(def)
      expect(registry.getAction('log')).toEqual(def)
    })

    it('should return undefined for unknown action type', () => {
      const registry = new BaseRegistry()
      expect(registry.getAction('missing')).toBeUndefined()
    })

    it('should return all registered actions', () => {
      const registry = new BaseRegistry()
      const a = { id: 'log', label: 'Log' }
      const b = { id: 'alert', label: 'Alert' }
      registry.registerAction(a)
      registry.registerAction(b)
      const actions = registry.getActions()
      expect(actions).toHaveLength(2)
      expect(actions).toContainEqual(a)
      expect(actions).toContainEqual(b)
    })

    it('should override previous registration when registering with same type', () => {
      const registry = new BaseRegistry()
      registry.registerAction({ id: 'log', label: 'V1' })
      registry.registerAction({ id: 'log', label: 'V2' })
      expect(registry.getAction('log')).toEqual({ id: 'log', label: 'V2' })
      expect(registry.getActions()).toHaveLength(1)
    })
  })

  describe('conditions', () => {
    it('should register and retrieve a condition by type', () => {
      const registry = new BaseRegistry()
      const def = { id: 'eq', label: 'Equals' }
      registry.registerCondition(def)
      expect(registry.getCondition('eq')).toEqual(def)
    })

    it('should return undefined for unknown condition type', () => {
      const registry = new BaseRegistry()
      expect(registry.getCondition('none')).toBeUndefined()
    })

    it('should return all registered conditions', () => {
      const registry = new BaseRegistry()
      const c1 = { id: 'eq', label: 'Equals' }
      const c2 = { id: 'gt', label: 'Greater Than' }
      registry.registerCondition(c1)
      registry.registerCondition(c2)
      const conditions = registry.getConditions()
      expect(conditions).toHaveLength(2)
      expect(conditions).toContainEqual(c1)
      expect(conditions).toContainEqual(c2)
    })

    it('should override previous registration when registering with same type', () => {
      const registry = new BaseRegistry()
      registry.registerCondition({ id: 'eq', label: 'Old' })
      registry.registerCondition({ id: 'eq', label: 'New' })
      expect(registry.getCondition('eq')).toEqual({ id: 'eq', label: 'New' })
      expect(registry.getConditions()).toHaveLength(1)
    })
  })

  describe('isolation', () => {
    it('should keep events, actions, and conditions independent', () => {
      const registry = new BaseRegistry()
      registry.registerEvent({ id: 'shared', label: 'Event' })
      registry.registerAction({ id: 'shared', label: 'Action' })
      registry.registerCondition({ id: 'shared', label: 'Condition' })

      expect(registry.getEvent('shared')).toEqual({ id: 'shared', label: 'Event' })
      expect(registry.getAction('shared')).toEqual({ id: 'shared', label: 'Action' })
      expect(registry.getCondition('shared')).toEqual({ id: 'shared', label: 'Condition' })
    })
  })
})
