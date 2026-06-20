import type { Action, ActionIf, ActionNode, ActionParallel, ActionSequence, ActionTryCatch } from '@triggerix/core'
import type { ActionRegistry } from './actionRegistry'
import type { FunctionRegistry } from './expressionEvaluator'
import type { RuntimeContext } from './types'
import type { RefResolver } from './utils'
import { evaluateConditions } from './conditionEvaluator'
import { resolveRefsDeep } from './utils'

/**
 * Execute an ActionNode (dispatches to appropriate executor)
 */
export async function executeActionNode(
  node: ActionNode,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  const n = node as unknown as Record<string, unknown>

  switch (n.type) {
    case 'sequence':
      await executeSequence(node as ActionSequence, context, actionRegistry, functions, refResolver)
      break
    case 'parallel':
      await executeParallel(node as ActionParallel, context, actionRegistry, functions, refResolver)
      break
    case 'tryCatch':
      await executeTryCatch(node as ActionTryCatch, context, actionRegistry, functions, refResolver)
      break
    case 'if':
      await executeIf(node as ActionIf, context, actionRegistry, functions, refResolver)
      break
    default:
      // Regular Action — resolve $ref in params before dispatch
      await executeAction(node as Action, actionRegistry, refResolver)
      break
  }
}

/**
 * Execute a regular Action
 *
 * Resolves every `$ref` in `action.params` via the supplied `refResolver`
 * before invoking the registered handler. When no resolver is provided the
 * raw params are forwarded (legacy behaviour).
 */
async function executeAction(
  action: Action,
  actionRegistry: ActionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  const resolvedParams = resolveRefsDeep(action.params ?? {}, refResolver) as Record<string, unknown>
  await actionRegistry.execute(action.type, resolvedParams as never)
}

/**
 * Execute actions sequentially
 */
async function executeSequence(
  node: ActionSequence,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  for (const action of node.actions) {
    await executeActionNode(action, context, actionRegistry, functions, refResolver)
  }
}

/**
 * Execute actions in parallel
 */
async function executeParallel(
  node: ActionParallel,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  await Promise.all(
    node.actions.map(action => executeActionNode(action, context, actionRegistry, functions, refResolver))
  )
}

/**
 * Execute with try/catch/finally error handling
 */
async function executeTryCatch(
  node: ActionTryCatch,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  try {
    for (const action of node.try) {
      await executeActionNode(action, context, actionRegistry, functions, refResolver)
    }
  }
  catch {
    if (node.catch) {
      for (const action of node.catch) {
        await executeActionNode(action, context, actionRegistry, functions, refResolver)
      }
    }
  }
  finally {
    if (node.finally) {
      for (const action of node.finally) {
        await executeActionNode(action, context, actionRegistry, functions, refResolver)
      }
    }
  }
}

/**
 * Execute conditional branch.
 * `ActionIf.condition` uses the same flat array shape as `Trigger.conditions`,
 * but evaluation is plain implicit AND (no 3-stage prioritization).
 */
async function executeIf(
  node: ActionIf,
  context: RuntimeContext,
  actionRegistry: ActionRegistry,
  functions: FunctionRegistry,
  refResolver?: RefResolver
): Promise<void> {
  const passed = evaluateConditions(node.condition, context, functions)

  if (passed) {
    for (const action of node.then) {
      await executeActionNode(action, context, actionRegistry, functions, refResolver)
    }
  }
  else if (node.else) {
    for (const action of node.else) {
      await executeActionNode(action, context, actionRegistry, functions, refResolver)
    }
  }
}
