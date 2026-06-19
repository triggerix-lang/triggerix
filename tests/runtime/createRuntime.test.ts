import type { Trigger } from '@triggerix/core'
import { createRuntime } from '@triggerix/runtime'
import { describe, expect, it, vi } from 'vitest'

describe('createRuntime - basic flow', () => {
  it('registerEvent → registerAction → addTrigger → emit invokes handler', async () => {
    const handler = vi.fn()
    const runtime = createRuntime()

    runtime.registerEvent('user.login')
    runtime.registerAction('log', handler)

    const trigger: Trigger = {
      id: 't1',
      event: { type: 'user.login' },
      actions: [{ type: 'log', params: { msg: 'hi' } }]
    }
    runtime.addTrigger(trigger)

    await runtime.emit('user.login')

    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ msg: 'hi' })
  })
})

describe('createRuntime - condition filtering', () => {
  it('does not invoke handler when condition fails', async () => {
    const handler = vi.fn()
    const runtime = createRuntime()

    runtime.registerEvent('order.created')
    runtime.registerAction('notify', handler)

    runtime.addTrigger({
      id: 't1',
      event: { type: 'order.created' },
      conditions: {
        type: 'and',
        conditions: [
          { left: { $ref: 'payload.amount' }, operator: 'gt', right: 100 }
        ]
      },
      actions: [{ type: 'notify' }]
    })

    await runtime.emit('order.created', { amount: 50 })
    expect(handler).not.toHaveBeenCalled()

    await runtime.emit('order.created', { amount: 200 })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('createRuntime - removeTrigger', () => {
  it('removed trigger is no longer triggered', async () => {
    const handler = vi.fn()
    const runtime = createRuntime()

    runtime.registerEvent('e')
    runtime.registerAction('a', handler)

    runtime.addTrigger({
      id: 't1',
      event: { type: 'e' },
      actions: [{ type: 'a' }]
    })

    await runtime.emit('e')
    expect(handler).toHaveBeenCalledTimes(1)

    runtime.removeTrigger('t1')
    await runtime.emit('e')
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('createRuntime - listEvents / listActions / listTriggers', () => {
  it('lists registered events, actions and triggers', () => {
    const runtime = createRuntime()

    runtime.registerEvent('e1')
    runtime.registerEvent('e2')
    runtime.registerAction('a1', vi.fn())
    runtime.registerAction('a2', vi.fn())

    const trigger: Trigger = {
      id: 't1',
      event: { type: 'e1' },
      actions: [{ type: 'a1' }]
    }
    runtime.addTrigger(trigger)

    expect(runtime.listEvents()).toEqual(expect.arrayContaining(['e1', 'e2']))
    expect(runtime.listActions()).toEqual(expect.arrayContaining(['a1', 'a2']))
    expect(runtime.listTriggers()).toHaveLength(1)
    expect(runtime.listTriggers()[0].id).toBe('t1')
  })
})

describe('createRuntime - registerFunction', () => {
  it('registered function can be used in expressions', async () => {
    const handler = vi.fn()
    const runtime = createRuntime()

    runtime.registerEvent('e')
    runtime.registerAction('a', handler)
    runtime.registerFunction('greaterThan10', (n: unknown) => (n as number) > 10)

    runtime.addTrigger({
      id: 't1',
      event: { type: 'e' },
      conditions: {
        type: 'and',
        conditions: [
          {
            left: {
              $expr: {
                type: 'call',
                name: 'greaterThan10',
                args: [{ $ref: 'payload.n' }]
              }
            },
            operator: 'eq',
            right: true
          }
        ]
      },
      actions: [{ type: 'a' }]
    })

    await runtime.emit('e', { n: 5 })
    expect(handler).not.toHaveBeenCalled()

    await runtime.emit('e', { n: 20 })
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

describe('createRuntime - continueOnError', () => {
  it('continueOnError=true: subsequent actions still run after a failure', async () => {
    const failing = vi.fn(() => {
      throw new Error('boom')
    })
    const after = vi.fn()

    const runtime = createRuntime({ continueOnError: true })
    runtime.registerEvent('e')
    runtime.registerAction('fail', failing)
    runtime.registerAction('after', after)

    runtime.addTrigger({
      id: 't1',
      event: { type: 'e' },
      actions: [{ type: 'fail' }, { type: 'after' }]
    })

    await runtime.emit('e')

    expect(failing).toHaveBeenCalledTimes(1)
    expect(after).toHaveBeenCalledTimes(1)
  })

  it('continueOnError=false (default): a failing action throws and stops execution', async () => {
    const failing = vi.fn(() => {
      throw new Error('boom')
    })
    const after = vi.fn()

    const runtime = createRuntime()
    runtime.registerEvent('e')
    runtime.registerAction('fail', failing)
    runtime.registerAction('after', after)

    runtime.addTrigger({
      id: 't1',
      event: { type: 'e' },
      actions: [{ type: 'fail' }, { type: 'after' }]
    })

    await expect(runtime.emit('e')).rejects.toThrow('boom')
    expect(failing).toHaveBeenCalledTimes(1)
    expect(after).not.toHaveBeenCalled()
  })
})
