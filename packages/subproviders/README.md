## @0xproject/subproviders

A few useful web3 subproviders including a LedgerSubprovider useful for adding Ledger Nano S support.

We have written up a [Wiki](https://0xproject.com/wiki#Web3-Provider-Examples) article detailing some use cases of this subprovider package.

## Installation

```
yarn add @0xproject/subproviders
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```
"include": [
    "./node_modules/web3-typescript-typings/index.d.ts",
]
```

## Usage

Simply import the subprovider you are interested in using:

```javascript
import {
    ledgerEthereumBrowserClientFactoryAsync as ledgerEthereumClientFactoryAsync,
    LedgerSubprovider,
} from '@0xproject/subproviders';

const ledgerSubprovider = new LedgerSubprovider({
    networkId,
    ledgerEthereumClientFactoryAsync,
});

const accounts = await ledgerSubprovider.getAccountsAsync();
```

### Subproviders

#### Ledger Nano S subprovider

A subprovider that enables your dApp to send signing requests to a user's Ledger Nano S hardware wallet. These can be requests to sign transactions or messages.

Ledger Nano (and this library) by default uses a derivation path of `44'/60'/0'`. This is different to TestRPC which by default uses `m/44'/60'/0'/0`. This is a configuration option in the Ledger Subprovider package.

##### Ledger Nano S + Node-hid (usb)

By default, node-hid transport support is an optional dependency. This is due to the requirement of native usb developer packages on the host system. If these aren't installed the entire `npm install` fails. We also no longer export node-hid transport client factories. To re-create this see our integration tests or follow the example below:

```typescript
import Eth from '@ledgerhq/hw-app-eth';
import TransportNodeHid from '@ledgerhq/hw-transport-node-hid';
async function ledgerEthereumNodeJsClientFactoryAsync(): Promise<LedgerEthereumClient> {
    const ledgerConnection = await TransportNodeHid.create();
    const ledgerEthClient = new Eth(ledgerConnection);
    return ledgerEthClient;
}

// Create a LedgerSubprovider with the node-hid transport
ledgerSubprovider = new LedgerSubprovider({
    networkId,
    ledgerEthereumClientFactoryAsync: ledgerEthereumNodeJsClientFactoryAsync,
});
```

##### Testing Subprovider + Ledger integration

To run our integration tests you need a ledger configured with our development mnemonic seed.
Our development mnemonic is `concert load couple harbor equip island argue ramp clarify fence smart topic`.
Configure your ledger and run the integration tests. We assume a derivation path of `m/44'/60'/0'/0` and this is configured in the tests. With this setup and derivation path, your first account should be `0x5409ed021d9299bf6814279a6a1411a7e866a631`, exactly like TestRPC.

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

or

```bash
yarn build:watch
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

*   Plug it into your computer
*   Unlock the device
*   Open the on-device Ethereum app
*   Make sure "browser support" is disabled

Then run:

```
yarn test:integration
```

#### All tests

```bash
yarn run test:all
```
