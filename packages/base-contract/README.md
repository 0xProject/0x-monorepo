## @0xproject/base-contract

BaseContract to derive all auto-generated wrappers from

## Installation

```bash
yarn add @0xproject/base-contract
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```
"include": [
    "./node_modules/web3-typescript-typings/index.d.ts",
    "./node_modules/ethers-typescript-typings/index.d.ts"
]
```

## Usage

```javascript
import { BaseContract } from '@0xproject/base-contract';
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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
