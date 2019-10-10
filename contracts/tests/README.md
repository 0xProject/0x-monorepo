## Tests

This package implements unit tests against 0x's smart contracts. Its primary purpose is to help avoid circular dependencies between the contract packages.

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

For proposals regarding the 0x protocol's smart contract architecture, message format, or additional functionality, go to the [0x Improvement Proposals (ZEIPs)](https://github.com/0xProject/ZEIPs) repository and follow the contribution guidelines provided therein.

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
PKG=@0x/contracts-tests yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-tests yarn watch
```

If imports are rebuilt in their source packages, they do not need to be rebuilt here.

Example:

```
// contracts/tests/test/some-new/some_new_test.ts
import { SomeNewContract } from '@0x/contracts-some-new';

describe('should do its thing', () => {
    const contractInstance = new SomeNewContract();
    expect(contractInstance.someTruthyFunction.callAsync()).to.be.true();
})
```

Run `yarn watch` from `contracts/some-new`, and then running `yarn test` from this package should test the new changes.

### Clean

```bash
yarn clean
```

Since the purpose of this package is to test other packages, make sure you are running `yarn clean` as necessary in the imported packages as well.

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
