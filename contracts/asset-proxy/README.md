## Contracts

Smart contracts that implement the 0x protocol. Addresses of the deployed contracts can be found in the 0x [wiki](https://0xproject.com/wiki#Deployed-Addresses) or the [CHANGELOG](./CHANGELOG.json) of this package.

## Usage

Contracts that make up and interact with version 2.0.0 of the protocol can be found in the [contracts](./contracts) directory. The contents of this directory are broken down into the following subdirectories:

-   [protocol](./contracts/protocol)
    -   This directory contains the contracts that make up version 2.0.0. A full specification can be found [here](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
-   [test](./contracts/test)
    -   This directory contains mocks and other contracts that are used solely for testing contracts within the other directories.

## Bug bounty

A bug bounty for the 2.0.0 contracts is ongoing! Instructions can be found [here](https://0xproject.com/wiki#Bug-Bounty).

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
PKG=@0x/contracts-protocol yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-protocol yarn watch
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

#### Testing options

Contracts testing options like coverage, profiling, revert traces or backing node choosing - are described [here](../TESTING.md).
