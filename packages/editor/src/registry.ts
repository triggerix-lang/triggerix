import type { ActionDef, ConditionDef, EventDef, ToolDef } from './types'

export class Registry {
  private events = new Map<string, EventDef>()
  private actions = new Map<string, ActionDef>()
  private conditions = new Map<string, ConditionDef>()
  private tools = new Map<string, ToolDef>()

  registerEvent(def: EventDef): void {
    this.events.set(def.type, def)
  }

  registerAction(def: ActionDef): void {
    this.actions.set(def.type, def)
  }

  registerCondition(def: ConditionDef): void {
    this.conditions.set(def.type, def)
  }

  registerTool(name: string, def: ToolDef): void {
    this.tools.set(name, def)
  }

  getEvent(type: string): EventDef | undefined {
    return this.events.get(type)
  }

  getAction(type: string): ActionDef | undefined {
    return this.actions.get(type)
  }

  getCondition(type: string): ConditionDef | undefined {
    return this.conditions.get(type)
  }

  getTool(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  getEvents(): EventDef[] {
    return Array.from(this.events.values())
  }

  getActions(): ActionDef[] {
    return Array.from(this.actions.values())
  }

  getConditions(): ConditionDef[] {
    return Array.from(this.conditions.values())
  }

  getTools(): Map<string, ToolDef> {
    return new Map(this.tools)
  }
}
