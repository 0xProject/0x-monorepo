## Contracts

Smart contracts that implement the 0x protocol. Addresses of the deployed contracts can be found [here](https://0xproject.com/wiki#Deployed-Addresses).

## Usage

### 2.0.0

Contracts that make up and interact with version 2.0.0 of the protocol can be found in the `src/2.0.0` directory. The contents of this directory are broken down into the following subdirectories:

*   protocol
    *   This directory contains the contracts that make up version 2.0.0. A full specification can be found [here](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md).
*   extensions
    *   This directory contains contracts that interact with the 2.0.0 contracts and will be used in production, such as the [Forwarder](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/forwarder-specification.md) contract.
*   examples
    *   This directory contains example implementations of contracts that interact with the protocol but are _not_ intended for use in production. Examples include [filter](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#filter-contracts) contracts, a [Wallet](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#wallet) contract, and a [Validator](https://github.com/0xProject/0x-protocol-specification/blob/master/v2/v2-specification.md#validator) contract, among others.
*   tokens
    *   This directory contains implementations of different tokens and token standards, including [wETH](https://weth.io/), ZRX, [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md), and [ERC721](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md).
*   multisig
    *   This directory contains the [Gnosis MultiSigWallet](https://github.com/gnosis/MultiSigWallet) and a custom extension that adds a timelock to transactions within the MultiSigWallet.
*   utils
    *   This directory contains libraries and utils that are shared across all of the other directories.
*   test
    *   This directory contains mocks and other contracts that are used solely for testing contracts within the other directories.

### 1.0.0

Contracts that make up version 1.0.0 of the protocol can be found in `src/1.0.0`. These contracts are considered deprecated and will have limited support going forward.

## Bug bounty

A bug bounty is live for 0x protocol 2.0.0. Submissions should be based off of the contracts as of commit [965d6098294beb22292090c461151274ee6f9a26](https://github.com/0xProject/0x-monorepo/tree/965d6098294beb22292090c461151274ee6f9a26/packages/contracts/src/2.0.0).

### Rewards

The severity of reported vulnerabilities will be graded according to the [CVSS](https://www.first.org/cvss/) (Common Vulnerability Scoring Standard). The following table will serve as a guideline for reward decisions:

| Critical (CVSS 9.0 - 10.0) | High (CVSS 7.0 - 8.9) | Medium (CVSS 4.0 - 6.9) | Low (CVSS 0.0 - 3.9) |
| -------------------------- | --------------------- | ----------------------- | -------------------- |
| $10,000 - $100,000         | $2,500 - $10,000      | $1,000 - $2,500         | $0 - $1,000          |

Please note that any rewards will ultimately be awarded at the discretion of ZeroEx Intl. All rewards will be paid out in ZRX.

### Areas of interest

The following are examples of types of vulnerabilities that are of interest:

*   Loss of assets
    *   A user loses assets in a way that they did not explicitly authorize (e.g an account is able to gain access to an AssetProxy and drain user funds).
    *   A user authorized a transaction or trade but spends more assets than normally expected (e.g an order is allowed to be over-filled).
*   Unintended contract state
    *   A user is able to update the state of a contract such that it is no longer useable (e.g permanently lock a mutex).
    *   Any assets get unexpectedly "stuck" in a contract with regular use of the contract's public methods.
*   Bypassing time locks
    *   The `AssetProxyOwner` is allowed to bypass the timelock for transactions where it is not explicitly allowed to do so.
    *   A user is allowed to bypass the `AssetProxyOwner`.

### Scope

The contracts found in the following directories are considered within scope of this bug bounty:

*   `src/2.0.0/protocol`
*   `src/2.0.0/utils`
*   `src/2.0.0/multisig/MultiSigWalletWithTimeLock`
*   `src/2.0.0/extensions/Forwarder`

Please note that any bugs already reported are considered out of scope (security audits to be released).

### Disclosures

Please e-mail all submissions to team@0xProject.com with the subject "BUG BOUNTY". Your submission should include any steps required to reproduce or exploit the vulnerability. Please allow time for the vulnerability to be fixed before discussing any findings publicly. After receiving a submission, we will contact you with expected timelines for a fix to be implemented.

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

#### Testing options

###### Revert stack traces

If you want to see helpful stack traces (incl. line number, code snippet) for smart contract reverts, run the tests with:

```
yarn test:trace
```

**Note:** This currently slows down the test runs and is therefore not enabled by default.

###### Backing Ethereum node

By default, our tests run against an in-process [Ganache](https://github.com/trufflesuite/ganache-core) instance. In order to run the tests against [Geth](https://github.com/ethereum/go-ethereum), first follow the instructions in the README for the devnet package to start the devnet Geth node. Then run:

```bash
TEST_PROVIDER=geth yarn test
```

###### Code coverage

In order to see the Solidity code coverage output generated by `@0xproject/sol-cov`, run:

```
yarn test:coverage
```

###### Gas profiler

In order to profile the gas costs for a specific smart contract call/transaction, you can run the tests in `profiler` mode.

**Note:** Traces emitted by ganache have incorrect gas costs so we recommend using Geth for profiling.

```
TEST_PROVIDER=geth yarn test:profiler
```

You'll see a warning that you need to explicitly enable and disable the profiler before and after the block of code you want to profile.

```typescript
import { profiler } from './utils/profiler';
profiler.start();
// Some call to a smart contract
profiler.stop();
```

Without explicitly starting and stopping the profiler, the profiler output will be too busy, and therefore unusable.
