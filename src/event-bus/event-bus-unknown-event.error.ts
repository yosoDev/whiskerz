export class EventBusUnknownEventError extends Error {
  constructor(unknownEvent: string) {
    super(`The event "${unknownEvent}" was not found in the event map`)
  }
}
