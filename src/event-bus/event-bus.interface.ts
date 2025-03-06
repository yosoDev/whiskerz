import { EventHandler, EventKeys, EventMap } from './event-bus.types'

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
}
