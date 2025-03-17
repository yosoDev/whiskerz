import { afterAll, afterEach, describe, expect, it, vi } from 'vitest'

import {
  EventBus,
  EventBusPayloadError,
  EventBusUnknownEventError,
} from '../src'
import { TestEventMap, testSchemas } from './data/test-event-data'

describe('EventBus', () => {
  const consoleMock = vi
    .spyOn(console, 'log')
    .mockImplementation(() => undefined)

  afterEach(() => {
    consoleMock.mockClear()
  })

  afterAll(() => {
    consoleMock.mockReset()
  })

  describe('General', () => {
    it('should subscribe and handle events', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)
      const messageHandler = vi.fn()

      eventBus.subscribe('message', messageHandler)

      eventBus.dispatch('message', 'Hello World')

      expect(messageHandler).toHaveBeenCalledOnce()
      expect(messageHandler).toHaveBeenCalledWith('Hello World')
    })

    it('should not call unsubscribed handlers', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)
      const messageHandler = vi.fn()

      eventBus.subscribe('message', messageHandler)
      eventBus.unsubscribe('message', messageHandler)

      eventBus.dispatch('message', 'Hello World')

      expect(messageHandler).not.toHaveBeenCalled()
    })

    it('should handle multiple subscribers', () => {
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

    it('should handle no subscribers', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      expect(() => eventBus.dispatch('message', 'Hello World')).not.toThrow()
    })

    it('should validate payloads and throw an error', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      expect(() =>
        eventBus.dispatch('message', 123 as unknown as string),
      ).toThrowError(EventBusPayloadError)
    })

    it('should handle unknown events and throw an error', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      expect(() =>
        eventBus.dispatch('unknown' as unknown as 'message', 'Hello World'),
      ).toThrowError(EventBusUnknownEventError)
    })
  })

  describe('OnSubscribe hook', () => {
    it('should use default onSubscribe handler when enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const messageHandler = () => {}

      eventBus.subscribe('message', messageHandler)

      expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
        'message',
        messageHandler,
      )
    })

    it('should not use default onSubscribe handler when not enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      const messageHandler = () => {}

      eventBus.subscribe('message', messageHandler)

      expect(consoleMock).not.toHaveBeenCalled()
    })

    it('should use custom onSubscribe handler', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const messageHandler = () => {}
      const onSubscribeHandler = vi.fn()

      eventBus.onSubscribe(onSubscribeHandler)

      eventBus.subscribe('message', messageHandler)

      expect(onSubscribeHandler).toHaveBeenCalledExactlyOnceWith(
        'message',
        messageHandler,
      )
    })
  })

  describe('OnUnsubscribe hook', () => {
    it('should use default onUnsubscribe handler when enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const messageHandler = () => {}

      eventBus.subscribe('message', messageHandler)

      consoleMock.mockClear()

      eventBus.unsubscribe('message', messageHandler)

      expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
        'message',
        messageHandler,
      )
    })

    it('should not use default onUnsubscribe handler with no prior subscriber when enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const messageHandler = () => {}

      eventBus.unsubscribe('message', messageHandler)

      expect(consoleMock).not.toHaveBeenCalled()
    })

    it('should not use default onUnsubscribe handler when not enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      const messageHandler = () => {}

      eventBus.subscribe('message', messageHandler)

      consoleMock.mockClear()

      eventBus.unsubscribe('message', messageHandler)

      expect(consoleMock).not.toHaveBeenCalled()
    })

    it('should use custom onUnsubscribe handler', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const messageHandler = () => {}
      const onSubscribeHandler = vi.fn()

      eventBus.onUnsubscribe(onSubscribeHandler)

      eventBus.subscribe('message', messageHandler)
      eventBus.unsubscribe('message', messageHandler)

      expect(onSubscribeHandler).toHaveBeenCalledExactlyOnceWith(
        'message',
        messageHandler,
      )
    })
  })

  describe('OnDispatch hook', () => {
    it('should use default onDispatch handler when enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      eventBus.dispatch('message', 'Hello World')

      expect(consoleMock).toHaveBeenCalledExactlyOnceWith(
        'message',
        'Hello World',
      )
    })

    it('should not use default onDispatch handler when not enabled', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas)

      eventBus.dispatch('message', 'Hello World')

      expect(consoleMock).not.toHaveBeenCalled()
    })

    it('should use custom onDispatch handler', () => {
      const eventBus = new EventBus<TestEventMap>(testSchemas, true)

      const onDispatchHandler = vi.fn()

      eventBus.onDispatch(onDispatchHandler)

      eventBus.dispatch('message', 'Hello World')

      expect(onDispatchHandler).toHaveBeenCalledExactlyOnceWith(
        'message',
        'Hello World',
      )
    })
  })
})
