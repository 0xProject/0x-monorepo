<img src="https://github.com/0xProject/branding/blob/master/0x%20Logo/PNG/0x-Logo-Black.png" width="150px" >

---

[0x][website-url] is an open protocol that facilitates trustless, low friction exchange of Ethereum-based assets. For more information on how it works, check out the [0x protocol specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).

This repository is a monorepo including the 0x protocol smart contracts and numerous developer tools. Each public sub-package is independently published to NPM.

[website-url]: https://0x.org

[![CircleCI](https://circleci.com/gh/0xProject/0x-monorepo.svg?style=svg&circle-token=61bf7cd8c9b4e11b132089dfcffdd1be277d1e0c)](https://circleci.com/gh/0xProject/0x-monorepo)
[![Coverage Status](https://coveralls.io/repos/github/0xProject/0x-monorepo/badge.svg?branch=development)](https://coveralls.io/github/0xProject/0x-monorepo?branch=development)
[![Discord](https://img.shields.io/badge/chat-discord.chat-yellow.svg?style=flat)](https://discordapp.com/invite/d3FTX3M)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Packages

Visit our [developer portal](https://0x.org/docs/tools/order-utils) for a comprehensive list of core & community maintained packages. All packages maintained with this monorepo are listed below.

### Solidity Packages

These packages are all under development. See [/contracts/README.md](/contracts/README.md) for a list of deployed packages.

| Package                                                             | Version                                                                                                                                     | Description                                                                                                                                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@0x/contracts-asset-proxy`](/contracts/asset-proxy)               | [![npm](https://img.shields.io/npm/v/@0x/contracts-asset-proxy.svg)](https://www.npmjs.com/package/@0x/contracts-asset-proxy)               | [`AssetProxy`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxy) contracts used within the protocol                                                                                               |
| [`@0x/contracts-erc20`](/contracts/erc20)                           | [![npm](https://img.shields.io/npm/v/@0x/contracts-erc20.svg)](https://www.npmjs.com/package/@0x/contracts-erc20)                           | Implementations of various ERC20 tokens                                                                                                                                                                                                               |
| [`@0x/contracts-erc721`](/contracts/erc721)                         | [![npm](https://img.shields.io/npm/v/@0x/contracts-erc721.svg)](https://www.npmjs.com/package/@0x/contracts-erc721)                         | Implementations of various ERC721 tokens                                                                                                                                                                                                              |
| [`@0x/contracts-erc1155`](/contracts/erc1155)                       | [![npm](https://img.shields.io/npm/v/@0x/contracts-erc1155.svg)](https://www.npmjs.com/package/@0x/contracts-erc1155)                       | Implementations of various ERC1155 tokens                                                                                                                                                                                                             |
| [`@0x/contracts-exchange`](/contracts/exchange)                     | [![npm](https://img.shields.io/npm/v/@0x/contracts-exchange.svg)](https://www.npmjs.com/package/@0x/contracts-exchange)                     | The [`Exchange`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#exchange) contract used for settling trades within the protocol                                                                            |
| [`@0x/contracts-exchange-forwarder`](/contracts/exchange-forwarder) | [![npm](https://img.shields.io/npm/v/@0x/contracts-exchange-forwarder.svg)](https://www.npmjs.com/package/@0x/contracts-exchange-forwarder) | A [`Forwarder`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarder-specification.md) contract used to simplify UX for interacting with the protocol                                                                      |
| [`@0x/contracts-exchange-libs`](/contracts/exchange-libs)           | [![npm](https://img.shields.io/npm/v/@0x/contracts-exchange-libs.svg)](https://www.npmjs.com/package/@0x/contracts-exchange-libs)           | Protocol specific libraries used within the [`Exchange`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#exchange) contract                                                                                 |
| [`@0x/contracts-extensions`](/contracts/extensions)                 | [![npm](https://img.shields.io/npm/v/@0x/contracts-extensions.svg)](https://www.npmjs.com/package/@0x/contracts-extensions)                 | Contracts that interact with and extend the functionality of the core protocol                                                                                                                                                                        |
| [`@0x/contracts-multisig`](/contracts/multisig)                     | [![npm](https://img.shields.io/npm/v/@0x/contracts-multisig.svg)](https://www.npmjs.com/package/@0x/contracts-multisig)                     | Various implementations of multisignature wallets, including the [`AssetProxyOwner`](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#assetproxyowner) contract that has permissions to upgrade the protocol |
| [`@0x/contracts-test-utils`](/contracts/test-utils)                 | [![npm](https://img.shields.io/npm/v/@0x/contracts-test-utils.svg)](https://www.npmjs.com/package/@0x/contracts-test-utils)                 | TypeScript/Javascript shared utilities used for testing contracts                                                                                                                                                                                     |
| [`@0x/contracts-utils`](/contracts/utils)                           | [![npm](https://img.shields.io/npm/v/@0x/contracts-utils.svg)](https://www.npmjs.com/package/@0x/contracts-utils)                           | Generic libraries and utilities used throughout all of the contracts                                                                                                                                                                                  |
| [`@0x/contracts-coordinator`](/contracts/coordinator)               | [![npm](https://img.shields.io/npm/v/@0x/contracts-coordinator.svg)](https://www.npmjs.com/package/@0x/contracts-coordinator)               | A contract that allows users to execute 0x transactions with permission from a Coordinator                                                                                                                                                            |
| [`@0x/contracts-dev-utils`](/contracts/dev-utils)                   | [![npm](https://img.shields.io/npm/v/@0x/contracts-dev-utils.svg)](https://www.npmjs.com/package/@0x/contracts-dev-utils)                   | A contract contains utility functions for developers (such as validating many orders using a single eth_call)                                                                                                                                         |
| [`@0x/contracts-staking`](/contracts/staking)                       | [![npm](https://img.shields.io/npm/v/@0x/contracts-staking.svg)](https://www.npmjs.com/package/@0x/contracts-staking)                       | Implements the stake-based liquidity incentives defined by [`ZEIP-31`](https://github.com/0xProject/ZEIPs/issues/31)                                                                                                                                  |

### TypeScript/Javascript Packages

#### 0x-specific packages

| Package                                                  | Version                                                                                                                 | Description                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`@0x/contract-addresses`](/packages/contract-addresses) | [![npm](https://img.shields.io/npm/v/@0x/contract-addresses.svg)](https://www.npmjs.com/package/@0x/contract-addresses) | A tiny utility library for getting known deployed contract addresses for a particular network.    |
| [`@0x/contract-wrappers`](/packages/contract-wrappers)   | [![npm](https://img.shields.io/npm/v/@0x/contract-wrappers.svg)](https://www.npmjs.com/package/@0x/contract-wrappers)   | JS/TS wrappers for interacting with the 0x smart contracts                                        |
| [`@0x/order-utils`](/packages/order-utils)               | [![npm](https://img.shields.io/npm/v/@0x/order-utils.svg)](https://www.npmjs.com/package/@0x/order-utils)               | A set of utilities for generating, parsing, signing and validating 0x orders                      |
| [`@0x/migrations`](/packages/migrations)                 | [![npm](https://img.shields.io/npm/v/@0x/migrations.svg)](https://www.npmjs.com/package/@0x/migrations)                 | Migration tool for deploying 0x smart contracts on private testnets                               |
| [`@0x/contract-artifacts`](/packages/contract-artifacts) | [![npm](https://img.shields.io/npm/v/@0x/contract-artifacts.svg)](https://www.npmjs.com/package/@0x/contract-artifacts) | 0x smart contract compilation artifacts                                                           |  |

## Usage

Node version 6.x or 8.x is required.

Most of the packages require additional typings for external dependencies.
You can include those by prepending the `@0x/typescript-typings` package to your [`typeRoots`](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) config.

```json
"typeRoots": ["node_modules/@0x/typescript-typings/types", "node_modules/@types"],
```

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

#### Read our [contribution guidelines](./CONTRIBUTING.md).

### Install dependencies

Make sure you are using Yarn v1.9.4. To install using brew:

```bash
brew install yarn@1.9.4
```

Then install dependencies

```bash
yarn install
```

### Build

To build all packages:

```bash
yarn build
```

To build a specific package:

```bash
PKG=@0x/web3-wrapper yarn build
```

To build all contracts packages:

```bash
yarn build:contracts
```

### Watch

To re-build all packages on change:

```bash
yarn watch
```

To watch a specific package and all it's dependent packages:

```bash
PKG=[NPM_PACKAGE_NAME] yarn watch

e.g
PKG=@0x/web3-wrapper yarn watch
```

### Clean

Clean all packages:

```bash
yarn clean
```

Clean a specific package

```bash
PKG=0x.js yarn clean
```

### Rebuild

To re-build (clean & build) all packages:

```bash
yarn rebuild
```

To re-build (clean & build) a specific package & it's deps:

```bash
PKG=0x.js yarn rebuild
```

### Lint

Lint all packages:

```bash
yarn lint
```

Lint a specific package:

```bash
PKG=0x.js yarn lint
```

### Run Tests

Run all tests:

```bash
yarn test
```

Run a specific package's test:

```bash
PKG=@0x/web3-wrapper yarn test
```

Run all contracts packages tests:

```bash
yarn test:contracts
```
