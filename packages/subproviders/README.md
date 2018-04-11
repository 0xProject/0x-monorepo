## @0xproject/subproviders

A few useful web3 subproviders including a LedgerSubprovider useful for adding Ledger Nano S support.

We have written up a [Wiki](https://0xproject.com/wiki#Web3-Provider-Examples) article detailing some use cases of this subprovider package.

### Read the [Documentation](https://0xproject.com/docs/subproviders).

## Installation

```
yarn add @0xproject/subproviders
```

If your project is in [TypeScript](https://www.typescriptlang.org/), add the following to your `tsconfig.json`:

```json
"compilerOptions": {
    "typeRoots": ["node_modules/@0xproject/typescript-typings/types", "node_modules/@types"],
}
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

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

If this is your **first** time building this package, you must first build **all** packages within the monorepo. This is because packages that depend on other packages located inside this monorepo are symlinked when run from **within** the monorepo. This allows you to make changes across multiple packages without first publishing dependent packages to NPM. To build all packages, run the following from the monorepo root directory:

```bash
yarn lerna:rebuild
```

Or continuously rebuild on change:

```bash
yarn dev
```

You can also build this specific package by running the following from within its directory:

```bash
yarn build
```

or continuously rebuild on change:

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

*   Setup your Ledger with the development mnemonic seed: `concert load couple harbor equip island argue ramp clarify fence smart topic`
*   Plug it into your computer
*   Unlock the device
*   Open the on-device Ethereum app
*   Make sure "browser support" and "contract data" are disabled
*   Start [TestRPC](https://github.com/trufflesuite/ganache-cli) locally at port `8545`

Then run:

```
yarn test:integration
```

**Note:** We assume a derivation path of `m/44'/60'/0'/0` which is already configured in the tests. With this setup and derivation path, your first account should be `0x5409ed021d9299bf6814279a6a1411a7e866a631`, exactly like TestRPC.

#### All tests

```bash
yarn run test:all
```
