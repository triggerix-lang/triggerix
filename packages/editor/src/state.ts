/**
 * Slot value entry - tracks which tool is used and the value(s)
 */
export interface SlotValueEntry {
  /** Which tool the user selected for this slot */
  tool: string | null
  /** The input value (for leaf tools) or sub-slot values (for composite tools) */
  value: unknown
  /** Sub-slot values when tool is composite */
  subSlots?: Record<string, SlotValueEntry>
}

/**
 * State for a single event/action/condition in the editor
 */
export interface ItemState {
  type: string
  slotValues: Record<string, SlotValueEntry>
}

/**
 * Full editor state
 */
export interface EditorState {
  event: ItemState | null
  conditions: ItemState[]
  actions: ItemState[]
}

export type ChangeListener = (state: EditorState) => void

/**
 * State manager for the editor
 */
export class EditorStateManager {
  private state: EditorState = {
    event: null,
    conditions: [],
    actions: []
  }

  private listeners: Set<ChangeListener> = new Set()

  getState(): EditorState {
    return this.state
  }

  // === Event ===

  setEvent(type: string): void {
    this.state.event = { type, slotValues: {} }
    this.notify()
  }

  clearEvent(): void {
    this.state.event = null
    this.notify()
  }

  setEventSlot(key: string, entry: SlotValueEntry): void {
    if (!this.state.event)
      return
    this.state.event.slotValues[key] = entry
    this.notify()
  }

  // === Actions ===

  addAction(type: string): void {
    this.state.actions.push({ type, slotValues: {} })
    this.notify()
  }

  removeAction(index: number): void {
    this.state.actions.splice(index, 1)
    this.notify()
  }

  moveAction(from: number, to: number): void {
    const [item] = this.state.actions.splice(from, 1)
    if (item) {
      this.state.actions.splice(to, 0, item)
      this.notify()
    }
  }

  setActionSlot(actionIndex: number, key: string, entry: SlotValueEntry): void {
    const action = this.state.actions[actionIndex]
    if (!action)
      return
    action.slotValues[key] = entry
    this.notify()
  }

  // === Conditions ===

  addCondition(type: string): void {
    this.state.conditions.push({ type, slotValues: {} })
    this.notify()
  }

  removeCondition(index: number): void {
    this.state.conditions.splice(index, 1)
    this.notify()
  }

  setConditionSlot(conditionIndex: number, key: string, entry: SlotValueEntry): void {
    const condition = this.state.conditions[conditionIndex]
    if (!condition)
      return
    condition.slotValues[key] = entry
    this.notify()
  }

  // === Subscriptions ===

  onChange(listener: ChangeListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  // === Reset ===

  reset(): void {
    this.state = { event: null, conditions: [], actions: [] }
    this.notify()
  }

  loadState(state: EditorState): void {
    this.state = state
    this.notify()
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}
