/**
 * Valid operators for Condition evaluation (single source of truth)
 */
export const VALID_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'exists'] as const

/**
 * Binary arithmetic operators
 */
export const BINARY_OPERATORS = ['+', '-', '*', '/', '%'] as const

/**
 * Unary operators
 */
export const UNARY_OPERATORS = ['-', '!'] as const

/**
 * Compare operators (subset of VALID_OPERATORS, excluding 'exists')
 */
export const COMPARE_OPERATORS = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'] as const

/**
 * Logical operators / ConditionGroup types
 */
export const LOGICAL_OPERATORS = ['and', 'or', 'not'] as const

/**
 * Condition group types (alias of LOGICAL_OPERATORS for clarity)
 */
export const CONDITION_GROUP_TYPES = LOGICAL_OPERATORS

/**
 * Operator types for condition evaluation
 */
export type Operator = typeof VALID_OPERATORS[number]

/**
 * Binary arithmetic operator type
 */
export type BinaryOp = typeof BINARY_OPERATORS[number]

/**
 * Unary operator type
 */
export type UnaryOp = typeof UNARY_OPERATORS[number]

/**
 * Compare operator type
 */
export type CompareOp = typeof COMPARE_OPERATORS[number]

/**
 * Logical operator type
 */
export type LogicalOp = typeof LOGICAL_OPERATORS[number]

/**
 * Literal value - primitive types
 */
export type Literal = string | number | boolean

/**
 * Reference value - points to a dynamic value
 */
export interface Reference {
  $ref: string
}

/**
 * Value can be a literal, a reference, or an expression
 */
export type Value = Literal | Reference | Expression

/**
 * Event - describes WHEN to trigger
 */
export interface Event {
  type: string
  source?: string
  payload?: Record<string, unknown>
}

/**
 * Condition - describes a single comparison
 */
export interface Condition {
  left: Value
  operator: Operator
  right?: Value
}

/**
 * ConditionGroup - logical grouping of conditions
 * Supports AND, OR, NOT
 */
export interface ConditionGroup {
  type: LogicalOp
  conditions: Array<Condition | ConditionGroup>
}

/**
 * Action - describes WHAT to execute
 */
export interface Action {
  type: string
  params?: Record<string, Value>
}

/**
 * Trigger - the top-level construct
 * Event → Condition → Action
 */
export interface Trigger {
  id: string
  name?: string
  event: Event
  conditions?: ConditionGroup
  actions: ActionNode[]
}

// Expression System - dynamic computation nodes

/** Expression operand */
export type ExprOperand = Literal | Reference | ExprNode

/** Binary arithmetic expression */
export interface ExprBinary {
  type: 'binary'
  operator: BinaryOp
  left: ExprOperand
  right: ExprOperand
}

/** Unary expression */
export interface ExprUnary {
  type: 'unary'
  operator: UnaryOp
  operand: ExprOperand
}

/** Comparison expression */
export interface ExprCompare {
  type: 'compare'
  operator: CompareOp
  left: ExprOperand
  right: ExprOperand
}

/** Logical expression */
export interface ExprLogical {
  type: 'logical'
  operator: LogicalOp
  operands: ExprOperand[]
}

/** Function call expression */
export interface ExprCall {
  type: 'call'
  name: string
  args: ExprOperand[]
}

/** String concatenation */
export interface ExprConcat {
  type: 'concat'
  values: ExprOperand[]
}

/** Ternary expression */
export interface ExprTernary {
  type: 'ternary'
  test: ExprOperand
  consequent: ExprOperand
  alternate: ExprOperand
}

/** Union of all expression nodes */
export type ExprNode
  = | ExprBinary
    | ExprUnary
    | ExprCompare
    | ExprLogical
    | ExprCall
    | ExprConcat
    | ExprTernary

/** Expression wrapper */
export interface Expression {
  $expr: ExprNode
}

// Flow Control - composite action nodes

/** Sequential execution */
export interface ActionSequence {
  type: 'sequence'
  actions: ActionNode[]
}

/** Parallel execution */
export interface ActionParallel {
  type: 'parallel'
  actions: ActionNode[]
}

/** Try-catch error handling */
export interface ActionTryCatch {
  type: 'tryCatch'
  try: ActionNode[]
  catch?: ActionNode[]
  finally?: ActionNode[]
}

/** Conditional branching */
export interface ActionIf {
  type: 'if'
  condition: Condition | ConditionGroup
  then: ActionNode[]
  else?: ActionNode[]
}

/** Action node union */
export type ActionNode
  = | Action
    | ActionSequence
    | ActionParallel
    | ActionTryCatch
    | ActionIf

// Type Guards

/**
 * Type guard: check if a value is a ConditionGroup
 */
export function isConditionGroup(value: unknown): value is ConditionGroup {
  return value !== null && value !== undefined && typeof value === 'object' && 'type' in value
    && ['and', 'or', 'not'].includes((value as Record<string, unknown>).type as string)
}
