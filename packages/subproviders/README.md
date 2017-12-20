@0xproject/subproviders
--------

A few useful web3 subproviders including a LedgerSubprovider useful for adding Ledger Nano S support.

## Installation

```
yarn add @0xproject/subproviders
```

## Usage

Simply import the subprovider you are interested in using:

```javascript
import {
    ledgerEthereumBrowserClientFactoryAsync as ledgerEthereumClientFactoryAsync,
    LedgerSubprovider,
} from '@0xproject/subproviders';

const ledgerSubprovider = new LedgerSubprovider(
    networkId,
    ledgerEthereumClientFactoryAsync,
);

const accounts = await ledgerSubprovider.getAccountsAsync();
```

### Subproviders

#### Ledger Nano S subprovider

A subprovider that enables your dApp to send signing requests to a user's Ledger Nano S hardware wallet. These can be requests to sign transactions or messages.

#### Redundant RPC subprovider

A subprovider which attempts to send an RPC call to a list of RPC endpoints sequentially, until one of them returns a successful response.

#### Injected Web3 subprovider

A subprovider that relays all signing related requests to a particular provider (in our case the provider injected onto the web page), while sending all other requests to a different provider (perhaps your own backing Ethereum node or Infura).

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:
```bash
yarn config set workspaces-experimental true
```

```bash
yarn install
```

### Build

```bash
yarn build
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run tests

#### Unit tests

```bash
yarn run test:unit
```

#### Integration tests

In order to run the integration tests, make sure you have a Ledger Nano S available.

- Plug it into your computer
- Unlock the device
- Open the on-device Ethereum app
- Make sure "browser support" is disabled

Then run:

```
yarn test:integration
```

#### All tests

```bash
yarn run test:all
```
