import type { JSONSchema } from './types'

/**
 * Generate JSON Schema for the Value type (Literal | Reference)
 */
export function generateValueSchema(): JSONSchema {
  return {
    oneOf: [
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
      {
        type: 'object',
        properties: {
          $ref: { type: 'string' }
        },
        required: ['$ref'],
        additionalProperties: false
      },
      { $ref: '#/definitions/Expression' }
    ]
  }
}
