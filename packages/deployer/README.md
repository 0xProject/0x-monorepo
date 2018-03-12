## @0xproject/deployer

This repository contains a CLI tool that facilitates compiling and deployment of smart contracts.

## Installation

```bash
yarn add @0xproject/deployer
```

## Usage

### CLI Usage

```bash
node ./node_modules/@0xproject/deployer/lib/cli.js --help
cli.js [command]

Commands:
  cli.js compile  compile contracts
  cli.js deploy   deploy a single contract with provided arguments

Options:
  --version          Show version number                               [boolean]
  --contracts-dir    path of contracts directory to compile
              [string] [default: "/Users/leonidlogvinov/Dev/0x/contracts"]
  --network-id       mainnet=1, kovan=42, testrpc=50      [number] [default: 50]
  --should-optimize  enable optimizer                 [boolean] [default: false]
  --artifacts-dir    path to write contracts artifacts to
       [string] [default: "/Users/leonidlogvinov/Dev/0x/build/artifacts/"]
  --jsonrpc-port     port connected to JSON RPC         [number] [default: 8545]
  --gas-price        gasPrice to be used for transactions
                                                [string] [default: "2000000000"]
  --account          account to use for deploying contracts             [string]
  --help             Show help                                         [boolean]
```

### API Usage

## Migrations

You might want to write a migrations script (similar to `truffle migrate`), that deploys multiple contracts and configures them. Bellow you'll find a simplest example of such a script to help you get started.

```
import { Deployer } from '@0xproject/deployer';
import * as path from 'path';

const deployerOpts = {
    artifactsDir: path.resolve('src', 'artifacts'),
    jsonrpcUrl: 'http://localhost:8545',
    networkId: 50,
    defaults: {
        gas: '1000000',
    },
};

const deployer = new Deployer(deployerOpts);

(async () => {
    const etherToken = await deployer.deployAndSaveAsync('WETH9');
})().catch(console.log);
```

More sophisticated example can be found [here](https://github.com/0xProject/0x-monorepo/tree/development/packages/contracts/migrations)

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

or

```bash
yarn build:watch
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
