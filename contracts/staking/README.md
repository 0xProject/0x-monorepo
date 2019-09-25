## Staking Contracts

This package implements the stake-based liquidity incentives defined by [ZEIP-31](https://github.com/0xProject/ZEIPs/issues/31).

See the specification [here](https://github.com/0xProject/0x-protocol-specification/blob/3.0/staking/staking-specification.md).

## Contracts Directory Structure

The contracts can be found in `contracts/src`.

```
* Staking.sol        | This is a stateless contract that encapsulates all the staking logic.
* StakingProxy.sol   | This is a stateful contract that proxies into the Staking contract.
* ReadOnlyProxy.sol  | This is a stateless contract the makes read-only calls from the Staking Proxy to the Staking Contract.
* fees/              | This contains mixins that implement the logic for 0x Protocol fees.
* immutable/         | This contains mixins that are generally immutable. Changing these files can result in catastrophic failures. Exercise extreme caution.
* interfaces/        | This contains interfaces used throughout the entire staking system.
* libs/              | This contains libraries used by the staking contract; for example, math and signature validation.
* stake/             | This contains mixins that implement the core staking logic.
* staking_pools/     | This contains mixins that implement logic for creating and managing staking pools.
* sys/               | This contains mixins that implement system-level functionality, like scheduling and finalization.
* vaults/            | This contains the vaults (like the Zrx Token Vault).
```

## Installation

**Install**

```bash
npm install @0x/contracts-staking --save
```

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
PKG=@0x/contracts-staking yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/contracts-staking yarn watch
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
