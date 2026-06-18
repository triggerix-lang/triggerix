import type { BaseItemDef } from './types'

/**
 * Type-safe registry for event/action/condition definitions.
 */
export class BaseRegistry<
  TEventDef extends BaseItemDef = BaseItemDef,
  TActionDef extends BaseItemDef = BaseItemDef,
  TConditionDef extends BaseItemDef = BaseItemDef
> {
  protected events = new Map<string, TEventDef>()
  protected actions = new Map<string, TActionDef>()
  protected conditions = new Map<string, TConditionDef>()

  registerEvent(def: TEventDef): void {
    this.events.set(def.id, def)
  }

  registerAction(def: TActionDef): void {
    this.actions.set(def.id, def)
  }

  registerCondition(def: TConditionDef): void {
    this.conditions.set(def.id, def)
  }

  getEvent(id: string): TEventDef | undefined {
    return this.events.get(id)
  }

  getAction(id: string): TActionDef | undefined {
    return this.actions.get(id)
  }

  getCondition(id: string): TConditionDef | undefined {
    return this.conditions.get(id)
  }

  getEvents(): TEventDef[] {
    return [...this.events.values()]
  }

  getActions(): TActionDef[] {
    return [...this.actions.values()]
  }

  getConditions(): TConditionDef[] {
    return [...this.conditions.values()]
  }
}
