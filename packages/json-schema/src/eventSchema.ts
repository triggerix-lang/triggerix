import type { JSONSchema } from './types'

/**
 * Generate JSON Schema for Event
 */
export function generateEventSchema(): JSONSchema {
  return {
    type: 'object',
    title: 'Event',
    description: 'Describes when to trigger',
    properties: {
      type: {
        type: 'string',
        description: 'Event type identifier'
      },
      source: {
        type: 'string',
        description: 'Event source identifier'
      },
      payload: {
        type: 'object',
        description: 'Additional event data',
        additionalProperties: true
      }
    },
    required: ['type'],
    additionalProperties: false
  }
}
