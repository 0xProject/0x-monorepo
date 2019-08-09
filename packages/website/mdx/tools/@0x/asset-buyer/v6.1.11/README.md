## @0x/asset-buyer

Convenience package for buying assets represented on the Ethereum blockchain using 0x. In its simplest form, the package helps in the usage of the [0x forwarder contract](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarder-specification.md), which allows users to execute [Wrapped Ether](https://weth.io/) based 0x orders without having to set allowances, wrap Ether or own ZRX, meaning they can buy tokens with Ether alone. Given some liquidity (0x signed orders), it helps estimate the Ether cost of buying a certain asset (giving a range) and then buying that asset.

In its more advanced and useful form, it integrates with the [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) and takes care of sourcing liquidity for you given an SRA compliant endpoint. The final result is a library that tells you what assets are available, provides an Ether based quote for any asset desired, and allows you to buy that asset using Ether alone.

## Installation

```bash
yarn add @0x/asset-buyer
```

**Import**

```typescript
import { AssetBuyer } from '@0x/asset-buyer';
```

or

```javascript
var AssetBuyer = require('@0x/asset-buyer').AssetBuyer;
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
}
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
PKG=@0x/asset-buyer yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/asset-buyer yarn watch
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