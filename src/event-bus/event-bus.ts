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

    this.onSubscribe((event, handler) =>
      this.logSubscriptionAction('subscribe', event, handler),
    )

    this.onUnsubscribe((event, handler) =>
      this.logSubscriptionAction('unsubscribe', event, handler),
    )

    this.onDispatch((event, payload) => this.logDispatchAction(event, payload))
  }

  private logSubscriptionAction<EventKey extends EventKeys<Events>>(
    action: 'subscribe' | 'unsubscribe',
    eventKey: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) {
    const emoji = action === 'subscribe' ? '🟢' : '🔴'
    const timestamp = new Date().toLocaleTimeString()

    const handlerName = handler.name || 'anonymous'
    const handlerCodeLines = handler.toString().split('\n')

    const handlerCodePreview =
      handlerCodeLines.length <= 5
        ? handlerCodeLines.join('\n')
        : `${handlerCodeLines.slice(0, 5).join('\n').trim()}\n...`

    console.log(
      `[Whiskerz] %c${emoji} ${action}%c @ ${timestamp} %c→ Event: %c${eventKey}%c | Handler:\n%c${handlerName}%c → ${handlerCodePreview}\n`,
      'font-weight: bold; text-transform: uppercase;',
      'color: gray;',
      '',
      'color: cornflowerblue; font-weight: bold;',
      '',
      'color: deeppink;',
      '',
      handler,
    )
  }

  private logDispatchAction<EventKey extends EventKeys<Events>>(
    eventKey: EventKey,
    payload: Events[EventKey],
  ) {
    const timestamp = new Date().toLocaleTimeString()

    const payloadLines = JSON.stringify(payload, null, 2).split('\n')
    const payloadPreview =
      payloadLines.length <= 5
        ? payloadLines.join('\n')
        : `${payloadLines.slice(0, 5).join('\n').trim()}\n...`

    console.log(
      `[Whiskerz] %c📦 dispatch%c @ ${timestamp} %c→ Event: %c${eventKey}%c | Payload:\n%c${payloadPreview}\n`,
      'font-weight: bold; text-transform: uppercase;',
      'color: gray;',
      '',
      'color: cornflowerblue; font-weight: bold;',
      '',
      'color: deeppink;',
      payload,
    )
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
