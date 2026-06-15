import type { Action, ActionIf, ActionNode, ActionParallel, ActionSequence, ActionTryCatch, Condition, ConditionGroup } from '@triggerix/core'
import type { ActionRegistry } from './actionRegistry'
import type { FunctionRegistry } from './expressionEvaluator'
import type { RuntimeContext } from './types'
import { evaluateCondition, evaluateConditionGroup } from './conditionEvaluator'

/**
 * Execute an ActionNode (dispatches to appropriate executor)
 */
export async function executeActionNode(
  node: ActionNode,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry
): Promise<void> {
  const n = node as unknown as Record<string, unknown>

  switch (n.type) {
    case 'sequence':
      await executeSequence(node as ActionSequence, context, actionRegistry, functions)
      break
    case 'parallel':
      await executeParallel(node as ActionParallel, context, actionRegistry, functions)
      break
    case 'tryCatch':
      await executeTryCatch(node as ActionTryCatch, context, actionRegistry, functions)
      break
    case 'if':
      await executeIf(node as ActionIf, context, actionRegistry, functions)
      break
    default:
      // Regular Action
      await executeAction(node as Action, actionRegistry)
      break
  }
}

/**
 * Execute a regular Action
 */
async function executeAction(action: Action, actionRegistry: ActionRegistry): Promise<void> {
  await actionRegistry.execute(action.type, action.params)
}

/**
 * Execute actions sequentially
 */
async function executeSequence(
  node: ActionSequence,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry
): Promise<void> {
  for (const action of node.actions) {
    await executeActionNode(action, context, actionRegistry, functions)
  }
}

/**
 * Execute actions in parallel
 */
async function executeParallel(
  node: ActionParallel,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry
): Promise<void> {
  await Promise.all(
    node.actions.map(action => executeActionNode(action, context, actionRegistry, functions))
  )
}

/**
 * Execute with try/catch/finally error handling
 */
async function executeTryCatch(
  node: ActionTryCatch,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry
): Promise<void> {
  try {
    for (const action of node.try) {
      await executeActionNode(action, context, actionRegistry, functions)
    }
  }
  catch {
    if (node.catch) {
      for (const action of node.catch) {
        await executeActionNode(action, context, actionRegistry, functions)
      }
    }
  }
  finally {
    if (node.finally) {
      for (const action of node.finally) {
        await executeActionNode(action, context, actionRegistry, functions)
      }
    }
  }
}

/**
 * Execute conditional branch
 */
async function executeIf(
  node: ActionIf,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry
): Promise<void> {
  let passed: boolean

  const condition = node.condition as unknown as Record<string, unknown>
  if ('type' in condition && ['and', 'or', 'not'].includes(condition.type as string)) {
    passed = evaluateConditionGroup(node.condition as ConditionGroup, context, functions)
  }
  else {
    passed = evaluateCondition(node.condition as Condition, context, functions)
  }

  if (passed) {
    for (const action of node.then) {
      await executeActionNode(action, context, actionRegistry, functions)
    }
  }
  else if (node.else) {
    for (const action of node.else) {
      await executeActionNode(action, context, actionRegistry, functions)
    }
  }
}
