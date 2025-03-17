import { ZodSchema } from 'zod'

export type EventMap<T = unknown> = Record<string, T>

export type EventKeys<E extends EventMap> = Extract<keyof E, string>

export type EventHandler<P> = (payload: P) => void

export type EventHandlers<E extends EventMap> = {
  [K in EventKeys<E>]?: EventHandler<E[K]>[]
}

export type EventSchemas<E extends EventMap> = {
  [K in EventKeys<E>]: ZodSchema<E[K]>
}

export type OnSubscribeHandler<E extends EventMap> = <K extends EventKeys<E>>(
  event: K,
  handler: EventHandler<E[K]>,
) => void

export type OnUnsubscribeHandler<E extends EventMap> = OnSubscribeHandler<E>

export type OnDispatchHandler<E extends EventMap> = <K extends EventKeys<E>>(
  event: K,
  payload: E[K],
) => void
