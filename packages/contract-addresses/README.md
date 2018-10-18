## @0x/contract-addresses

A tiny utility library for getting known deployed contract addresses for a
particular network.

## Installation

```bash
yarn add @0x/contract-addresses
```

**Import**

```typescript
import { getContractAddressesForNetworkOrThrow } from '@0x/contract-addresses';
```

or

```javascript
var getContractAddressesForNetworkOrThrow = require('@0x/contract-addresses').getContractAddressesForNetworkOrThrow;
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
PKG=@0x/contract-addresses yarn build
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
