import { EventBusPayloadError } from './event-bus-payload.error'
import { EventBusUnknownEventError } from './event-bus-unknown-event.error'
import { IEventBus } from './event-bus.interface'
import {
  EventHandler,
  EventHandlers,
  EventKeys,
  EventMap,
  EventSchemas,
} from './event-bus.types'

export class EventBus<Events extends EventMap> implements IEventBus<Events> {
  protected handlers: EventHandlers<Events> = {}

  public constructor(private readonly schemas: EventSchemas<Events>) {}

  public subscribe<EventKey extends EventKeys<Events>>(
    event: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }

    this.handlers[event].push(handler)
  }

  public unsubscribe<EventKey extends EventKeys<Events>>(
    event: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) {
    if (!this.handlers[event]) {
      return
    }

    this.handlers[event] = this.handlers[event].filter(
      (_handler) => _handler !== handler,
    )
  }

  public dispatch<EventKey extends EventKeys<Events>>(
    event: EventKey,
    payload: Events[EventKey],
  ) {
    if (this.schemas[event] === undefined) {
      throw new EventBusUnknownEventError(event)
    }

    const validatedPayload = this.validatedPayload(event, payload)

    if (!this.handlers[event]) {
      return
    }

    for (const handler of this.handlers[event]) {
      handler(validatedPayload)
    }
  }

  protected validatedPayload<EventKey extends EventKeys<Events>>(
    event: EventKey,
    payload: Events[EventKey],
  ): Events[EventKey] {
    const parsedPayload = this.schemas[event].safeParse(payload)

    if (!parsedPayload.success) {
      throw new EventBusPayloadError(parsedPayload.error)
    }

    return parsedPayload.data
  }
}
