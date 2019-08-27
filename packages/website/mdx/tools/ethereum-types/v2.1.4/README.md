## ethereum-types

Typescript types shared across Ethereum-related packages/libraries/tools.

## Installation

```bash
yarn add -D ethereum-types
```

## Usage

```javascript
import { TransactionReceipt, TxData, TxDataPayable } from 'ethereum-types';
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
PKG=ethereum-types yarn build
```

Or continuously rebuild on change:

```bash
PKG=ethereum-types yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```