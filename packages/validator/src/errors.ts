/**
 * Validation error types
 */
export interface ValidationError {
  path: string
  message: string
  type: 'structural' | 'semantic'
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

/**
 * Create a successful validation result
 */
export function validResult(): ValidationResult {
  return { valid: true, errors: [] }
}

/**
 * Create a failed validation result
 */
export function invalidResult(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors }
}

/**
 * Create a validation error
 */
export function createError(path: string, message: string, type: 'structural' | 'semantic' = 'structural'): ValidationError {
  return { path, message, type }
}
