import { EventBusPayloadError } from './event-bus-payload.error'
import { EventBusUnknownEventError } from './event-bus-unknown-event.error'
import { IEventBus } from './event-bus.interface'
import {
  EventHandler,
  EventHandlers,
  EventKeys,
  EventMap,
  EventSchemas,
  OnDispatchHandler,
  OnSubscribeHandler,
  OnUnsubscribeHandler,
} from './event-bus.types'

export class EventBus<Events extends EventMap> implements IEventBus<Events> {
  protected handlers: EventHandlers<Events> = {}
  protected onSubscribeHandlers: OnSubscribeHandler<Events>[] = []
  protected onUnsubscribeHandlers: OnUnsubscribeHandler<Events>[] = []
  protected onDispatchHandlers: OnDispatchHandler<Events>[] = []

  public constructor(
    private readonly schemas: EventSchemas<Events>,
    readonly defaultHandlers = false,
  ) {
    if (!defaultHandlers) {
      return
    }

    this.onSubscribe((event, handler) => {
      console.log(event, handler)
    })

    this.onUnsubscribe((event, handler) => {
      console.log(event, handler)
    })

    this.onDispatch((event, payload) => {
      console.log(event, payload)
    })
  }

  public subscribe<EventKey extends EventKeys<Events>>(
    event: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) {
    if (!this.handlers[event]) {
      this.handlers[event] = []
    }

    this.handlers[event].push(handler)

    this.onSubscribeHandlers.forEach((onSubscribeHandler) =>
      onSubscribeHandler(event, handler),
    )
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

    this.onUnsubscribeHandlers.forEach((onUnsubscribeHandler) =>
      onUnsubscribeHandler(event, handler),
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

    this.onDispatchHandlers.forEach((onDispatchHandler) =>
      onDispatchHandler<EventKey>(event, payload),
    )

    if (!this.handlers[event]) {
      return
    }

    for (const handler of this.handlers[event]) {
      handler(validatedPayload)
    }
  }

  public onSubscribe(handler: OnSubscribeHandler<Events>) {
    this.onSubscribeHandlers.push(handler)
  }

  public onUnsubscribe(handler: OnUnsubscribeHandler<Events>) {
    this.onUnsubscribeHandlers.push(handler)
  }

  public onDispatch(handler: OnDispatchHandler<Events>) {
    this.onDispatchHandlers.push(handler)
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
