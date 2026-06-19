import {
  defineAction,
  defineCondition,
  defineConditionGroup,
  defineEvent,
  defineTrigger
} from '@triggerix/schema'
import { describe, expect, it } from 'vitest'
import {
  validAction,
  validCondition,
  validConditionGroup,
  validEvent,
  validTrigger
} from '../common/fixtures'

describe('define helpers', () => {
  it('defineEvent returns the input as-is', () => {
    expect(defineEvent(validEvent)).toBe(validEvent)
  })

  it('defineCondition returns the input as-is', () => {
    expect(defineCondition(validCondition)).toBe(validCondition)
  })

  it('defineConditionGroup returns the input as-is', () => {
    expect(defineConditionGroup(validConditionGroup)).toBe(validConditionGroup)
  })

  it('defineAction returns the input as-is', () => {
    expect(defineAction(validAction)).toBe(validAction)
  })

  it('defineTrigger returns the input as-is', () => {
    expect(defineTrigger(validTrigger)).toBe(validTrigger)
  })
})
