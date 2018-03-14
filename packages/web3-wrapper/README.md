## @0xproject/web3-wrapper

Wrapped version of web3 with a nicer interface that is used across 0x projects and packages. Visit [the docs](0xproject.com/docs/web3_wrapper).

## Installation

```bash
yarn add @0xproject/web3-wrapper
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```
"include": [
    "./node_modules/web3-typescript-typings/index.d.ts",
]
```

## Usage

```typescript
import {Web3Wrapper} from '@0xproject/web3-wrapper';

const web3 = ...;
const web3Wrapper = new Web3Wrapper(web3.currentProvider);
const availableAddresses = await web3Wrapper.getAvailableAddressesAsync();
```

## Contributing

We strongly encourage that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

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

### Run Tests

```bash
yarn test
```
