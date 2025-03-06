import { EventMap } from '../event-bus/event-bus.types'

type TypedArray =
  | BigInt64Array
  | BigUint64Array
  | Float32Array
  | Float64Array
  | Int8Array
  | Int16Array
  | Int32Array
  | Uint8Array
  | Uint8ClampedArray
  | Uint16Array
  | Uint32Array

type Primitives = bigint | boolean | null | number | string | undefined

export type Serializable =
  | ArrayBuffer
  | DataView
  | Date
  | Map<Serializable, Serializable>
  | Primitives
  | RegExp
  | SerializableArray
  | SerializableObject
  | Set<Serializable>
  | TypedArray

type SerializableArray = Serializable[]

type SerializableObject = { [key: string]: Serializable }

export type SerializableEventMap = EventMap<Serializable>
