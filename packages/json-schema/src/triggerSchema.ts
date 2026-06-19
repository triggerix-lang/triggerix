import type { JSONSchema } from './types'
import { generateActionSchema } from './actionSchema'
import { generateConditionGroupSchema, generateConditionSchema } from './conditionSchema'
import { generateEventSchema } from './eventSchema'
import {
  generateExprBinarySchema,
  generateExprCallSchema,
  generateExprCompareSchema,
  generateExprConcatSchema,
  generateExpressionSchema,
  generateExprLogicalSchema,
  generateExprNodeSchema,
  generateExprOperandSchema,
  generateExprTernarySchema,
  generateExprUnarySchema
} from './expressionSchema'
import {
  generateActionIfSchema,
  generateActionNodeSchema,
  generateActionParallelSchema,
  generateActionSequenceSchema,
  generateActionTryCatchSchema
} from './flowSchema'
import { generateValueSchema } from './valueSchema'

/**
 * Generate the complete JSON Schema for a Triggerix Trigger
 */
export function generateTriggerSchema(): JSONSchema {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: 'https://triggerix.dev/schema/trigger.json',
    title: 'Triggerix Trigger',
    description: 'A language-agnostic ECA trigger: Event → Condition → Action',
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique trigger identifier'
      },
      name: {
        type: 'string',
        description: 'Human-readable trigger name'
      },
      event: { $ref: '#/definitions/Event' },
      conditions: { $ref: '#/definitions/ConditionGroup' },
      actions: {
        type: 'array',
        items: { $ref: '#/definitions/ActionNode' },
        minItems: 1
      }
    },
    required: ['id', 'event', 'actions'],
    additionalProperties: false,
    definitions: {
      Event: generateEventSchema(),
      Condition: generateConditionSchema(),
      ConditionGroup: generateConditionGroupSchema(),
      Action: generateActionSchema(),
      ActionNode: generateActionNodeSchema(),
      ActionSequence: generateActionSequenceSchema(),
      ActionParallel: generateActionParallelSchema(),
      ActionTryCatch: generateActionTryCatchSchema(),
      ActionIf: generateActionIfSchema(),
      Value: generateValueSchema(),
      Expression: generateExpressionSchema(),
      ExprNode: generateExprNodeSchema(),
      ExprOperand: generateExprOperandSchema(),
      ExprBinary: generateExprBinarySchema(),
      ExprUnary: generateExprUnarySchema(),
      ExprCompare: generateExprCompareSchema(),
      ExprLogical: generateExprLogicalSchema(),
      ExprCall: generateExprCallSchema(),
      ExprConcat: generateExprConcatSchema(),
      ExprTernary: generateExprTernarySchema()
    }
  }
}
