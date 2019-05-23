Sol-trace uses transaction traces to reconstruct the stack trace when reverts happen in Solidity. In order for it to gather these traces, you must add the `RevertTraceSubprovider` to the [ProviderEngine](https://github.com/MetaMask/provider-engine) instance you use when running your Solidity tests. If you're unfamiliar with `ProviderEngine`, please read the [Web3 Provider explained](https://0x.org/wiki#Web3-Provider-Explained) wiki article.

The `RevertTraceSubprovider` eavesdrops on the `eth_sendTransaction` and `eth_call` RPC calls and collects traces after each call using `debug_traceTransaction`. `eth_call`'s' don't generate traces - so we take a snapshot, re-submit it as a transaction, get the trace and then revert the snapshot.

Trace subprovider needs some info about your contracts (`srcMap`, `bytecode`). It gets that info from your project's artifacts. Some frameworks have their own artifact format. Some artifact formats don't actually contain all the neccessary data.

In order to use `RevertTraceSubprovider` with your favorite framework you need to pass an `artifactsAdapter` to it.

### Sol-compiler

If you are generating your artifacts with [@0x/sol-compiler](https://0x.org/docs/sol-compiler) you can use the `SolCompilerArtifactAdapter` we've implemented for you.

```typescript
import { SolCompilerArtifactAdapter } from '@0x/sol-trace';
// Both artifactsDir and contractsDir are optional and will be fetched from compiler.json if not passed in
const artifactAdapter = new SolCompilerArtifactAdapter(artifactsDir, contractsDir);
```

### Truffle

If your project is using [Truffle](https://truffleframework.com/), we've written a `TruffleArtifactsAdapter`for you.

```typescript
import { TruffleArtifactAdapter } from '@0x/sol-trace';
const projectRoot = '.';
const solcVersion = '0.5.0';
const artifactAdapter = new TruffleArtifactAdapter(projectRoot, solcVersion);
```

Because truffle artifacts don't have all the data we need - we actually will recompile your contracts under the hood. That's why you don't need to pass an `artifactsPath`.

### Other framework/toolset

You'll need to write your own artifacts adapter. It should extend `AbstractArtifactsAdapter`.

```typescript
import { AbstractArtifactAdapter } from '@0x/sol-trace';

class YourCustomArtifactsAdapter extends AbstractArtifactAdapter {...};
const artifactAdapter = new YourCustomArtifactsAdapter(...);
```

### Usage

```typescript
import { RevertTraceSubprovider } from '@0x/sol-trace';
import ProviderEngine = require('web3-provider-engine');

const provider = new ProviderEngine();
// Some calls might not have `from` address specified. Nevertheless - transactions need to be submitted from an address with at least some funds. defaultFromAddress is the address that will be used to submit those calls as transactions from.
const defaultFromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const isVerbose = true;
const revertTraceSubprovider = new RevertTraceSubprovider(artifactsAdapter, defaultFromAddress, isVerbose);

provider.addProvider(revertTraceSubprovider);
// Add all your other providers
provider.start();
```

Now when you run your tests, it should print out stack traces when encountering an error.

Use [Geth](https://github.com/ethereum/go-ethereum) as a backing node. We recommend using our [Devnet Docker container](https://hub.docker.com/r/0xorg/devnet) which sets up a Geth node for testing purposes. Ganache support is a [work in progress](https://github.com/0xProject/0x-monorepo/issues/1520).
