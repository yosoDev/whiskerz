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
    private readonly currentWindow: Window,
    private readonly targets: WindowData[],
    role?: EventBusRole,
    readonly defaultHandlers = false,
  ) {
    super(schemas, defaultHandlers)

    this.identifier = crypto.randomUUID()
    this.role = role ?? EventBusRole.CHILD

    this.handleEventBound = this.handleEvent.bind(this)

    this.registerEventListener()
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
