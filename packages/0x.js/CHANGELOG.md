<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v9.0.1 - _December 9, 2019_

    * Dependencies updated

## v9.0.0 - _December 2, 2019_

    * Remove ZRXToken contract wrapper (#2324)
    * ContractWrappers no longer exposes `erc20Proxy`, `erc721Proxy` and `dutchAuction` wrappers (#2324)
    * [Breaking] Big refactor of contract wrapper interface. See https://github.com/0xProject/0x-monorepo/pull/2325 for details (#2325)
    * Remove IWallet and IValidator contract wrappers (#2337)
    * Remove exports orderHashUtils and transactionHashUtils (#2321)
    * Update BigNumber version to ~9.0.0 (#2342)
    * Exported intefaces changed: from getContractAddressesForNetworkOrThrow to getContractAddressesForChainOrThrow, from NetworkId to ChainId, from ContractNetworks to ContractChains, and from ContractNetworkData to ContractChainData. (#2313)
    * Updated to work with 0x v3

## v8.0.0-beta.3 - _December 2, 2019_

    * Dependencies updated

## v8.0.0-beta.2 - _November 20, 2019_

    * Dependencies updated

## v8.0.0-beta.1 - _November 17, 2019_

    * Remove ZRXToken contract wrapper (#2324)
    * ContractWrappers no longer exposes `erc20Proxy`, `erc721Proxy` and `dutchAuction` wrappers (#2324)
    * [Breaking] Big refactor of contract wrapper interface. See https://github.com/0xProject/0x-monorepo/pull/2325 for details (#2325)
    * Remove IWallet and IValidator contract wrappers (#2337)
    * Remove exports orderHashUtils and transactionHashUtils (#2321)
    * Update BigNumber version to ~9.0.0 (#2342)

## v8.0.0-beta.0 - _November 7, 2019_

    * Exported intefaces changed: from getContractAddressesForNetworkOrThrow to getContractAddressesForChainOrThrow, from NetworkId to ChainId, from ContractNetworks to ContractChains, and from ContractNetworkData to ContractChainData. (#2313)

## v7.1.0-beta.0 - _October 3, 2019_

    * Updated to work with 0x v3

## v7.0.2 - _September 17, 2019_

    * Dependencies updated

## v7.0.1 - _September 3, 2019_

    * Dependencies updated

## v7.0.0 - _August 22, 2019_

    * Add optional `exchangeAddress` parameter to `signatureUtils.isValidSignatureAsync` to fix `Validator` type signatures. (#2017)
    * Removed @0x/order-watcher
    * Update to latest @0x/contract-wrappers v11 (#2068)

## v6.0.15 - _August 8, 2019_

    * Dependencies updated

## v6.0.14 - _July 31, 2019_

    * Dependencies updated

## v6.0.13 - _July 24, 2019_

    * re-export new ethereum-types type, TupleDataItem (#1919)

## v6.0.12 - _July 15, 2019_

    * Dependencies updated

## v6.0.11 - _July 13, 2019_

    * Dependencies updated

## v6.0.10 - _July 13, 2019_

    * Dependencies updated

## v6.0.9 - _May 15, 2019_

    * Dependencies updated

## v6.0.8 - _May 14, 2019_

    * Dependencies updated

## v6.0.7 - _May 10, 2019_

    * Dependencies updated

## v6.0.6 - _April 11, 2019_

    * Dependencies updated

## v6.0.5 - _March 21, 2019_

    * Dependencies updated

## v6.0.4 - _March 20, 2019_

    * Dependencies updated

## v6.0.3 - _March 1, 2019_

    * Dependencies updated

## v6.0.2 - _February 27, 2019_

    * Dependencies updated

## v6.0.1 - _February 26, 2019_

    * Dependencies updated

## v6.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v5.0.0 - _February 9, 2019_

    * Export `transactionHashUtils`, `DecodedCalldata`, `ZeroExTransaction`, and `SignedZeroExTransaction` (#1569)

## v4.0.3 - _February 7, 2019_

    * Dependencies updated

## v4.0.2 - _February 7, 2019_

    * Dependencies updated

## v4.0.1 - _February 6, 2019_

    * Dependencies updated

## v4.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v3.0.3 - _January 17, 2019_

    * Dependencies updated

## v3.0.2 - _January 15, 2019_

    * Dependencies updated

## v3.0.1 - _January 11, 2019_

    * Dependencies updated

## v3.0.0 - _January 9, 2019_

    * Export `MultiAssetData`, `MultiAssetDataWithRecursiveDecoding`, `ObjectMap`, and `SingleAssetData` from types. No longer export `AssetData`. (#1363)

## v2.0.8 - _December 13, 2018_

    * Dependencies updated

## v2.0.7 - _December 11, 2018_

    * Dependencies updated

## v2.0.6 - _November 28, 2018_

    * Dependencies updated

## v2.0.5 - _November 21, 2018_

    * Dependencies updated

## v2.0.4 - _November 14, 2018_

    * Dependencies updated

## v2.0.3 - _November 13, 2018_

    * Dependencies updated

## v2.0.2 - _November 12, 2018_

    * Dependencies updated

## v2.0.1 - _November 9, 2018_

    * Dependencies updated

## v2.0.0 - _October 18, 2018_

    * Add support for `eth_signTypedData`. (#1102)
    * Added `MetamaskSubprovider` to handle inconsistencies in Metamask's signing JSON RPC endpoints. (#1102)
    * Removed `SignerType` (including `SignerType.Metamask`). Please use the `MetamaskSubprovider` to wrap `web3.currentProvider`. (#1102)
    * Updated to use new modularized artifacts and the latest version of @0xproject/contract-wrappers (#1105)
    * Make web3-provider-engine types a 'dependency' so it's available to users of the library (#1105)
    * Export new `AssetData` type from types (#1131)

## v1.0.8 - _October 4, 2018_

    * Dependencies updated

## v1.0.7 - _September 28, 2018_

    * Dependencies updated

## v1.0.6 - _September 25, 2018_

    * Dependencies updated

## v1.0.5 - _September 25, 2018_

    * Dependencies updated

## v1.0.4 - _September 21, 2018_

    * Dependencies updated

## v1.0.3 - _September 19, 2018_

    * Drastically reduce the bundle size by removing unused parts of included contract artifacts.

## v1.0.2 - _September 18, 2018_

    * Add ZRX & WETH mainnet contract addresses into the included artifacts

## v1.0.1 - _September 5, 2018_

    * Dependencies updated

## v1.0.1-rc.6 - _August 27, 2018_

    * Fix missing `BlockParamLiteral` type import issue

## v1.0.1-rc.5 - _Invalid date_

    * Fix `main` and `types` package.json entries so that they point to the new location of index.d.ts and index.js

## v1.0.1-rc.4 - _August 24, 2018_

    * Re-organize the exported interface of 0x.js. Remove the `ZeroEx` class, and instead export the same exports as `0x.js`'s sub-packages: `@0xproject/contract-wrappers`, `@0xproject/order-utils` and `@0xproject/order-watcher` (#963)

## v1.0.1-rc.3 - _August 14, 2018_

    * Dependencies updated
    * Update ecSignOrderHashAsync to return the signature as a string for immediate use in contracts (#914)

## v1.0.1-rc.2 - _July 26, 2018_

    * Fixed bug caused by importing non-existent dep

## v1.0.1-rc.1 - _July 26, 2018_

    * Dependencies updated

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.2 - _July 19, 2018_

    * Remove `zeroEx.assetData`  and instead re-export it's static functions directly off `ZeroEx`

## v1.0.0-rc.1 - _July 19, 2018_

    * Remove tokenRegistry wrapper (#863)
    * Rename `zeroEx.token` to `zeroEx.erc20Token`, and add `zeroEx.erc721Token` (#863)
    * Rename `zeroEx.proxy` to `zeroEx.erc20Proxy` and add `zeroEx.erc721Proxy` (#863)
    * Refactored `ZeroEx.isValidSignature` to `zeroEx.isValidSignatureAsync`. It is now async so that it can verify contract-dependent signature types (#863)
    * Refactored `signOrderHashAsync` to `ecSignOrderHashAsync`. There are now many non-ECSignature ways to sign orders too. (#863)
    * Removed `createOrderWatcherAsync` method. Will be added back once OrderWatcher is refactored for V2 (#863)
    * 0x.js exports renamed contract events and event arg types (#863)
    * Export `ZeroEx.assetData` with methods to decode/encode assetData fields found in 0x orders (#884)

## v0.38.6 - _July 18, 2018_

    * Dependencies updated

## v0.38.5 - _July 9, 2018_

    * Dependencies updated

## v0.38.4 - _June 19, 2018_

    * Dependencies updated

## v0.38.3 - _May 29, 2018_

    * Dependencies updated

## v0.38.2 - _May 29, 2018_

    * Dependencies updated

## v0.38.1 - _May 29, 2018_

    * Dependencies updated

## v0.38.0 - _May 22, 2018_

    * Renamed createOrderStateWatcher to createOrderWatcherAsync since it is now async (#579)
    * Renamed ZeroExError to ContractWrappersErrors since they now lives in the @0xproject/contract-wrappers subpackage (#579)

## v0.37.2 - _May 4, 2018_

    * Dependencies updated

## v0.37.1 - _May 4, 2018_

    * Dependencies updated

## v0.37.0 - _May 4, 2018_

    * Fixed expiration watcher comparator to handle orders with equal expiration times (#526)
    * Update Web3 Provider Engine to 14.0.4 (#555)
    * Add `zeroEx.getProvider()` (#559)
    * Move `ZeroExError.InvalidSignature` to `@0xproject/order-utils` `OrderError.InvalidSignature` (#559)

## v0.36.3 - _April 18, 2018_

    * Move @0xproject/migrations to devDependencies

## v0.36.2 - _April 18, 2018_

    * Dependencies updated

## v0.36.1 - _April 18, 2018_

    * Internal changes and refactoring
    * Fix redundant expired order removal bug (#527)

## v0.36.0 - _April 11, 2018_

    * Moved Web3.Provider to `@0xproject/types:Provider` (#501)
    * Add `zeroEx.exchange.getOrderStateAsync` to allow obtaining current OrderState for a signedOrder (#510)

## v0.35.0 - _April 2, 2018_

    * Removed `ZeroExError.TransactionMiningTimeout` and moved it to '@0xproject/web3-wrapper' `Web3WrapperErrors.TransactionMiningTimeout` (#485)

## v0.34.0 - _April 2, 2018_

    * Fix the bug causing `zeroEx.exchange.fillOrdersUpToAsync` validation to fail if there were some extra orders passed (#470)
    * Remove automatic instantiation of `zeroEx.orderStateWatcher` (#488)
    * Add `zeroEx.createOrderStateWatcher` to allow creating arbitrary number of OrderStateWatchers (#488)
    * Added `stateLayer` setting to `OrderStateWatcherConfig` so OrderStateWatcher can be set to monitor different blockchain state layers (#488)

## v0.33.2 - _March 17, 2018_

    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)
    * Consolidate `Order`, `SignedOrder`, and `ECSignature` into the `@0xproject/types` package (#456)

## v0.33.1 - _March 7, 2018_

    * Add missing EthersJs typescript typings as dependency

## v0.33.0 - _March 3, 2018_

    * Validate and lowercase all addresses in public methods (#373)
    * Improve validation to force passing contract addresses on private networks (#385)
    * Change `LogErrorContractEventArgs.errorId` type from `BigNumber` to `number` (#413)
    * Rename all public `_unsubscribeAll` methods to `unsubscribeAll` (#415)
    * Move web3 typings from devDep to dep since cannot use this package without it (#429)

## v0.32.2 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.32.1 - _February 6, 2018_

    * Reorganized `BlockParamLiteral` export into `@0xproject/types` package (#355)
    * Now using `abi-gen` package to generate ContractEventArgs types (#371)

## v0.32.0 - _February 4, 2018_

    * Add `zeroEx.etherToken.getContractAddressIfExists` (#350)
    * Fixed the bug causing order watcher to throw if there is an event with the same signature but different indexed fields (#366)

## v0.31.1 - _January 31, 2018_

    * Fix the bug causing order watcher to throw if makerToken === zrx (#357)

## v0.31.0 - _January 29, 2018_

    * Add the `shouldAddPersonalMessagePrefix` parameter to `signOrderHashAsync` so that the caller can decide on whether to add the personalMessage prefix before relaying the request to the signer. Parity Signer, Ledger and TestRPC add the prefix themselves, Metamask expects it to have already been added. (#349)

## v0.30.2 - _January 28, 2018_

    * Add Rinkeby testnet addresses to artifacts  (#337)
    * Move @0xproject/types to dependencies from devDependencies fixing missing type errors

## v0.30.1 - _January 23, 2018_

    * Fix a bug allowing negative fill values  (#212)
    * Fix a bug that made it impossible to pass a custom ZRX address  (#341)

## v0.30.0 - _January 16, 2018_

    * Add an error parameter to the order watcher callback (#312)
    * Fix a bug making it impossible to catch some errors from awaitTransactionMinedAsync (#312)
    * Fix a bug in fillOrdersUpTo validation making it impossible to fill up to if user doesn't have enough balance to fully fill all the orders (#321)

## v0.29.1 - _January 10, 2018_

    * Fixed bignumber config issue #301 (#305)

## v0.29.0 - _December 27, 2017_

    * Assert baseUnit amount supplied to `toUnitAmount` is integer amount. (#287)
    * `toBaseUnitAmount` throws if amount supplied has too many decimals (#287)

## v0.28.0 - _December 19, 2017_

    * Add `etherTokenAddress` arg to `depositAsync` and `withdrawAsync` methods on `zeroEx.etherToken` (#267)
    * Removed accidentally included `unsubscribeAll` method from `zeroEx.proxy`, `zeroEx.etherToken` and `zeroEx.tokenRegistry` (#267)
    * Removed `etherTokenContractAddress` from `ZeroEx` constructor arg `ZeroExConfig` (#267)
    * Rename `SubscriptionOpts` to `BlockRange` (#272)
    * Add `zeroEx.etherToken.subscribe`, `zeroEx.etherToken.unsubscribe`, `zeroEx.etherToken.unsubscribeAll` (#277)
    * Add `zeroEx.etherToken.getLogsAsync` (#277)
    * Add new public types `BlockParamLiteral`, `EtherTokenEvents`, `EtherTokenContractEventArgs`, `DepositContractEventArgs`, `WithdrawalContractEventArgs` (#277)
    * Support `Deposit` and `Withdraw` events on etherToken (#277)
    * Improve the error message when taker is not a string (#278)

## v0.27.1 - _November 27, 2017_

    * Export `TransactionOpts` type

## v0.27.0 - _November 27, 2017_

    * Make `ZeroExConfig` required parameter of `ZeroEx` constructor (#233)
    * Add a required property `networkId` to `ZeroExConfig` (#233)
    * Make all `getContractAddress` functions, `zeroEx.exchange.subscribe`, `zeroEx.exchange.getZRXTokenAddress` sync (#233)
    * Remove `ZeroExError.ContractNotFound` and replace it with contract-specific errors (#233)
    * Make `DecodedLogEvent<A>` contain `LogWithDecodedArgs<A>` under log key instead of merging it in like web3 does (#234)
    * Rename `removed` to `isRemoved` in `DecodedLogEvent<A>` (#234)
    * Add config allowing to specify gasPrice and gasLimit for every transaction sending method (#235)
    * All transaction sending methods now call `estimateGas` if no gas amount was supplied (#235)
    * Modify order validation methods to validate against the `latest` block, not against the `pending` block (#236)

## v0.26.0 - _November 20, 2017_

    * Add post-formatter for logs converting `blockNumber`, `logIndex`, `transactionIndex` from hexes to numbers (#231)
    * Remove support for Async callback types when used in Subscribe functions (#222)
    * In OrderWatcher subscribe to ZRX Token Transfer and Approval events when maker token is different (#225)

## v0.25.1 - _November 12, 2017_

    * Standardise on Cancelled over Canceled (#217)
    * Add missing `DecodedLogEvent` type to exported types (#205)
    * Normalized the transactionReceipt status to be `null|0|1`, 1 meaning transaction execution successful, 0 unsuccessful and `null` if it is a pre-byzantinium transaction. (#200)

## v0.23.0 - _November 11, 2017_

    * Fixed unhandled promise rejection error in subscribe methods (#209)
    * Subscribe callbacks now receive an error object as their first argument

## v0.22.6 - _November 9, 2017_

    * Add a timeout parameter to transaction awaiting (#206)

## v0.22.5 - _November 6, 2017_

    * Re-publish v0.22.4 to fix publishing issue

## v0.22.4 - _October 24, 2017_

    * Upgraded bignumber.js to a new version that ships with native typings

## v0.22.3 - _October 24, 2017_

    * Fixed an issue with new version of testrpc and unlimited proxy allowance (#199)

## v0.22.2 - _October 23, 2017_

    * Fixed rounding of maker fill amount and incorrect validation of partial fees (#197)

## v0.22.0 - _October 15, 2017_

    * Started using `OrderFillRequest` interface instead of `OrderFillOrKillRequest` interface for `zeroEx.exchange.batchFillOrKill` (#187)
    * Removed `OrderFillOrKillRequest` (#187)

## v0.21.4 - _October 12, 2017_

    * Made 0x.js more type-safe by making `getLogsAsync` and `subscribe/subscribeAsync` generics parametrized with arg type (#194)

## v0.21.3 - _October 11, 2017_

    * Fixed a bug causing order fills to throw `INSUFFICIENT_TAKER_ALLOWANCE` (#193)

## v0.21.2 - _October 10, 2017_

    * Exported `ContractEventArg` as a public type (#190)

## v0.21.1 - _October 10, 2017_

    * Fixed a bug in subscriptions (#189)

## v0.21.0 - _October 9, 2017_

    * Complete rewrite of subscription logic (#182)
    * Subscriptions no longer return historical logs. If you want them - use `getLogsAsync`
    * Subscriptions now use [ethereumjs-blockstream](https://github.com/ethereumjs/ethereumjs-blockstream) under the hood
    * Subscriptions correctly handle block re-orgs (forks)
    * Subscriptions correctly backfill logs (connection problems)
    * They no longer setup filters on the underlying nodes, so you can use them with infura without a filter Subprovider
    * Removed `ContractEventEmitter` and added `LogEvent`
    * Renamed `zeroEx.token.subscribeAsync` to `zeroEx.token.subscribe`
    * Added `zeroEx.token.unsubscribe` and `zeroEx.exchange.unsubscribe`
    * Renamed `zeroEx.exchange.stopWatchingAllEventsAsync` to `zeroEx.exhange.unsubscribeAll`
    * Renamed `zeroEx.token.stopWatchingAllEventsAsync` to `zeroEx.token.unsubscribeAll`
    * Fixed the batch fills validation by emulating all balance & proxy allowance changes (#185)

## v0.20.0 - _October 4, 2017_

    * Add `zeroEx.token.getLogsAsync` (#178)
    * Add `zeroEx.exchange.getLogsAsync` (#178)
    * Fixed fees validation when one of the tokens transferred is ZRX (#181)

## v0.19.0 - _September 28, 2017_

    * Made order validation optional  (#172)
    * Added Ropsten testnet support (#173)
    * Fixed a bug causing awaitTransactionMinedAsync to DDos backend nodes (#175)

## v0.18.0 - _September 25, 2017_

    * Added `zeroEx.exchange.validateOrderFillableOrThrowAsync` to simplify orderbook pruning (#170)

## v0.17.0 - _September 25, 2017_

    * Made `zeroEx.exchange.getZRXTokenAddressAsync` public (#171)

## v0.16.0 - _September 19, 2017_

    * Added the ability to specify custom contract addresses to be used with 0x.js (#165)
    * ZeroExConfig.exchangeContractAddress
    * ZeroExConfig.tokenRegistryContractAddress
    * ZeroExConfig.etherTokenContractAddress
    * Added `zeroEx.tokenRegistry.getContractAddressAsync` (#165)

## v0.15.0 - _September 7, 2017_

    * Added the ability to specify a historical `blockNumber` at which to query the blockchain's state when calling a token or exchange method (#161)

## v0.14.2 - _September 6, 2017_

    * Fixed an issue with bignumber.js types not found (#160)

## v0.14.1 - _September 6, 2017_

    * Fixed an issue with Artifact type not found (#159)

## v0.14.0 - _September 5, 2017_

    * Added `zeroEx.exchange.throwLogErrorsAsErrors` method to public interface (#157)
    * Fixed an issue with overlapping async intervals in `zeroEx.awaitTransactionMinedAsync` (#157)
    * Fixed an issue with log decoder returning `BigNumber`s as `strings` (#157)

## v0.13.0 - _September 5, 2017_

    * Made all the functions submitting transactions to the network to immediately return transaction hash (#151)
    * Added `zeroEx.awaitTransactionMinedAsync` (#151)
    * Added `TransactionReceiptWithDecodedLogs`, `LogWithDecodedArgs`, `DecodedLogArgs` to public types (#151)
    * Added signature validation to `validateFillOrderThrowIfInvalidAsync` (#152)

## v0.12.1 - _September 1, 2017_

    * Added the support for web3@1.x.x provider (#142)
    * Added the optional `zeroExConfig`  parameter to the constructor of `ZeroEx` (#139)
    * Added the ability to specify `gasPrice` when instantiating `ZeroEx` (#139)

## v0.11.0 - _August 23, 2017_

    * Added `zeroEx.token.setUnlimitedProxyAllowanceAsync` (#137)
    * Added `zeroEx.token.setUnlimitedAllowanceAsync` (#137)
    * Added `zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS` (#137)

## v0.10.4 - _August 23, 2017_

    * Fixed a bug where checksummed addresses were being pulled from artifacts and not lower-cased. (#135)

## v0.10.1 - _August 23, 2017_

    * Added `zeroEx.exchange.validateFillOrderThrowIfInvalidAsync` (#128)
    * Added `zeroEx.exchange.validateFillOrKillOrderThrowIfInvalidAsync` (#128)
    * Added `zeroEx.exchange.validateCancelOrderThrowIfInvalidAsync` (#128)
    * Added `zeroEx.exchange.isRoundingErrorAsync` (#128)
    * Added `zeroEx.proxy.getContractAddressAsync` (#130)
    * Added `zeroEx.tokenRegistry.getTokenAddressesAsync` (#132)
    * Added `zeroEx.tokenRegistry.getTokenAddressBySymbolIfExistsAsync` (#132)
    * Added `zeroEx.tokenRegistry.getTokenAddressByNameIfExistsAsync` (#132)
    * Added `zeroEx.tokenRegistry.getTokenBySymbolIfExistsAsync` (#132)
    * Added `zeroEx.tokenRegistry.getTokenByNameIfExistsAsync` (#132)
    * Added clear error message when checksummed address is passed to a public method (#124)
    * Fixes the description of `shouldThrowOnInsufficientBalanceOrAllowance` in docs (#127)

## v0.9.3 - _August 21, 2017_

    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

## v0.9.2 - _August 20, 2017_

    * *This version was unpublished because of a publishing issue.*
    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

## v0.9.1 - _August 15, 2017_

    * Fixed the bug causing `zeroEx.token.getBalanceAsync()` to fail if no addresses available (#120)

## v0.9.0 - _July 25, 2017_

    * Migrated to the new version of smart contracts (#101)
    * Removed the ability to call methods on multiple authorized Exchange smart contracts (#106)
    * Made `zeroEx.getOrderHashHex` a static method (#107)
    * Cached `net_version` requests and invalidate the cache on calls to `setProvider` (#95)
    * Renamed `zeroEx.exchange.batchCancelOrderAsync` to `zeroEx.exchange.batchCancelOrdersAsync`
    * Renamed `zeroEx.exchange.batchFillOrderAsync` to `zeroEx.exchange.batchFillOrdersAsync`
    * Updated to typescript v2.4 (#104)
    * Fixed an issue with incorrect balance/allowance validation when ZRX is one of the tokens traded (#109)

## v0.8.0 - _July 3, 2017_

    * Added the ability to call methods on different authorized versions of the Exchange smart contract (#82)
    * Updated contract artifacts to reflect latest changes to the smart contracts (0xproject/contracts#59)
    * Added `zeroEx.proxy.isAuthorizedAsync` and `zeroEx.proxy.getAuthorizedAddressesAsync` (#89)
    * Added `zeroEx.token.subscribeAsync` (#90)
    * Made contract invalidation functions private (#90)
    * `zeroEx.token.invalidateContractInstancesAsync`
    * `zeroEx.exchange.invalidateContractInstancesAsync`
    * `zeroEx.proxy.invalidateContractInstance`
    * `zeroEx.tokenRegistry.invalidateContractInstance`
    * Fixed the bug where `zeroEx.setProviderAsync` didn't invalidate etherToken contract's instance

## v0.7.1 - _June 25, 2017_

    * Added the ability to convert Ether to wrapped Ether tokens and back via `zeroEx.etherToken.depostAsync` and `zeroEx.etherToken.withdrawAsync` (#81)

## v0.7.0 - _June 21, 2017_

    * Added Kovan smart contract artifacts (#78)
    * Started returning fillAmount from `fillOrderAsync` and `fillUpToAsync` (#72)
    * Started returning cancelledAmount from `cancelOrderAsync` (#72)
    * Renamed type `LogCancelArgs` to `LogCancelContractEventArgs` and `LogFillArgs` to `LogFillContractEventArgs`

## v0.6.2 - _June 20, 2017_

    * Reduced bundle size
    * Improved documentation

## v0.6.1 - _June 18, 2017_

    * Improved documentation

## v0.6.0 - _June 18, 2017_

    * Made `ZeroEx` class accept `Web3Provider` instance instead of `Web3` instance
    * Added types for contract event arguments

## v0.5.2 - _June 14, 2017_

    * Fixed the bug in `postpublish` script that caused that only unminified UMD bundle was uploaded to release page

## v0.5.1 - _June 14, 2017_

    * Added `postpublish` script to publish to Github Releases with assets.
