<img src="https://github.com/0xProject/branding/blob/master/0x_Black_CMYK.png" width="200px" >

---

[0x][website-url] is an open protocol that facilitates trustless, low friction exchange of Ethereum-based assets. For more information on how it works, check out the [0x protocol specification](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).

This repository is a monorepo including the 0x protocol smart contracts and numerous developer tools. Each public sub-package is independently published to NPM.

If you're developing on 0x now or are interested in using 0x infrastructure in the future, please join our [developer mailing list][dev-mailing-list-url] for updates.

[website-url]: https://0xproject.com
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf
[dev-mailing-list-url]: http://eepurl.com/dx4cPf

[![CircleCI](https://circleci.com/gh/0xProject/0x-monorepo.svg?style=svg&circle-token=61bf7cd8c9b4e11b132089dfcffdd1be277d1e0c)](https://circleci.com/gh/0xProject/0x-monorepo)
[![Coverage Status](https://coveralls.io/repos/github/0xProject/0x-monorepo/badge.svg?branch=development)](https://coveralls.io/github/0xProject/0x-monorepo?branch=development)
[![Discord](https://img.shields.io/badge/chat-rocket.chat-yellow.svg?style=flat)](https://chat.0xproject.com)
[![Join the chat at https://gitter.im/0xProject/Lobby](https://badges.gitter.im/0xProject/Lobby.svg)](https://gitter.im/0xProject/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

## Packages

Visit our [developer portal](https://0xproject.com/docs/order-utils) for a comprehensive list of core & community maintained packages. All packages maintained with this monorepo are listed below.

### Python Packages

| Package                                             | Version                                                                                               | Description                                                                  |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`0x-order-utils.py`](/python-packages/order_utils) | [![PyPI](https://img.shields.io/pypi/v/0x-order-utils.svg)](https://pypi.org/project/0x-order-utils/) | A set of utilities for generating, parsing, signing and validating 0x orders |

### Typescript/Javascript Packages

#### 0x-specific packages

| Package                                                  | Version                                                                                                                 | Description                                                                                       |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [`0x.js`](/packages/0x.js)                               | [![npm](https://img.shields.io/npm/v/0x.js.svg)](https://www.npmjs.com/package/0x.js)                                   | An aggregate package combining many smaller utility packages for interacting with the 0x protocol |
| [`@0x/contract-addresses`](/packages/contract-addresses) | [![npm](https://img.shields.io/npm/v/@0x/contract-addresses.svg)](https://www.npmjs.com/package/@0x/contract-addresses) | A tiny utility library for getting known deployed contract addresses for a particular network.    |
| [`@0x/contract-wrappers`](/packages/contract-wrappers)   | [![npm](https://img.shields.io/npm/v/@0x/contract-wrappers.svg)](https://www.npmjs.com/package/@0x/contract-wrappers)   | JS/TS wrappers for interacting with the 0x smart contracts                                        |
| [`@0x/order-utils`](/packages/order-utils)               | [![npm](https://img.shields.io/npm/v/@0x/order-utils.svg)](https://www.npmjs.com/package/@0x/order-utils)               | A set of utilities for generating, parsing, signing and validating 0x orders                      |
| [`@0x/json-schemas`](/packages/json-schemas)             | [![npm](https://img.shields.io/npm/v/@0x/json-schemas.svg)](https://www.npmjs.com/package/@0x/json-schemas)             | 0x-related JSON schemas                                                                           |
| [`@0x/order-watcher`](/packages/order-watcher)           | [![npm](https://img.shields.io/npm/v/@0x/order-watcher.svg)](https://www.npmjs.com/package/@0x/order-watcher)           | An order watcher daemon that watches for order validity                                           |
| [`@0x/migrations`](/packages/migrations)                 | [![npm](https://img.shields.io/npm/v/@0x/migrations.svg)](https://www.npmjs.com/package/@0x/migrations)                 | Migration tool for deploying 0x smart contracts on private testnets                               |
| [`@0x/contract-artifacts`](/packages/contract-artifacts) | [![npm](https://img.shields.io/npm/v/@0x/contract-artifacts.svg)](https://www.npmjs.com/package/@0x/contract-artifacts) | 0x smart contract compilation artifacts                                                           |
| [`@0x/abi-gen-wrappers`](/packages/abi-gen-wrappers)     | [![npm](https://img.shields.io/npm/v/@0x/abi-gen-wrappers.svg)](https://www.npmjs.com/package/@0x/abi-gen-wrappers)     | Low-level 0x smart contract wrappers generated using `@0x/abi-gen`                                |
| [`@0x/sra-spec`](/packages/sra-spec)                     | [![npm](https://img.shields.io/npm/v/@0x/sra-spec.svg)](https://www.npmjs.com/package/@0x/sra-spec)                     | OpenAPI specification for the Standard Relayer API                                                |
| [`@0x/connect`](/packages/connect)                       | [![npm](https://img.shields.io/npm/v/@0x/connect.svg)](https://www.npmjs.com/package/@0x/connect)                       | An HTTP/WS client for interacting with the Standard Relayer API                                   |
| [`@0x/asset-buyer`](/packages/asset-buyer)               | [![npm](https://img.shields.io/npm/v/@0x/asset-buyer.svg)](https://www.npmjs.com/package/@0x/asset-buyer)               | Convenience package for discovering and buying assets with Ether                                  |

#### Ethereum tooling

| Package                                      | Version                                                                                                     | Description                                                                                                                                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@0x/web3-wrapper`](/packages/web3-wrapper) | [![npm](https://img.shields.io/npm/v/@0x/web3-wrapper.svg)](https://www.npmjs.com/package/@0x/web3-wrapper) | An Ethereum JSON RPC client                                                                                                                                                             |
| [`@0x/sol-compiler`](/packages/sol-compiler) | [![npm](https://img.shields.io/npm/v/@0x/sol-compiler.svg)](https://www.npmjs.com/package/@0x/sol-compiler) | A wrapper around solc-js that adds smart re-compilation, ability to compile an entire project, Solidity version specific compilation, standard input description support and much more. |
| [`@0x/sol-cov`](/packages/sol-cov)           | [![npm](https://img.shields.io/npm/v/@0x/sol-cov.svg)](https://www.npmjs.com/package/@0x/sol-cov)           | A solidity test coverage tool                                                                                                                                                           |
| [`@0x/sol-resolver`](/packages/sol-resolver) | [![npm](https://img.shields.io/npm/v/@0x/sol-resolver.svg)](https://www.npmjs.com/package/@0x/sol-resolver) | Import resolver for smart contracts dependencies                                                                                                                                        |
| [`@0x/subproviders`](/packages/subproviders) | [![npm](https://img.shields.io/npm/v/@0x/subproviders.svg)](https://www.npmjs.com/package/@0x/subproviders) | Web3 provider middlewares (e.g. LedgerSubprovider)                                                                                                                                      |
| [`@0x/sol-doc`](/packages/sol-doc)           | [![npm](https://img.shields.io/npm/v/@0x/sol-doc.svg)](https://www.npmjs.com/package/@0x/sol-doc)           | Solidity documentation generator                                                                                                                                                        |

#### Utilities

| Package                                                  | Version                                                                                                                 | Description                                                                  |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [`@0x/abi-gen`](/packages/abi-gen)                       | [![npm](https://img.shields.io/npm/v/@0x/abi-gen.svg)](https://www.npmjs.com/package/@0x/abi-gen)                       | Tool to generate TS wrappers from smart contract ABIs                        |
| [`@0x/tslint-config`](/packages/tslint-config)           | [![npm](https://img.shields.io/npm/v/@0x/tslint-config.svg)](https://www.npmjs.com/package/@0x/tslint-config)           | Custom TSLint rules used by the 0x core team                                 |
| [`@0x/types`](/packages/types)                           | [![npm](https://img.shields.io/npm/v/@0x/types.svg)](https://www.npmjs.com/package/@0x/types)                           | Shared type declarations                                                     |
| [`@0x/typescript-typings`](/packages/typescript-typings) | [![npm](https://img.shields.io/npm/v/@0x/typescript-typings.svg)](https://www.npmjs.com/package/@0x/typescript-typings) | Repository of types for external packages                                    |
| [`@0x/utils`](/packages/utils)                           | [![npm](https://img.shields.io/npm/v/@0x/utils.svg)](https://www.npmjs.com/package/@0x/utils)                           | Shared utilities                                                             |
| [`@0x/react-docs`](/packages/react-docs)                 | [![npm](https://img.shields.io/npm/v/@0x/react-docs.svg)](https://www.npmjs.com/package/@0x/react-docs)                 | React documentation component for rendering TypeDoc & sol-doc generated JSON |
| [`@0x/react-shared`](/packages/react-shared)             | [![npm](https://img.shields.io/npm/v/@0x/react-shared.svg)](https://www.npmjs.com/package/@0x/react-shared)             | 0x shared react components                                                   |
| [`@0x/assert`](/packages/assert)                         | [![npm](https://img.shields.io/npm/v/@0x/assert.svg)](https://www.npmjs.com/package/@0x/assert)                         | Type and schema assertions used by our packages                              |
| [`@0x/base-contract`](/packages/base-contract)           | [![npm](https://img.shields.io/npm/v/@0x/base-contract.svg)](https://www.npmjs.com/package/@0x/base-contract)           | BaseContract used by auto-generated `abi-gen` wrapper contracts              |
| [`@0x/dev-utils`](/packages/dev-utils)                   | [![npm](https://img.shields.io/npm/v/@0x/dev-utils.svg)](https://www.npmjs.com/package/@0x/dev-utils)                   | Dev utils to be shared across 0x packages                                    |
| [`@0x/fill-scenarios`](/packages/fill-scenarios)         | [![npm](https://img.shields.io/npm/v/@0x/fill-scenarios.svg)](https://www.npmjs.com/package/@0x/fill-scenarios)         | 0x order fill scenario generator                                             |

#### Private Packages

| Package                                            | Description                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------- |
| [`@0x/contracts`](/packages/contracts)             | 0x protocol solidity smart contracts & tests                     |
| [`@0x/testnet-faucets`](/packages/testnet-faucets) | A faucet micro-service that dispenses test ERC20 tokens or Ether |
| [`@0x/website`](/packages/website)                 | 0x website                                                       |

## Usage

Node version >= 6.12 is required.

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
