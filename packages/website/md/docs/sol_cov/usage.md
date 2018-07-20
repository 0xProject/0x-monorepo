Sol-cov uses transaction traces in order to figure out which lines of Solidity source code have been covered by your tests. In order for it to gather these traces, you must add the `CoverageSubprovider` to the [ProviderEngine](https://github.com/MetaMask/provider-engine) instance you use when running your Solidity tests. If you're unfamiliar with ProviderEngine, please read the [Web3 Provider explained](https://0xproject.com/wiki#Web3-Provider-Explained) wiki article.

The CoverageSubprovider eavesdrops on the `eth_sendTransaction` and `eth_call` RPC calls and collects traces after each call using `debug_traceTransaction`. `eth_call`'s' don't generate traces - so we take a snapshot, re-submit it as a transaction, get the trace and then revert the snapshot.

Coverage subprovider needs some info about your contracts (`srcMap`, `bytecode`). It gets that info from your project's artifacts. Some frameworks have their own artifact format. Some artifact formats don't actually contain all the neccessary data.

In order to use `CoverageSubprovider` with your favorite framework you need to pass an `artifactsAdapter` to it.

### Sol-compiler

If you are generating your artifacts with [@0xproject/sol-compiler](https://0xproject.com/docs/sol-compiler) you can use the `SolCompilerArtifactsAdapter` we've implemented for you.

```typescript
import { SolCompilerArtifactsAdapter } from '@0xproject/sol-cov';
const artifactsPath = 'src/artifacts';
const contractsPath = 'src/contracts';
const artifactsAdapter = new SolCompilerArtifactsAdapter(artifactsPath, contractsPath);
```

### Truffle

If your project is using [Truffle](https://truffleframework.com/), we've written a `TruffleArtifactsAdapter`for you.

```typescript
import { TruffleArtifactAdapter } from '@0xproject/sol-cov';
const contractsPath = 'src/contracts';
const artifactAdapter = new TruffleArtifactAdapter(contractsDir);
```

Because truffle artifacts don't have all the data we need - we actually will recompile your contracts under the hood. That's why you don't need to pass an `artifactsPath`.

### Other framework/toolset

You'll need to write your own artifacts adapter. It should extend `AbstractArtifactsAdapter`.
Look at the code of the two adapters above for examples.

### Usage

```typescript
import { CoverageSubprovider } from '@0xproject/sol-cov';
import ProviderEngine = require('web3-provider-engine');

const provider = new ProviderEngine();

const artifactsPath = 'src/artifacts';
const contractsPath = 'src/contracts';
const networkId = 50;
// Some calls might not have `from` address specified. Nevertheless - transactions need to be submitted from an address with at least some funds. defaultFromAddress is the address that will be used to submit those calls as transactions from.
const defaultFromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const isVerbose = true;
const coverageSubprovider = new CoverageSubprovider(artifactsAdapter, defaultFromAddress, isVerbose);

provider.addProvider(coverageSubprovider);
```

After your test suite is complete (e.g in the Mocha global `after` hook), you'll need to call:

```typescript
await coverageSubprovider.writeCoverageAsync();
```

This will create a `coverage.json` file in a `coverage` directory. This file has an [Istanbul format](https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md) - so you can use it with any of the existing Istanbul reporters.
