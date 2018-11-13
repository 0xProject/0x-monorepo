<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.1.1 - _November 9, 2018_

    * Dependencies updated

## v2.1.0 - _October 18, 2018_

    * Add `MetamaskSubprovider` to handle inconsistent JSON RPC behaviour (#1102)
    * Add support for `eth_signTypedData` in wallets Mnemonic, Private and EthLightWallet (#1102)
    * Make web3-provider-engine types a 'dependency' so it's available to users of the library (#1105)

## v2.0.7 - _October 4, 2018_

    * Dependencies updated

## v2.0.6 - _September 28, 2018_

    * Dependencies updated

## v2.0.5 - _September 25, 2018_

    * Dependencies updated

## v2.0.4 - _September 25, 2018_

    * Dependencies updated

## v2.0.3 - _September 21, 2018_

    * Dependencies updated

## v2.0.2 - _September 5, 2018_

    * Dependencies updated

## v2.0.1 - _August 27, 2018_

    * Dependencies updated

## v2.0.0 - _August 24, 2018_

    * Export types: `PartialTxParams`, `JSONRPCRequestPayloadWithMethod`, `ECSignatureString`, `AccountFetchingConfigs`, `LedgerEthereumClientFactoryAsync`, `OnNextCompleted`, `MnemonicWalletSubproviderConfigs`, LedgerGetAddressResult, `JSONRPCRequestPayload`, `Provider`, `JSONRPCResponsePayload` and `JSONRPCErrorCallback` (#924)

## v1.0.5 - _August 14, 2018_

    * Dependencies updated

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Add `RpcSubprovider` with timeout (#874)
    * Add `EthLightwalletSubprovider` (#775)

## v0.10.6 - _July 18, 2018_

    * Dependencies updated

## v0.10.4 - _June 19, 2018_

    * Dependencies updated

## v0.10.3 - _May 22, 2018_

    * Define engine type as Provider in setEngine (#675)

## v0.10.2 - _May 22, 2018_

    * Dependencies updated

## v0.10.1 - _May 4, 2018_

    * Dependencies updated

## v0.10.0 - _May 4, 2018_

    * Upgrade web3-provider-engine to 14.0.4 (#555)
    * Relax `to` validation in base wallet subprovider for transactions that deploy contracts (#555)

## v0.9.0 - _April 11, 2018_

    * Refactor RedundantRPCSubprovider into RedundantSubprovider where it now accepts an array of subproviders rather then an array of RPC endpoints (#500)
    * Add PrivateKeySubprovider and refactor shared functionality into a base wallet subprovider (#506)
    * Add MnemonicWalletsubprovider, deprecating our truffle-hdwallet-provider fork (#507)
    * Support multiple addresses in ledger and mnemonic wallets (#507)
    * Refactors LedgerSubprovider such that explicitly setting the `pathIndex` is no longer required. Simply set the request `from` address as desired (#507)
    * Renamed derivationPath to baseDerivationPath. (#507)

## v0.8.4 - _April 2, 2018_

    * Dependencies updated

## v0.8.3 - _April 2, 2018_

    * Introduce `JSONRPCRequestPayloadWithMethod` type (#465)
    * Export `ErrorCallback` type. (#465)

## v0.8.0 - _March 17, 2018_

    * Export `GanacheSubprovider` and `Subprovider` (#426)
    * Make all subproviders to derive from `Subprovider` (#426)
    * Add types for `NextCallback`, `OnNextCompleted` (#426)
    * Ignore `ganache-core` dependency when using package in a browser environment.

## v0.7.0 - _March 7, 2018_

    * Updated legerco packages. Removed node-hid package as a dependency and make it an optional dependency. It is still used in integration tests but is causing problems for users on Linux distros. (#437)

## v0.6.0 - _March 3, 2018_

    * Move web3 types from being a devDep to a dep since one cannot use this package without it (#429)
    * Add `numberOfAccounts` param to `LedgerSubprovider` method `getAccountsAsync` (#432)

## v0.5.0 - _February 15, 2018_

    * Add EmptyWalletSubprovider and FakeGasEstimateSubprovider (#392)

## v0.4.1 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.4.0 - _February 6, 2018_

    * Added NonceTrackerSubprovider (#355)
    * InjectedWeb3Subprovider accepts a Provider in the constructor, previously it was a Web3 object (#363)

## v0.3.6 - _January 27, 2018_

    * Return a transaction hash from `_sendTransactionAsync` (#303)

## v0.3.0 - _December 27, 2017_

    * Allow LedgerSubprovider to handle `eth_sign` in addition to `personal_sign` RPC requests

## v0.2.0 - _December 19, 2017_

    * Improve the performance of address fetching (#271)
