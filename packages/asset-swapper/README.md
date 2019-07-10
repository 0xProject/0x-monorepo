## [BETA] @0x/asset-swapper

Convenience package for swapping assets represented on the Ethereum blockchain using 0x. The package helps to perform all the offchain computations to perform a marketBuy or marketSell interaction with the 0x exchange contracts, or 0x extension contracts. 

In its more advanced and useful form, it integrates with the [Standard Relayer API](https://github.com/0xProject/standard-relayer-api) and takes care of sourcing liquidity for you given an SRA compliant endpoint. The final result is a library that tells you what assets are available, provides a quote for any asset desired, and allows you to buy that asset using any ERC20 asset.

## Installation

```bash
yarn add @0x/asset-swapper
```

**Import**

```typescript
import { SwapQuoter, SwapQuoteConsumer } from '@0x/asset-swapper';
```

or

```javascript
var SwapQuoter = require('@0x/asset-swapper').SwapQuoter;
var SwapQuoteConsumer = require('@0x/asset-swapper').SwapQuoteConsumer;
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
PKG=@0x/asset-swapper yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/asset-swapper yarn watch
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
