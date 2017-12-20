<img src="https://github.com/0xProject/branding/blob/master/0x_Black_CMYK.png" width="200px" >

---

[0x][website-url] is an open protocol that facilitates trustless, low friction exchange of Ethereum-based assets. A full description of the protocol may be found in our [whitepaper][whitepaper-url].

This repository contains all the 0x developer tools written in TypeScript. Our hope is that these tools make it easy to build Relayers and other DApps that use the 0x protocol.

[website-url]: https://0xproject.com/
[whitepaper-url]: https://0xproject.com/pdfs/0x_white_paper.pdf

[![CircleCI](https://circleci.com/gh/0xProject/0x.js.svg?style=svg&circle-token=61bf7cd8c9b4e11b132089dfcffdd1be277d1e0c)](https://circleci.com/gh/0xProject/0x.js)
[![Coverage Status](https://coveralls.io/repos/github/0xProject/0x.js/badge.svg?branch=master&t=fp0cXD)](https://coveralls.io/github/0xProject/0x.js?branch=master)
[![Discord](https://img.shields.io/badge/chat-rocket.chat-yellow.svg?style=flat
)](https://chat.0xproject.com)
[![Join the chat at https://gitter.im/0xProject/Lobby](https://badges.gitter.im/0xProject/Lobby.svg)](https://gitter.im/0xProject/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Greenkeeper badge](https://badges.greenkeeper.io/0xProject/0x.js.svg?token=7c22e5c72acf39d3ead8d29c5d9bb38f9096df3e643024dcedd53ab732847be1&ts=1496426342666)](https://greenkeeper.io/)

### Published Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`0x.js`](/packages/0x.js) | [![npm](https://img.shields.io/npm/v/0x.js.svg)](https://www.npmjs.com/package/0x.js) | A Javascript library for interacting with the 0x protocol |
| [`@0xproject/abi-gen`](/packages/abi-gen) | [![npm](https://img.shields.io/npm/v/@0xproject/abi-gen.svg)](https://www.npmjs.com/package/@0xproject/abi-gen) | Tool to generate TS wrappers from smart contract ABIs |
| [`@0xproject/assert`](/packages/assert) | [![npm](https://img.shields.io/npm/v/@0xproject/assert.svg)](https://www.npmjs.com/package/@0xproject/assert) | Type and schema assertions used by our packages |
| [`@0xproject/connect`](/packages/connect) | [![npm](https://img.shields.io/npm/v/@0xproject/connect.svg)](https://www.npmjs.com/package/@0xproject/connect) | A Javascript library for interacting with the standard relayer api |
| [`@0xproject/json-schemas`](/packages/json-schemas) | [![npm](https://img.shields.io/npm/v/@0xproject/json-schemas.svg)](https://www.npmjs.com/package/@0xproject/json-schemas) | 0x-related json schemas |
| [`@0xproject/subproviders`](/packages/subproviders) | [![npm](https://img.shields.io/npm/v/@0xproject/subproviders.svg)](https://www.npmjs.com/package/@0xproject/subproviders) | Useful web3 subproviders (e.g LedgerSubprovider) |
| [`@0xproject/tslint-config`](/packages/tslint-config) | [![npm](https://img.shields.io/npm/v/@0xproject/tslint-config.svg)](https://www.npmjs.com/package/@0xproject/tslint-config) | Custom 0x development TSLint rules |
| [`@0xproject/types`](/packages/types) | [![npm](https://img.shields.io/npm/v/@0xproject/types.svg)](https://www.npmjs.com/package/@0xproject/types) | Shared type declarations |
| [`@0xproject/utils`](/packages/utils) | [![npm](https://img.shields.io/npm/v/@0xproject/utils.svg)](https://www.npmjs.com/package/@0xproject/utils) | Shared utilities |
| [`@0xproject/web3-wrapper`](/packages/web3-wrapper) | [![npm](https://img.shields.io/npm/v/@0xproject/web3-wrapper.svg)](https://www.npmjs.com/package/@0xproject/web3-wrapper) | Web3 wrapper |

### Private Packages

| Package | Description |
|---------|-------------|
| [`@0xproject/contracts`](/packages/contracts) | 0x solidity smart contracts & tests |
| [`@0xproject/kovan_faucets`](/packages/kovan-faucets) | A faucet micro-service that dispenses test ERC20 tokens or Ether |
| [`@0xproject/monorepo-scripts`](/packages/monorepo-scripts) | Shared monorepo scripts |
| [`@0xproject/website`](/packages/website) | 0x website & Portal DApp |

## Usage

Dedicated documentation pages:
- [0x.js Library](https://0xproject.com/docs/0xjs)
- [0x Connect](https://0xproject.com/docs/connect)
- [Smart contracts](https://0xproject.com/docs/contracts)
- [Standard Relayer API](https://github.com/0xProject/standard-relayer-api/blob/master/README.md)

## Contributing

We strongly encourage the community to help us make improvements and to determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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

Build all packages

```bash
yarn lerna:run build
```

### Lint

Lint all packages
```bash
yarn lerna:run lint
```

### Run Tests

Before running the tests, you will need to spin up a [TestRPC](https://www.npmjs.com/package/ethereumjs-testrpc) instance and deploy all the 0x smart contracts.

In a separate terminal, start TestRPC (a convenience command is provided as part of this repo)
```bash
yarn testrpc
```

Then in your main terminal run
```
cd packages/contracts
yarn migrate
cd ..
```

And finally from the root project directory run
```bash
yarn lerna:run test
```
