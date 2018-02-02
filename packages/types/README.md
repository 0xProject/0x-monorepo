## @0xproject/types

Typescript types shared across 0x projects and packages

## Installation

```bash
yarn add -D @0xproject/types
```

## Usage

```javascript
import { TransactionReceipt, TxData, TxDataPayable } from '@0xproject/types';
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

If you don't have yarn workspaces e`nabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Build

```bash
yarn build
```

or

```bash
yarn build:watch
```

### Lint

```bash
yarn lint
```
