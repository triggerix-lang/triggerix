/**
 * Operator types for condition evaluation
 */
export type Operator
  = | 'eq'
    | 'neq'
    | 'gt'
    | 'gte'
    | 'lt'
    | 'lte'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'exists'

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
  type: 'and' | 'or' | 'not'
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
 * Rule - the top-level construct
 * Event → Condition → Action
 */
export interface Rule {
  id: string
  name?: string
  event: Event
  conditions?: ConditionGroup
  actions: ActionNode[]
}

// Expression System - dynamic computation nodes

/** 表达式操作数 = 字面量 | 引用 | 表达式节点 */
export type ExprOperand = Literal | Reference | ExprNode

/** 二元算术运算 */
export interface ExprBinary {
  type: 'binary'
  operator: '+' | '-' | '*' | '/' | '%'
  left: ExprOperand
  right: ExprOperand
}

/** 一元运算 */
export interface ExprUnary {
  type: 'unary'
  operator: '-' | '!'
  operand: ExprOperand
}

/** 比较运算 */
export interface ExprCompare {
  type: 'compare'
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
  left: ExprOperand
  right: ExprOperand
}

/** 逻辑组合 */
export interface ExprLogical {
  type: 'logical'
  operator: 'and' | 'or' | 'not'
  operands: ExprOperand[]
}

/** 函数调用 */
export interface ExprCall {
  type: 'call'
  name: string
  args: ExprOperand[]
}

/** 字符串拼接 */
export interface ExprConcat {
  type: 'concat'
  values: ExprOperand[]
}

/** 三元条件 */
export interface ExprTernary {
  type: 'ternary'
  test: ExprOperand
  consequent: ExprOperand
  alternate: ExprOperand
}

/** 所有表达式节点的联合类型 */
export type ExprNode
  = | ExprBinary
    | ExprUnary
    | ExprCompare
    | ExprLogical
    | ExprCall
    | ExprConcat
    | ExprTernary

/** Expression 包装器 */
export interface Expression {
  $expr: ExprNode
}

// Flow Control - composite action nodes

/** 顺序执行 */
export interface ActionSequence {
  type: 'sequence'
  actions: ActionNode[]
}

/** 并行执行 */
export interface ActionParallel {
  type: 'parallel'
  actions: ActionNode[]
}

/** 错误处理 */
export interface ActionTryCatch {
  type: 'tryCatch'
  try: ActionNode[]
  catch?: ActionNode[]
  finally?: ActionNode[]
}

/** 条件分支 */
export interface ActionIf {
  type: 'if'
  condition: Condition | ConditionGroup
  then: ActionNode[]
  else?: ActionNode[]
}

/** 动作节点 = 普通动作 | 流程控制节点 */
export type ActionNode
  = | Action
    | ActionSequence
    | ActionParallel
    | ActionTryCatch
    | ActionIf
