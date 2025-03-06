import { ZodSchema } from 'zod'

export type EventHandler<P> = (payload: P) => void

export type EventKeys<E extends EventMap> = Extract<keyof E, string>

export type EventHandlers<E extends EventMap> = {
  [K in EventKeys<E>]?: EventHandler<E[K]>[]
}

export type EventMap<T = unknown> = Record<string, T>

export type EventSchemas<E extends EventMap> = {
  [K in keyof E]: ZodSchema<E[K]>
}
