## @0x/orderbook

Package to help fetch orders from a remote source ([Standard Relayer API](https://github.com/0xProject/standard-relayer-api), Mesh) and keep the local orderbook synced and up-to-date.

Supported Order Providers:

-   SRA HTTP Polling
-   SRA Websocket
-   Mesh

## Installation

```bash
yarn add @0x/orderbook
```

**Import**

```typescript
import { Orderbook } from '@0x/orderbook';
```

or

```javascript
var Orderbook = require('@0x/orderbook').Orderbook;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
```

## Usage

```typescript
// Create an orderbook for makerAssetData, takerAssetData using the SRA Polling Order Provider
// This Provider polls the SRA endpoint automatically every 5 seconds on the supplied asset pairs
const orderbook = Orderbook.getOrderbookForPollingProvider({
    httpEndpoint: 'https://sra.0x.org/v2',
    pollingIntervalMs: 5000,
});
const orders = await orderbook.getOrdersAsync(makerAssetData, takerAssetData);

// Create an orderbook for makerAssetData, takerAssetData using the SRA Websocket Order Provider
// This provider subscribes via websocket to receive order updates on the supplied asset pairs
const orderbook = Orderbook.getOrderbookForWebsocketProvider({
    httpEndpoint: 'https://sra.0x.org/v2',
    websocketEndpoint: 'wss://ws.sra.0x.org',
});
const orders = await orderbook.getOrdersAsync(makerAssetData, takerAssetData);

// Create an orderbook for makerAssetData, takerAssetData using the Mesh Order Provider
// This provider subscribes via websocket to receive order updates on all orders stored in Mesh
const orderbook = Orderbook.getOrderbookForMeshProvider({
    websocketEndpoint: 'wss://MESH_ENDPOINT',
});
const orders = await orderbook.getOrdersAsync(makerAssetData, takerAssetData);
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

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
PKG=@0x/orderbook yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/orderbook yarn watch
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
