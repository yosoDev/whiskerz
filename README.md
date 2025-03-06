# Whiskerz

Whiskerz is a fully-typed Event Bus for TypeScript.
It also comes with an Event Bus specializing in communicating between different Window objects based on `window.postMessage`.

![npm version](https://img.shields.io/npm/v/@yosodev/whiskerz)
![license](https://img.shields.io/github/license/yosoDev/whiskerz)

## Installation

```sh
pnpm add @yosodev/whiskerz
# or
npm install @yosodev/whiskerz
# or
yarn add @yosodev/whiskerz
```

## Usage

Both `EventBus` and `WindowMessageEventBus` require an event map.  
An event map is a record with the event name (`string`) as the key and any payload as the value.

```ts
type MessagePayload = {
  content: string
  time: Date
}

type MyEventMap = {
  message: MessagePayload
}
```

The payloads are validated with Zod.
For that, schemas matching the event map have to be defined.
The `EventSchemas` type can be used to make schema definition easier.

```ts
const schemas = {
  message: z.object({
    content: z.string(),
    time: z.date(),
  }),
} satisfies EventSchemas<MyEventMap>
```

### Event Bus

The event bus can be created with an event map and a schema definition.

Event handlers can be registered with the `subscribe` method and removed again with `unsubscribe`.  
Both methods take an event name from the event map as the first argument
and a handler function, which takes the corresponding event payload as it's argument, as the second argument.

Events can be emitted with the `dispatch` method.
This takes an event name from the event map as the first argument and the corresponding payload as the second argument.

```ts
const myEventBus = new EventBus<MyEventMap>(schemas)

function messageHandler({ content, time }: MessagePayload) {
  console.log(
    `New message ${content} was posted at ${time.toLocaleTimeString()}`,
  )
}

// register event handler
myEventBus.subscribe('message', messageHandler)

// dispatch event
myEventBus.dispatch('message', {
  content: 'Hello World',
  time: new Date(),
})

// remove event handler
myEventBus.unsubscribe('message', messageHandler)
```

### WindowMessageEventBus

> [!WARNING]
> This feature is still incomplete and may pose some security concerns.
> See [docs on MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) for more information.

This is an event bus which builds upon the regular `EventBus`.  
Internally it utilizes the `window.postMessage` method.
It is intended to work across different instances of the event bus.  
One use case is the communication between a document and the document inside an iframe.  
Of course, all instances need to have the same event signatures.
So defining the event map and schemas in a single place is highly recommended.

Defining the event map works pretty much like for the regular event bus.
It should be noted, though, that only types, that can are serializable by the structured clone algorithm,
are supported by `window.postMessage`.  
`WindowMessageEventBus` supports most of these types.
One noteworthy exception is the `Error` type as errors can be better passed on the event bus
by a custom payload.

`WindowMessageEventBus` requires a `Window` object to listen to `message` events on.  
It also requires a list of target windows, on which `postMessage` is executed.
The `targetOrigin` is passed directly to `postMessage`.

Each instance of `WindowMessageEventBus` can have either a `PARENT` role or a `CHILD` role (default).  
An instance with the `PARENT` role will propagate any events it receives to all other `CHILD` instances
in order to decouple children windows from each other.

The `WindowMessageEventBus` has the same public methods as `EventBus`.  
It also has a `release` methods which removes the handler for the `message` event from the `Window` object.
This method can for example be used when the event bus is created inside a custom component,
which eventually is removed from the DOM (in case of Vue components, `release` can be called in the `beforeUnmount` lifecycle hook).

```ts
const myEventBus = new WindowMessageEventBus<MyEventMap>(
  schemas,
  window, // current window
  [
    { target: childAWindow, targetOrigin: '*' },
    { target: childBWindow, targetOrigin: '*' },
  ],
  EventBusRole.PARENT,
)

beforeUnmount(() => {
  // remove event listener on window object
  myEventBus.release()
})
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
