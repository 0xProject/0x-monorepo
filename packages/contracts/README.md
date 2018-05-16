## Contracts

Smart contracts that implement the 0x protocol.

## Usage

*   [Docs](https://0xproject.com/docs/contracts)
*   [Overview of 0x protocol architecture](https://0xproject.com/wiki#Architecture)
*   [0x smart contract interactions](https://0xproject.com/wiki#Contract-Interactions)
*   [Deployed smart contract addresses](https://0xproject.com/wiki#Deployed-Addresses)
*   [0x protocol message format](https://0xproject.com/wiki#Message-Format)

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

For proposals regarding the 0x protocol's smart contract architecture, message format, or additional functionality, go to the [0x Improvement Proposals (ZEIPs)](https://github.com/0xProject/ZEIPs) repository and follow the contribution guidelines provided therein.

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

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=contracts yarn build
```

Or continuously rebuild on change:

```bash
PKG=contracts yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
