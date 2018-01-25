## @0xproject/deployer

This repository contains a CLI tool that facilitates compiling and deployment of smart contracts.

## Installation

```bash
yarn add @0xproject/deployer
```

## Usage

```bash
node ./node_modules/@0xproject/deployer/lib/cli.js --help
cli.js [command]

Commands:
  cli.js compile  compile contracts
  cli.js migrate  compile and deploy contracts using migration scripts
  cli.js deploy   deploy a single contract with provided arguments

Options:
  --version          Show version number                               [boolean]
  --contracts-dir    path of contracts directory to compile
              [string] [default: "/Users/leonidlogvinov/Dev/0x/0x.js/contracts"]
  --network-id       mainnet=1, kovan=42, testrpc=50      [number] [default: 50]
  --should-optimize  enable optimizer                 [boolean] [default: false]
  --artifacts-dir    path to write contracts artifacts to
       [string] [default: "/Users/leonidlogvinov/Dev/0x/0x.js/build/artifacts/"]
  --jsonrpc-port     port connected to JSON RPC         [number] [default: 8545]
  --gas-price        gasPrice to be used for transactions
                                                [string] [default: "2000000000"]
  --account          account to use for deploying contracts             [string]
  --help             Show help                                         [boolean]
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

```bash
yarn build
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
