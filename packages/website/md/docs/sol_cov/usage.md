Sol-cov uses transaction traces in order to figure out which lines of Solidity source code have been covered by your tests. In order for it to gather these traces, you must add the `CoverageSubprovider` to the [ProviderEngine](https://github.com/MetaMask/provider-engine) instance you use when running your Solidity tests. If you're unfamiliar with ProviderEngine, please read the [Web3 Provider explained](https://0xproject.com/wiki#Web3-Provider-Explained) wiki article.

The CoverageSubprovider eavesdrops on the `eth_sendTransaction` and `eth_call` RPC calls and collects traces after each call using `debug_traceTransaction`. `eth_call`'s' don't generate traces - so we take a snapshot, re-submit it as a transaction, get the trace and then revert the snapshot.

```typescript
import { CoverageSubprovider } from '@0xproject/sol-cov';

const provider = new ProviderEngine();

const artifactsPath = 'src/artifacts';
const contractsPath = 'src/contracts';
const networkId = 50;
// Some calls might not have `from` address specified. Nevertheless - transactions need to be submitted from an address with at least some funds. defaultFromAddress is the address that will be used to submit those calls as transactions from.
const defaultFromAddress = '0x5409ed021d9299bf6814279a6a1411a7e866a631';
const coverageSubprovider = new CoverageSubprovider(artifactsPath, contractsPath, defaultFromAddress);

provider.addProvider(coverageSubprovider);
```

After your test suite is complete (e.g global `after` hook), you'll need to call:

```typescript
await coverageSubprovider.writeCoverageAsync();
```

This will create a `coverage.json` file in the `coverage` directory. This file has an [Istanbul format](https://github.com/gotwarlost/istanbul/blob/master/coverage.json.md) - so you can use any of the existing Instanbul reporters.
