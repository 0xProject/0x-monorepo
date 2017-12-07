Subproviders
-----------

A few useful subproviders.

## Installation

```
npm install @0xproject/subproviders --save
```

## Subproviders

#### Ledger Nano S subprovider

A subprovider that enables your dApp to send signing requests to a user's Ledger Nano S hardware wallet. These can be requests to sign transactions or messages.

#### Redundant RPC subprovider

A subprovider which attempts to send an RPC call to a list of RPC endpoints sequentially, until one of them returns a successful response.

#### Injected Web3 subprovider

A subprovider that relays all signing related requests to a particular provider (in our case the provider injected onto the web page), while sending all other requests to a different provider (perhaps your own backing Ethereum node or Infura).

### Integration tests

In order to run the integration tests, make sure you have a Ledger Nano S available.

- Plug it into your computer
- Unlock the device
- Open the on-device Ethereum app
- Make sure "browser support" is disabled

Then run:

```
yarn test:integration
```
