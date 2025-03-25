import { Browser } from 'happy-dom'
import { describe, expect, it, vi } from 'vitest'

import { EventBusRole, WindowMessageEventBus } from '../src'
import { TestEventMap, testSchemas } from './data/test-event-data'

function createWindows() {
  const browser = new Browser()

  const parentPage = browser.newPage()
  parentPage.url = 'http://localhost:3000'

  const childPageOne = browser.newPage()
  childPageOne.url = 'http://localhost:3001'

  const childPageTwo = browser.newPage()
  childPageOne.url = 'http://localhost:3002'

  const parentWindow = parentPage.frames[0].window as unknown as Window
  const childWindowOne = childPageOne.frames[0].window as unknown as Window
  const childWindowTwo = childPageTwo.frames[0].window as unknown as Window

  return { childWindowOne, childWindowTwo, parentWindow }
}

describe('WindowMessageEventBus', async () => {
  it('should subscribe and handle events', async () => {
    const { childWindowOne: childWindow, parentWindow } = createWindows()

    const parentEventBus = new WindowMessageEventBus<TestEventMap>(
      testSchemas,
      parentWindow,
      [
        {
          target: childWindow,
          targetOrigin: '*',
        },
      ],
      EventBusRole.PARENT,
    )

    const childEventBus = new WindowMessageEventBus<TestEventMap>(
      testSchemas,
      childWindow,
      [
        {
          target: parentWindow,
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
    const { childWindowOne, childWindowTwo, parentWindow } = createWindows()

    const parentEventBus = new WindowMessageEventBus<TestEventMap>(
      testSchemas,
      parentWindow,
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
          target: parentWindow,
          targetOrigin: '*',
        },
      ],
    )

    const childEventBusTwo = new WindowMessageEventBus<TestEventMap>(
      testSchemas,
      childWindowTwo,
      [
        {
          target: parentWindow,
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
