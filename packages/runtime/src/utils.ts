/**
 * Get a nested value from an object by dot-notation path
 *
 * @internal
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Resolver function for `$ref` references in action / condition / expression trees.
 * Receives the ref string (e.g. `"inp.value"`) and returns the resolved value.
 * Return `undefined` if the ref cannot be resolved.
 */
export type RefResolver = (ref: string) => unknown

/**
 * Recursively walk a value tree and replace every `{ $ref: '...' }` object
 * with the resolved value from `resolver`. Other shapes (primitives, arrays,
 * plain objects) are walked and copied.
 *
 * - `null` / primitives → returned as-is
 * - `Array` → every element resolved
 * - `{ $ref: string }` → `resolver(ref)` (no further recursion)
 * - Plain object → every property resolved recursively
 *
 * When `resolver` is `undefined` the input is returned unchanged (legacy
 * behaviour where `$ref` is not recognised).
 */
export function resolveRefsDeep<T>(value: T, resolver?: RefResolver): T {
  if (resolver == null)
    return value
  if (value === null || value === undefined)
    return value
  if (typeof value !== 'object')
    return value

  if (Array.isArray(value)) {
    return value.map(v => resolveRefsDeep(v, resolver)) as unknown as T
  }

  const obj = value as Record<string, unknown>
  if (typeof obj.$ref === 'string') {
    return resolver(obj.$ref) as T
  }

  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = resolveRefsDeep(v, resolver)
  }
  return out as T
}
