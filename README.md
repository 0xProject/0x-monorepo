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

### Python Packages

| Package                                                        | Version                                                                                                             | Description                                                                                       |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`0x-contract-addresses`](/python-packages/contract_addresses) | [![PyPI](https://img.shields.io/pypi/v/0x-contract-addresses.svg)](https://pypi.org/project/0x-contract-addresses/) | A tiny utility library for getting known deployed contract addresses for a particular network     |
| [`0x-contract-artifacts`](/python-packages/contract_artifacts) | [![PyPI](https://img.shields.io/pypi/v/0x-contract-artifacts.svg)](https://pypi.org/project/0x-contract-artifacts/) | 0x smart contract compilation artifacts                                                           |
| [`0x-contract-wrappers`](/python-packages/contract_wrappers)   | [![PyPI](https://img.shields.io/pypi/v/0x-contract-wrappers.svg)](https://pypi.org/project/0x-contract-wrappers/)   | 0x smart contract wrappers                                                                        |
| [`0x-json-schemas`](/python-packages/json_schemas)             | [![PyPI](https://img.shields.io/pypi/v/0x-json-schemas.svg)](https://pypi.org/project/0x-json-schemas/)             | 0x-related JSON schemas                                                                           |
| [`0x-order-utils`](/python-packages/order_utils)               | [![PyPI](https://img.shields.io/pypi/v/0x-order-utils.svg)](https://pypi.org/project/0x-order-utils/)               | A set of utilities for generating, parsing, signing and validating 0x orders                      |
| [`0x-sra-client`](/python-packages/sra_client)                 | [![PyPI](https://img.shields.io/pypi/v/0x-sra-client.svg)](https://pypi.org/project/0x-sra-client/)                 | A Python client for interacting with servers conforming to the Standard Relayer API specification |

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
| [`@0x/contracts-test-utils`](/contracts/test-utils)                 | [![npm](https://img.shields.io/npm/v/@0x/contracts-test-utils.svg)](https://www.npmjs.com/package/@0x/contracts-test-utils)                 | Typescript/Javascript shared utilities used for testing contracts                                                                                                                                                                                     |
| [`@0x/contracts-utils`](/contracts/utils)                           | [![npm](https://img.shields.io/npm/v/@0x/contracts-utils.svg)](https://www.npmjs.com/package/@0x/contracts-utils)                           | Generic libraries and utilities used throughout all of the contracts                                                                                                                                                                                  |
| [`@0x/contracts-coordinator`](/contracts/coordinator)               | [![npm](https://img.shields.io/npm/v/@0x/contracts-coordinator.svg)](https://www.npmjs.com/package/@0x/contracts-coordinator)               | A contract that allows users to execute 0x transactions with permission from a Coordinator                                                                                                                                                            |
| [`@0x/contracts-dev-utils`](/contracts/dev-utils)                   | [![npm](https://img.shields.io/npm/v/@0x/contracts-dev-utils.svg)](https://www.npmjs.com/package/@0x/contracts-dev-utils)                   | A contract contains utility functions for developers (such as validating many orders using a single eth_call)                                                                                                                                         |

### Typescript/Javascript Packages

#### 0x-specific packages

| Package                                                  | Version                                                                                                                 | Description                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`0x.js`](/packages/0x.js)                               | [![npm](https://img.shields.io/npm/v/0x.js.svg)](https://www.npmjs.com/package/0x.js)                                   | An aggregate package combining many smaller utility packages for interacting with the 0x protocol |
| [`@0x/contract-addresses`](/packages/contract-addresses) | [![npm](https://img.shields.io/npm/v/@0x/contract-addresses.svg)](https://www.npmjs.com/package/@0x/contract-addresses) | A tiny utility library for getting known deployed contract addresses for a particular network.    |
| [`@0x/contract-wrappers`](/packages/contract-wrappers)   | [![npm](https://img.shields.io/npm/v/@0x/contract-wrappers.svg)](https://www.npmjs.com/package/@0x/contract-wrappers)   | JS/TS wrappers for interacting with the 0x smart contracts                                        |
| [`@0x/order-utils`](/packages/order-utils)               | [![npm](https://img.shields.io/npm/v/@0x/order-utils.svg)](https://www.npmjs.com/package/@0x/order-utils)               | A set of utilities for generating, parsing, signing and validating 0x orders                      |
| [`@0x/json-schemas`](/packages/json-schemas)             | [![npm](https://img.shields.io/npm/v/@0x/json-schemas.svg)](https://www.npmjs.com/package/@0x/json-schemas)             | 0x-related JSON schemas                                                                           |  |
| [`@0x/migrations`](/packages/migrations)                 | [![npm](https://img.shields.io/npm/v/@0x/migrations.svg)](https://www.npmjs.com/package/@0x/migrations)                 | Migration tool for deploying 0x smart contracts on private testnets                               |
| [`@0x/contract-artifacts`](/packages/contract-artifacts) | [![npm](https://img.shields.io/npm/v/@0x/contract-artifacts.svg)](https://www.npmjs.com/package/@0x/contract-artifacts) | 0x smart contract compilation artifacts                                                           |
| [`@0x/abi-gen-wrappers`](/packages/abi-gen-wrappers)     | [![npm](https://img.shields.io/npm/v/@0x/abi-gen-wrappers.svg)](https://www.npmjs.com/package/@0x/abi-gen-wrappers)     | Low-level 0x smart contract wrappers generated using `@0x/abi-gen`                                |
| [`@0x/sra-spec`](/packages/sra-spec)                     | [![npm](https://img.shields.io/npm/v/@0x/sra-spec.svg)](https://www.npmjs.com/package/@0x/sra-spec)                     | OpenAPI specification for the Standard Relayer API                                                |
| [`@0x/connect`](/packages/connect)                       | [![npm](https://img.shields.io/npm/v/@0x/connect.svg)](https://www.npmjs.com/package/@0x/connect)                       | An HTTP/WS client for interacting with the Standard Relayer API                                   |
| [`@0x/asset-buyer`](/packages/asset-buyer)               | [![npm](https://img.shields.io/npm/v/@0x/asset-buyer.svg)](https://www.npmjs.com/package/@0x/asset-buyer)               | Convenience package for discovering and buying assets with Ether                                  |
| [`@0x/asset-swapper`](/packages/asset-swapper)           | [![npm](https://img.shields.io/npm/v/@0x/asset-swapper.svg)](https://www.npmjs.com/package/@0x/asset-swapper)           | Convenience package for discovering and performing swaps for any ERC20 Assets                     |

#### Ethereum tooling

| Package                                      | Version                                                                                                     | Description                                                                                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@0x/web3-wrapper`](/packages/web3-wrapper) | [![npm](https://img.shields.io/npm/v/@0x/web3-wrapper.svg)](https://www.npmjs.com/package/@0x/web3-wrapper) | An Ethereum JSON RPC client                                                                                                                                                             |
| [`@0x/sol-compiler`](/packages/sol-compiler) | [![npm](https://img.shields.io/npm/v/@0x/sol-compiler.svg)](https://www.npmjs.com/package/@0x/sol-compiler) | A wrapper around solc-js that adds smart re-compilation, ability to compile an entire project, Solidity version specific compilation, standard input description support and much more. |
| [`@0x/sol-coverage`](/packages/sol-coverage) | [![npm](https://img.shields.io/npm/v/@0x/sol-coverage.svg)](https://www.npmjs.com/package/@0x/sol-coverage) | A solidity test coverage tool                                                                                                                                                           |
| [`@0x/sol-profiler`](/packages/sol-profiler) | [![npm](https://img.shields.io/npm/v/@0x/sol-profiler.svg)](https://www.npmjs.com/package/@0x/sol-profiler) | A solidity gas cost profiler                                                                                                                                                            |
| [`@0x/sol-trace`](/packages/sol-trace)       | [![npm](https://img.shields.io/npm/v/@0x/sol-trace.svg)](https://www.npmjs.com/package/@0x/sol-trace)       | A solidity stack trace tool                                                                                                                                                             |
| [`@0x/sol-resolver`](/packages/sol-resolver) | [![npm](https://img.shields.io/npm/v/@0x/sol-resolver.svg)](https://www.npmjs.com/package/@0x/sol-resolver) | Import resolver for smart contracts dependencies                                                                                                                                        |
| [`@0x/subproviders`](/packages/subproviders) | [![npm](https://img.shields.io/npm/v/@0x/subproviders.svg)](https://www.npmjs.com/package/@0x/subproviders) | Web3 provider middlewares (e.g. LedgerSubprovider)                                                                                                                                      |
| [`@0x/sol-doc`](/packages/sol-doc)           | [![npm](https://img.shields.io/npm/v/@0x/sol-doc.svg)](https://www.npmjs.com/package/@0x/sol-doc)           | Solidity documentation generator                                                                                                                                                        |

#### Utilities

| Package                                                  | Version                                                                                                                 | Description                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`@0x/abi-gen`](/packages/abi-gen)                       | [![npm](https://img.shields.io/npm/v/@0x/abi-gen.svg)](https://www.npmjs.com/package/@0x/abi-gen)                       | Tool to generate TS wrappers from smart contract ABIs           |
| [`@0x/tslint-config`](/packages/tslint-config)           | [![npm](https://img.shields.io/npm/v/@0x/tslint-config.svg)](https://www.npmjs.com/package/@0x/tslint-config)           | Custom TSLint rules used by the 0x core team                    |
| [`@0x/types`](/packages/types)                           | [![npm](https://img.shields.io/npm/v/@0x/types.svg)](https://www.npmjs.com/package/@0x/types)                           | Shared type declarations                                        |
| [`@0x/typescript-typings`](/packages/typescript-typings) | [![npm](https://img.shields.io/npm/v/@0x/typescript-typings.svg)](https://www.npmjs.com/package/@0x/typescript-typings) | Repository of types for external packages                       |
| [`@0x/utils`](/packages/utils)                           | [![npm](https://img.shields.io/npm/v/@0x/utils.svg)](https://www.npmjs.com/package/@0x/utils)                           | Shared utilities                                                |
| [`@0x/assert`](/packages/assert)                         | [![npm](https://img.shields.io/npm/v/@0x/assert.svg)](https://www.npmjs.com/package/@0x/assert)                         | Type and schema assertions used by our packages                 |
| [`@0x/base-contract`](/packages/base-contract)           | [![npm](https://img.shields.io/npm/v/@0x/base-contract.svg)](https://www.npmjs.com/package/@0x/base-contract)           | BaseContract used by auto-generated `abi-gen` wrapper contracts |
| [`@0x/dev-utils`](/packages/dev-utils)                   | [![npm](https://img.shields.io/npm/v/@0x/dev-utils.svg)](https://www.npmjs.com/package/@0x/dev-utils)                   | Dev utils to be shared across 0x packages                       |
| [`@0x/fill-scenarios`](/packages/fill-scenarios)         | [![npm](https://img.shields.io/npm/v/@0x/fill-scenarios.svg)](https://www.npmjs.com/package/@0x/fill-scenarios)         | 0x order fill scenario generator                                |

#### Private Packages

| Package                                            | Description                                                                      |
| -------------------------------------------------- | -------------------------------------------------------------------------------- |
| [`@0x/instant`](/packages/instant)                 | A free and flexible way to offer simple crypto purchasing in any app or website. |
| [`@0x/testnet-faucets`](/packages/testnet-faucets) | A faucet micro-service that dispenses test ERC20 tokens or Ether                 |
| [`@0x/website`](/packages/website)                 | 0x website                                                                       |

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

You will also need to have Python 3 installed, in order to build and run the tests of `abi-gen`'s command-line interface, which is integrated with the yarn build, yarn test, and yarn lint commands described below. More specifically, your local pip should resolve to the Python 3 version of pip, not a Python 2.x version.

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
