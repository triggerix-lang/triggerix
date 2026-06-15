/**
 * JSON Schema definition (simplified for our use case)
 */
export interface JSONSchema {
  $schema?: string
  $id?: string
  title?: string
  description?: string
  type?: string | string[]
  properties?: Record<string, JSONSchema>
  items?: JSONSchema
  required?: string[]
  enum?: unknown[]
  oneOf?: JSONSchema[]
  anyOf?: JSONSchema[]
  allOf?: JSONSchema[]
  $ref?: string
  definitions?: Record<string, JSONSchema>
  additionalProperties?: boolean | JSONSchema
  minItems?: number
  pattern?: string
  const?: unknown
}
