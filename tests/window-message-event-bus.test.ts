import { Browser } from 'happy-dom'
import { describe, expect, it, vi } from 'vitest'

import { EventBusRole, WindowMessageEventBus } from '../src'
import { TestEventMap, testSchemas } from './data/test-event-data'

function createWindows() {
  const browser = new Browser()

  const getUrl = (portOffset: number) => `http://localhost:300${portOffset}`

  const windows = Array.from({ length: 5 }).map((_, i) => {
    const page = browser.newPage()
    page.url = getUrl(i)

    return page.frames[0].window as unknown as Window
  })

  const [
    parentWindowOne,
    parentWindowTwo,
    childWindowOne,
    childWindowTwo,
    childWindowThree,
  ] = windows

  return {
    childWindowOne,
    childWindowThree,
    childWindowTwo,
    parentWindowOne,
    parentWindowTwo,
  }
}

describe('WindowMessageEventBus', async () => {
  describe('General', async () => {
    it('should subscribe and handle events', async () => {
      const { childWindowOne, parentWindowOne } = createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const childEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        childWindowOne,
        [
          {
            target: parentWindowOne,
            targetOrigin: '*',
          },
        ],
      )

      const messageHandler = vi.fn()

      childEventBus.subscribe('message', messageHandler)

      parentEventBus.dispatch('message', 'Hello World')

      await vi.waitFor(() => {
        expect(messageHandler).toHaveBeenCalledOnce()
        expect(messageHandler).toHaveBeenCalledWith('Hello World')
      })
    })

    it('should propagate child events to other children', async () => {
      const { childWindowOne, childWindowTwo, parentWindowOne } =
        createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
          {
            target: childWindowTwo,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const childEventBusOne = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        childWindowOne,
        [
          {
            target: parentWindowOne,
            targetOrigin: '*',
          },
        ],
      )

      const childEventBusTwo = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        childWindowTwo,
        [
          {
            target: parentWindowOne,
            targetOrigin: '*',
          },
        ],
      )

      const messageHandlerParent = vi.fn()
      const messageHandlerChildOne = vi.fn()
      const messageHandlerChildTwo = vi.fn()

      parentEventBus.subscribe('message', messageHandlerParent)
      childEventBusOne.subscribe('message', messageHandlerChildOne)
      childEventBusTwo.subscribe('message', messageHandlerChildTwo)

      childEventBusOne.dispatch('message', 'Hello World')

      await Promise.all([
        vi.waitFor(() => {
          expect(messageHandlerParent).toHaveBeenCalledOnce()
          expect(messageHandlerParent).toHaveBeenCalledWith('Hello World')
        }),
        vi.waitFor(() => {
          expect(messageHandlerChildTwo).toHaveBeenCalledOnce()
          expect(messageHandlerChildTwo).toHaveBeenCalledWith('Hello World')
        }),
      ])

      expect(messageHandlerChildOne).not.toHaveBeenCalled()
    })
  })

  describe('Current window and target windows', () => {
    it('should return initially set current window object', () => {
      const { parentWindowOne } = createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [],
        EventBusRole.PARENT,
      )

      expect(parentEventBus.getCurrentWindow()).toBe(parentWindowOne)
    })

    it('should return initially set target window objects', () => {
      const { childWindowOne, childWindowTwo, parentWindowOne } =
        createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
          {
            target: childWindowTwo,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const targets = parentEventBus.getTargetWindows()

      expect(targets).toHaveLength(2)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })
    })

    it('should replace the current window object', () => {
      const addListenerOld = vi.fn()
      const removeListenerOld = vi.fn()

      const oldParentWindow = {
        addEventListener: addListenerOld,
        removeEventListener: removeListenerOld,
      } as unknown as Window

      const addListenerNew = vi.fn()
      const removeListenerNew = vi.fn()

      const newParentWindow = {
        addEventListener: addListenerNew,
        removeEventListener: removeListenerNew,
      } as unknown as Window

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        oldParentWindow,
        [],
        EventBusRole.PARENT,
      )

      expect(addListenerOld).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      )

      parentEventBus.setCurrentWindow(newParentWindow)

      expect(removeListenerOld).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      )
      expect(addListenerNew).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
      )
    })

    it('should replace all target windows', () => {
      const {
        childWindowOne,
        childWindowThree,
        childWindowTwo,
        parentWindowOne,
      } = createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
          {
            target: childWindowTwo,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const targets = parentEventBus.getTargetWindows()

      expect(targets).toHaveLength(2)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })

      parentEventBus.setTargetWindows([
        {
          target: childWindowThree,
          targetOrigin: '*',
        },
      ])

      expect(targets).toHaveLength(1)
      expect(targets).toContainEqual({
        target: childWindowThree,
        targetOrigin: '*',
      })
    })

    it('should add a new target windows', () => {
      const { childWindowOne, childWindowTwo, parentWindowOne } =
        createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const targets = parentEventBus.getTargetWindows()

      expect(targets).toHaveLength(1)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).not.toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })

      parentEventBus.addTargetWindow({
        target: childWindowTwo,
        targetOrigin: '*',
      })

      expect(targets).toHaveLength(2)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })
    })

    it('should remove a target window', () => {
      const { childWindowOne, childWindowTwo, parentWindowOne } =
        createWindows()

      const parentEventBus = new WindowMessageEventBus<TestEventMap>(
        testSchemas,
        parentWindowOne,
        [
          {
            target: childWindowOne,
            targetOrigin: '*',
          },
          {
            target: childWindowTwo,
            targetOrigin: '*',
          },
        ],
        EventBusRole.PARENT,
      )

      const targets = parentEventBus.getTargetWindows()

      expect(targets).toHaveLength(2)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })

      parentEventBus.removeTargetWindow(childWindowTwo)

      expect(targets).toHaveLength(1)
      expect(targets).toContainEqual({
        target: childWindowOne,
        targetOrigin: '*',
      })
      expect(targets).not.toContainEqual({
        target: childWindowTwo,
        targetOrigin: '*',
      })
    })
  })
})
