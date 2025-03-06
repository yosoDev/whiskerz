import { describe, expect, it, vi } from 'vitest'

import {
  EventBus,
  EventBusPayloadError,
  EventBusUnknownEventError,
} from '../src'
import { TestEventMap, testSchemas } from './data/test-event-data'

describe('EventBus', () => {
  it('should subscribe and handle events', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)
    const messageHandler = vi.fn()

    eventBus.subscribe('message', messageHandler)

    eventBus.dispatch('message', 'Hello World')

    expect(messageHandler).toHaveBeenCalledOnce()
    expect(messageHandler).toHaveBeenCalledWith('Hello World')
  })

  it('should not call unsubscribed handlers', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)
    const messageHandler = vi.fn()

    eventBus.subscribe('message', messageHandler)
    eventBus.unsubscribe('message', messageHandler)

    eventBus.dispatch('message', 'Hello World')

    expect(messageHandler).not.toHaveBeenCalled()
  })

  it('should handle multiple subscribers', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)
    const messageHandlerOne = vi.fn()
    const messageHandlerTwo = vi.fn()

    eventBus.subscribe('message', messageHandlerOne)
    eventBus.subscribe('message', messageHandlerTwo)

    eventBus.dispatch('message', 'Hello World')

    expect(messageHandlerOne).toHaveBeenCalledOnce()
    expect(messageHandlerTwo).toHaveBeenCalledOnce()
    expect(messageHandlerOne).toHaveBeenCalledWith('Hello World')
    expect(messageHandlerTwo).toHaveBeenCalledWith('Hello World')
  })

  it('should handle no subscribers', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)

    expect(() => eventBus.dispatch('message', 'Hello World')).not.toThrow()
  })

  it('should validate payloads and throw an error', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)

    expect(() =>
      eventBus.dispatch('message', 123 as unknown as string),
    ).toThrowError(EventBusPayloadError)
  })

  it('should handle unknown events and throw an error', async () => {
    const eventBus = new EventBus<TestEventMap>(testSchemas)

    expect(() =>
      eventBus.dispatch('unknown' as unknown as 'message', 'Hello World'),
    ).toThrowError(EventBusUnknownEventError)
  })
})
