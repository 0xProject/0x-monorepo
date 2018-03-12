## @0xproject/sol-cov

## Installation

```bash
yarn add -D @0xproject/sol-cov
```

## Usage

```
import { CoverageSubprovider } from '@0xproject/sol-cov'

const provider = new ProviderEngine();

const artifactsPath = 'src/artifacts';
const contractsPath = 'src/contracts';
const networkId = 50;
const defaultFromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const coverageSubprovider = new CoverageSubprovider(
    artifactsPath,
    contractsPath,
    networkId,
    defaultFromAddress,
);

provider.addProvider(coverageSubprovider);
```

Sol-cov is a subprovider that you add to your [provider engine](https://github.com/MetaMask/provider-engine). If you're unfamilliar with ProviderEngine - read `More complex providers` section [here](https://0xproject.com/wiki#Web3-Provider-Explained). It eavesdrops `eth_sendTransaction` and `eth_call` and collects traces after each one of them using `debug_traceTransaction`. `eth_call` doesn't generate the trace - so we first do a snapshot, then submit it as a transaction, then get a trace and then revert a snapshot.

After all tests you'll need to call:

```
await coverageSubprovider.writeCoverageAsync()
```

This will create `coverage.json` file in your `coverage` directory. This file has an [istanbul format](https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md) - so you can use any of the instanbul reporters.

## Contributing

We strongly encourage that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

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

### Lint

```bash
yarn lint
```
