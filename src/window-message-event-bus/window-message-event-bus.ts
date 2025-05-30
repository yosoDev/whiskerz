import { EventBus, EventBusRole } from '../event-bus'
import { EventKeys, EventSchemas } from '../event-bus/event-bus.types'
import { WindowData } from './window-data.interface'
import { SerializableEventMap } from './window-message-event-bus.types'

export class WindowMessageEventBus<
  Events extends SerializableEventMap,
> extends EventBus<Events> {
  private readonly identifier: string
  private readonly role: EventBusRole
  private readonly handleEventBound: (messageEvent: MessageEvent) => void

  public constructor(
    schemas: EventSchemas<Events>,
    private currentWindow: Window,
    private targets: WindowData[],
    role?: EventBusRole,
    readonly defaultHandlers = false,
  ) {
    super(schemas, defaultHandlers)

    this.identifier = this.getRandomIdentifier()
    this.role = role ?? EventBusRole.CHILD

    this.handleEventBound = this.handleEvent.bind(this)

    this.registerEventListener()
  }

  private getRandomIdentifier(): string {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }

    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''

    for (let i = 0; i < 16; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
  }

  public getCurrentWindow(): Window {
    return this.currentWindow
  }

  public setCurrentWindow(window: Window) {
    this.unregisterEventListener()

    this.currentWindow = window

    this.registerEventListener()
  }

  public getTargetWindows(): WindowData[] {
    return this.targets
  }

  public setTargetWindows(windows: WindowData[]) {
    this.targets.length = 0
    this.targets.push(...windows)
  }

  public addTargetWindow(window: WindowData) {
    this.targets.push(window)
  }

  public removeTargetWindow(window: Window) {
    const index = this.targets.findIndex(({ target }) => target === window)

    if (index !== -1) {
      this.targets.splice(index, 1)
    }
  }

  public release(): void {
    this.unregisterEventListener()
  }

  private registerEventListener() {
    this.currentWindow.addEventListener('message', this.handleEventBound)
  }

  private unregisterEventListener() {
    this.currentWindow.removeEventListener('message', this.handleEventBound)
  }

  private handleEvent(messageEvent: MessageEvent) {
    const { _source, event, payload } = messageEvent.data

    const validatedPayload = this.validatedPayload(event, payload)

    // do not handle events that originate from this instance
    if (_source === this.identifier) {
      return
    }

    // super.dispatch will call local event handlers
    super.dispatch(event, validatedPayload)

    // the parent re-emits all events to all children.
    // the child, from where the event originates, will not handle this event.
    if (this.role === EventBusRole.PARENT) {
      this.dispatchInternal(event, validatedPayload, _source)
    }
  }

  private dispatchInternal<EventKey extends EventKeys<Events>>(
    event: EventKey,
    payload: Events[EventKey],
    source: string,
  ) {
    this.targets.forEach(({ target, targetOrigin }) => {
      const eventData = {
        _source: source,
        event,
        payload,
      }

      target.postMessage(eventData, targetOrigin)
    })
  }

  public dispatch<EventKey extends EventKeys<Events>>(
    event: EventKey,
    payload: Events[EventKey],
  ) {
    const validatedPayload = this.validatedPayload(event, payload)

    this.dispatchInternal(event, validatedPayload, this.identifier)
  }
}
