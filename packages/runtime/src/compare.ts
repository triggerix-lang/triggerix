/**
 * Fluent comparison builder for runtime condition evaluation.
 * Resolves value sources (literal or function) immediately and returns boolean.
 */

type ValueSource = unknown | (() => unknown)

export interface CompareRight {
  right: (value: ValueSource) => boolean
}

export interface CompareOperators {
  eq: CompareRight
  neq: CompareRight
  gt: CompareRight
  gte: CompareRight
  lt: CompareRight
  lte: CompareRight
  readonly exists: boolean
}

export interface CompareBuilder {
  left: (value: ValueSource) => CompareOperators
}

function resolveSource(source: ValueSource): unknown {
  return typeof source === 'function' ? (source as () => unknown)() : source
}

export const compare: CompareBuilder = {
  left(leftSource: ValueSource): CompareOperators {
    const l = resolveSource(leftSource)
    const op = (operator: string): CompareRight => ({
      right: (rightSource: ValueSource): boolean => {
        const r = resolveSource(rightSource)
        switch (operator) {
          case 'eq': return l === r
          case 'neq': return l !== r
          case 'gt': return typeof l === 'number' && typeof r === 'number' && l > r
          case 'gte': return typeof l === 'number' && typeof r === 'number' && l >= r
          case 'lt': return typeof l === 'number' && typeof r === 'number' && l < r
          case 'lte': return typeof l === 'number' && typeof r === 'number' && l <= r
          default: return false
        }
      }
    })
    return {
      eq: op('eq'),
      neq: op('neq'),
      gt: op('gt'),
      gte: op('gte'),
      lt: op('lt'),
      lte: op('lte'),
      get exists(): boolean { return l !== undefined && l !== null }
    }
  }
}
