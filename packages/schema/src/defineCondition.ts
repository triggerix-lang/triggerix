import type { Condition, ConditionGroup } from '@triggerix/core'

/**
 * Define a single condition
 */
export function defineCondition(condition: Condition): Condition {
  return condition
}

/**
 * Define a condition group (AND / OR / NOT)
 */
export function defineConditionGroup(group: ConditionGroup): ConditionGroup {
  return group
}
