## OrderWatcher

An order watcher daemon that watches for order validity.

#### Read the wiki [article](https://0xproject.com/wiki#0x-OrderWatcher).

OrderWatcher also comes with a WebSocket server to provide language-agnostic access
to order watching functionality. We used the [WebSocket Client and Server Implementation for Node](https://www.npmjs.com/package/websocket).

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

*   `ORDER_WATCHER_HTTP_PORT` specifies the port that the http server will listen on
    and accept connections from. When this is not set, we default to 8080.

**Requests**
The server accepts three types of requests: `ADD_ORDER`, `REMOVE_ORDER` and `GET_STATS`. These mirror what the underlying OrderWatcher does. You can read more in the [wiki](https://0xproject.com/wiki#0x-OrderWatcher). Unlike the OrderWatcher, it does not expose any subscribe or unsubscribe functionality because the client implicitly subscribes and unsubscribes by connecting to the server.

The first step for making a request is establishing a connection with the server. In Javascript:

```
var W3CWebSocket = require('websocket').w3cwebsocket;
wsClient = new WebSocket.w3cwebsocket('ws://127.0.0.1:8080');
```

In Python, you could use the [websocket-client library](http://pypi.python.org/pypi/websocket-client/) and run:

```
from websocket import create_connection
wsClient = create_connection("ws://127.0.0.1:8080")
```

With the connection established, you prepare the payload for your request. The payload is a json object with the following structure:

*   For `GET_STATE`, the payload is `{ action: 'GET_STATS }`.
*   For `ADD_ORDER`, use `{ action: 'ADD_ORDER', signedOrder: <your signedOrder> }`.
*   For `REMOVE_ORDER`, use `{ action: 'REMOVE_ORDER', orderHash: <your orderHash> }`.

Next, convert the payload to a string and send it through the connection.
In Javascript:

```
const addOrderPayload = {
    action: 'ADD_ORDER',
    signedOrder: <your signedOrder>,
};
wsClient.send(JSON.stringify(addOrderPayload));
```

In Python:

```
import json
remove_order_payload = {
    'action': 'REMOVE_ORDER',
    'orderHash': '0x6edc16bf37fde79f5012088c33784c730e2f103d9ab1caf73060c386ad107b7e',
}
wsClient.send(json.dumps(remove_order_payload));
```

**Response**
The server responds to all requests in a similar format. In the data field, you'll find another json object that has been converted into a string. This json object contains the following fields:

*   `action`: The action the server is responding to. Eg. `ADD_ORDER`. When order states change the server may also initiate a response. In this case, action will be listed as `UPDATE`.
*   `success`: `true` or `false`; Indicates whether the server handled the request without problems.
*   `result`: This field varies based on the action. `UPDATE` responses contained the new order state. `GET_STATS` responses contain the current order count. When there are errors, the error messages are stored in here.

In Javascript, the responses can be parsed using the `onmessage` callback:

```
wsClient.onmessage = (msg) => {
    const responseData = JSON.parse(msg.data);
    const action = responseData.action
};
```

In Python, `recv` is a lightweight way to receive a response:

```
result = wsClient.recv()
action = result.action
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
