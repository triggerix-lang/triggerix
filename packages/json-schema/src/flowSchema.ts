import type { JSONSchema } from './types'

/**
 * Generate JSON Schema for ActionNode (Action | Flow nodes)
 */
export function generateActionNodeSchema(): JSONSchema {
  return {
    oneOf: [
      { $ref: '#/definitions/Action' },
      { $ref: '#/definitions/ActionSequence' },
      { $ref: '#/definitions/ActionParallel' },
      { $ref: '#/definitions/ActionTryCatch' },
      { $ref: '#/definitions/ActionIf' }
    ]
  }
}

/**
 * Generate JSON Schema for ActionSequence
 */
export function generateActionSequenceSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'sequence' },
      actions: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' },
        minItems: 1
      }
    },
    required: ['type', 'actions'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ActionParallel
 */
export function generateActionParallelSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'parallel' },
      actions: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' },
        minItems: 1
      }
    },
    required: ['type', 'actions'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ActionTryCatch
 */
export function generateActionTryCatchSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'tryCatch' },
      try: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' },
        minItems: 1
      },
      catch: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' }
      },
      finally: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' }
      }
    },
    required: ['type', 'try'],
    additionalProperties: false
  }
}

/**
 * Generate JSON Schema for ActionIf
 */
export function generateActionIfSchema(): JSONSchema {
  return {
    type: 'object',
    properties: {
      type: { const: 'if' },
      condition: {
        oneOf: [
          { $ref: '#/definitions/Condition' },
          { $ref: '#/definitions/ConditionGroup' }
        ]
      },
      then: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' },
        minItems: 1
      },
      else: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' }
      }
    },
    required: ['type', 'condition', 'then'],
    additionalProperties: false
  }
}
