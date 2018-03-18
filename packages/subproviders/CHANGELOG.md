# CHANGELOG

## v0.8.0 - _TBD, 2018_

    * Export `GanacheSubprovider` and `Subprovider` (#426)
    * Make all subproviders to derive from `Subprovider` (#426)
    * Add types for `NextCallback`, `OnNextCompleted` (#426)
    * Introduce `JSONRPCRequestPayloadWithMethod` type
    * Ignore `ganache-core` dependency when using package in a browser environment.

## v0.7.0 - _March 8, 2018_

    * Updated legerco packages. Removed node-hid package as a dependency and make it an optional dependency. It is still used in integration tests but is causing problems for users on Linux distros. (#437)

## v0.6.0 - _March 4, 2018_

    * Move web3 types from being a devDep to a dep since one cannot use this package without it (#429)
    * Add `numberOfAccounts` param to `LedgerSubprovider` method `getAccountsAsync` (#432)

## v0.5.0 - _February 16, 2018_

    * Add EmptyWalletSubprovider and FakeGasEstimateSubprovider (#392)

## v0.4.1 - _February 9, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.4.0 - _February 7, 2018_

    * Added NonceTrackerSubprovider (#355)
    * InjectedWeb3Subprovider accepts a Provider in the constructor, previously it was a Web3 object (#363)

## v0.3.6 - _January 28, 2018_

    * Return a transaction hash from `_sendTransactionAsync` (#303)

## v0.3.0 - _December 28, 2017_

    * Allow LedgerSubprovider to handle `eth_sign` in addition to `personal_sign` RPC requests

## v0.2.0 - _December 20, 2017_

    * Improve the performance of address fetching (#271)
