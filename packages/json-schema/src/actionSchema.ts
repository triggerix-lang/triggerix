import type { JSONSchema } from './types'
import { generateValueSchema } from './valueSchema'

/**
 * Generate JSON Schema for Action
 */
export function generateActionSchema(): JSONSchema {
  return {
    type: 'object',
    title: 'Action',
    description: 'Describes what to execute',
    properties: {
      type: {
        type: 'string',
        description: 'Action type identifier'
      },
      params: {
        type: 'object',
        description: 'Action parameters',
        additionalProperties: generateValueSchema()
      }
    },
    required: ['type'],
    additionalProperties: false
  }
}
