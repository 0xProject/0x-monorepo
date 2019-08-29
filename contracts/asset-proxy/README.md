## AssetProxy

This package contains the implementations of all of the [`AssetProxy`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy) contracts available within the 0x protocol. These contracts are responsible for decoding the `assetData` sent to them and performing the actual transfer of assets. Addresses of the deployed contracts can be found in this 0x [guide](https://0x.org/docs/guides/0x-cheat-sheet) or the [DEPLOYS](./DEPLOYS.json) file within this package.

## Installation

**Install**

```bash
npm install @0x/contracts-asset-proxy --save
```

## Bug bounty

A bug bounty for the 2.0.0 contracts is ongoing! Instructions can be found [here](https://0x.org/docs/guides/bug-bounty-program).

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
PKG=@0x/contracts-asset-proxy yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-asset-proxy yarn watch
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
