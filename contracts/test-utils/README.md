## Contracts test utils

This package contains test utilities used by other smart contracts packages.

## Usage

```typescript
import {
    chaiSetup,
    constants,
    expectContractCallFailedAsync,
    expectContractCreationFailedAsync,
    expectTransactionFailedAsync,
    expectTransactionFailedWithoutReasonAsync,
    increaseTimeAndMineBlockAsync,
    provider,
    sendTransactionResult,
    txDefaults,
    web3Wrapper,
} from '@0x/contracts-test-utils';
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

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/contracts-test-utils yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-test-utils yarn watch
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
