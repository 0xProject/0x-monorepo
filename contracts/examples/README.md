## Contract examples

Example smart contracts that interact with 0x protocol.

## Usage

Contracts can be found in the [contracts](./contracts) directory.
This package contains example implementations of contracts that interact with the protocol but are _not_ intended for use in production. Examples include [filter](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#filter-contracts) contracts, a [Wallet](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#wallet) contract, and a [Validator](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#validator) contract, among others.

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
PKG=@0x/contracts-examples yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-examples yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
