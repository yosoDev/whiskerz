import { ZodError } from 'zod'

import { EventKeys, EventMap } from './event-bus.types'

export class EventBusPayloadError<
  Events extends EventMap,
  EventKey extends EventKeys<Events>,
> extends Error {
  public readonly error: ZodError<Events[EventKey]>

  constructor(error: ZodError<Events[EventKey]>) {
    super('The payload does not match the schema.')

    this.error = error
  }
}
