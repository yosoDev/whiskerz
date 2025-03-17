import {
  EventHandler,
  EventKeys,
  EventMap,
  OnDispatchHandler,
  OnSubscribeHandler,
  OnUnsubscribeHandler,
} from './event-bus.types'

export interface IEventBus<Events extends EventMap> {
  subscribe: <EventKey extends EventKeys<Events>>(
    event: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) => void

  unsubscribe: <EventKey extends EventKeys<Events>>(
    event: EventKey,
    handler: EventHandler<Events[EventKey]>,
  ) => void

  dispatch: <EventKey extends EventKeys<Events>>(
    event: EventKey,
    payload: Events[EventKey],
  ) => void

  onSubscribe: (handler: OnSubscribeHandler<Events>) => void

  onUnsubscribe: (handler: OnUnsubscribeHandler<Events>) => void

  onDispatch: (handler: OnDispatchHandler<Events>) => void
}
