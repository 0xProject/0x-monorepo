## OrderWatcher

An order watcher daemon that watches for order validity.

#### Read the wiki [article](https://0xproject.com/wiki#0x-OrderWatcher).

OrderWatcher also comes with a WebSocket server to provide language-agnostic access
to order watching functionality. We used the [WebSocket Client and Server Implementation for Node](https://www.npmjs.com/package/websocket). The server sends and receives messages that conform to the [JSON RPC specifications](https://www.jsonrpc.org/specification).

## Installation

**Install**

```bash
npm install @0x/order-watcher --save
```

**Import**

```javascript
import { OrderWatcher } from '@0x/order-watcher';
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

## Using the WebSocket Server

**Setup**

**Environmental Variables**
Several environmental variables can be set to configure the server:

-   `ORDER_WATCHER_HTTP_PORT` specifies the port that the http server will listen on
    and accept connections from. When this is not set, we default to 8080.

**Requests**
The server accepts three types of requests: `ADD_ORDER`, `REMOVE_ORDER` and `GET_STATS`. These mirror what the underlying OrderWatcher does. You can read more in the [wiki](https://0xproject.com/wiki#0x-OrderWatcher). Unlike the OrderWatcher, it does not expose any `subscribe` or `unsubscribe` functionality because the WebSocket server keeps a single subscription open for all clients.

The first step for making a request is establishing a connection with the server. In Javascript:

```
var W3CWebSocket = require('websocket').w3cwebsocket;
wsClient = new W3CWebSocket('ws://127.0.0.1:8080');
```

In Python, you could use the [websocket-client library](http://pypi.python.org/pypi/websocket-client/) and run:

```
from websocket import create_connection
wsClient = create_connection("ws://127.0.0.1:8080")
```

With the connection established, you prepare the payload for your request. The payload is a json object with a format established by the [JSON RPC specification](https://www.jsonrpc.org/specification):

-   `id`: All requests require you to specify a numerical `id`. When the server responds to the request, the response will have the same `id` as the one supplied with your request.
-   `jsonrpc`: This is always the string `'2.0'`.
-   `method`: This specifies the OrderWatcher method you want to call. I.e., `'ADD_ORDER'`, `'REMOVE_ORDER'` or `'GET_STATS'`.
-   `params`: These contain the parameters needed by OrderWatcher to execute the method you called. For `ADD_ORDER`, provide `{ signedOrder: <your signedOrder> }`. For `REMOVE_ORDER`, provide `{ orderHash: <your orderHash> }`. For `GET_STATS`, no parameters are needed, so you may leave this empty.

Next, convert the payload to a string and send it through the connection.
In Javascript:

```
const addOrderPayload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'ADD_ORDER',
    params: { signedOrder: <your signedOrder> },
};
wsClient.send(JSON.stringify(addOrderPayload));
```

In Python:

```
import json
remove_order_payload = {
    'id': 1,
    'jsonrpc': '2.0',
    'method': 'REMOVE_ORDER',
    'params': {'orderHash': '0x6edc16bf37fde79f5012088c33784c730e2f103d9ab1caf73060c386ad107b7e'},
}
wsClient.send(json.dumps(remove_order_payload));
```

**Response**
The server responds to all requests in a similar format. In the data field, you'll find another object containing the following fields:

-   `id`: The id corresponding to the request that the server is responding to. `UPDATE` responses are not based on any requests so the `id` field is omitted`.
-   `jsonrpc`: Always `'2.0'`.
-   `method`: The method the server is responding to. Eg. `ADD_ORDER`. When order states change the server may also initiate a response. In this case, method will be listed as `UPDATE`.
-   `result`: This field varies based on the method. `UPDATE` responses contain the new order state. `GET_STATS` responses contain the current order count. When there are errors, this field is omitted.
-   `error`: When there is an error executing a request, the [JSON RPC](https://www.jsonrpc.org/specification) error object is listed here. When the server responds successfully, this field is omitted.

In Javascript, the responses can be parsed using the `onmessage` callback:

```
wsClient.onmessage = (msg) => {
    const responseData = JSON.parse(msg.data);
    const method = responseData.method
};
```

In Python, `recv` is a lightweight way to receive a response:

```
result = wsClient.recv()
method = result.method
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Build

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/order-watcher yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/order-watcher yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
