# CHANGELOG

## v0.29.1 - _January 11, 2018_

    * Fixed bignumber config issue #301 (#305)

## v0.29.0 - _December 28, 2017_

    * Assert baseUnit amount supplied to `toUnitAmount` is integer amount. (#287)
    * `toBaseUnitAmount` throws if amount supplied has too many decimals (#287)

## v0.28.0 - _December 20, 2017_

    * Add `etherTokenAddress` arg to `depositAsync` and `withdrawAsync` methods on `zeroEx.etherToken` (#267)
    * Removed accidentally included `unsubscribeAll` method from `zeroEx.proxy`, `zeroEx.etherToken` and `zeroEx.tokenRegistry` (#267)
    * Removed `etherTokenContractAddress` from `ZeroEx` constructor arg `ZeroExConfig` (#267)
    * Rename `SubscriptionOpts` to `BlockRange` (#272)
    * Add `zeroEx.etherToken.subscribe`, `zeroEx.etherToken.unsubscribe`, `zeroEx.etherToken.unsubscribeAll` (#277)
    * Add `zeroEx.etherToken.getLogsAsync` (#277)
    * Add new public types `BlockParamLiteral`, `EtherTokenEvents`, `EtherTokenContractEventArgs`, `DepositContractEventArgs`, `WithdrawalContractEventArgs` (#277)
    * Support `Deposit` and `Withdraw` events on etherToken (#277)
    * Improve the error message when taker is not a string (#278)

## v0.27.1 - _November 28, 2017_

    * Export `TransactionOpts` type

## v0.27.0 - _November 28, 2017_

    * Make `ZeroExConfig` required parameter of `ZeroEx` constructor (#233)
    * Add a required property `networkId` to `ZeroExConfig` (#233)
    * Make all `getContractAddress` functions, `zeroEx.exchange.subscribe`, `zeroEx.exchange.getZRXTokenAddress` sync (#233)
    * Remove `ZeroExError.ContractNotFound` and replace it with contract-specific errors (#233)
    * Make `DecodedLogEvent<A>` contain `LogWithDecodedArgs<A>` under log key instead of merging it in like web3 does (#234)
    * Rename `removed` to `isRemoved` in `DecodedLogEvent<A>` (#234)
    * Add config allowing to specify gasPrice and gasLimit for every transaction sending method (#235)
    * All transaction sending methods now call `estimateGas` if no gas amount was supplied (#235)
    * Modify order validation methods to validate against the `latest` block, not against the `pending` block (#236)

## v0.26.0 - _November 21, 2017_

    * Add post-formatter for logs converting `blockNumber`, `logIndex`, `transactionIndex` from hexes to numbers (#231)
    * Remove support for Async callback types when used in Subscribe functions (#222)
    * In OrderWatcher subscribe to ZRX Token Transfer and Approval events when maker token is different (#225)

## v0.25.1 - _November 13, 2017_

    * Standardise on Cancelled over Canceled (#217)
    * Add missing `DecodedLogEvent` type to exported types (#205)
    * Normalized the transactionReceipt status to be `null|0|1`, 1 meaning transaction execution successful, 0 unsuccessful and `null` if it is a pre-byzantinium transaction. (#200)

## v0.23.0 - _November 12, 2017_

    * Fixed unhandled promise rejection error in subscribe methods (#209)
    * Subscribe callbacks now receive an error object as their first argument

## v0.22.6 - _November 10, 2017_

    * Add a timeout parameter to transaction awaiting (#206)

## v0.22.5 - _November 7, 2017_

    * Re-publish v0.22.4 to fix publishing issue

## v0.22.4 - _October 25, 2017_

    * Upgraded bignumber.js to a new version that ships with native typings

## v0.22.3 - _October 25, 2017_

    * Fixed an issue with new version of testrpc and unlimited proxy allowance (#199)

## v0.22.2 - _October 24, 2017_

    * Fixed rounding of maker fill amount and incorrect validation of partial fees (#197)

## v0.22.0 - _October 16, 2017_

    * Started using `OrderFillRequest` interface instead of `OrderFillOrKillRequest` interface for `zeroEx.exchange.batchFillOrKill` (#187)
    * Removed `OrderFillOrKillRequest` (#187)

## v0.21.4 - _October 13, 2017_

    * Made 0x.js more type-safe by making `getLogsAsync` and `subscribe/subscribeAsync` generics parametrized with arg type (#194)

## v0.21.3 - _October 12, 2017_

    * Fixed a bug causing order fills to throw `INSUFFICIENT_TAKER_ALLOWANCE` (#193)

## v0.21.2 - _October 11, 2017_

    * Exported `ContractEventArg` as a public type (#190)

## v0.21.1 - _October 11, 2017_

    * Fixed a bug in subscriptions (#189)

## v0.21.0 - _October 10, 2017_

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

## v0.20.0 - _October 5, 2017_

    * Add `zeroEx.token.getLogsAsync` (#178)
    * Add `zeroEx.exchange.getLogsAsync` (#178)
    * Fixed fees validation when one of the tokens transferred is ZRX (#181)

## v0.19.0 - _September 29, 2017_

    * Made order validation optional  (#172)
    * Added Ropsten testnet support (#173)
    * Fixed a bug causing awaitTransactionMinedAsync to DDos backend nodes (#175)

## v0.18.0 - _September 26, 2017_

    * Added `zeroEx.exchange.validateOrderFillableOrThrowAsync` to simplify orderbook pruning (#170)

## v0.17.0 - _September 26, 2017_

    * Made `zeroEx.exchange.getZRXTokenAddressAsync` public (#171)

## v0.16.0 - _September 20, 2017_

    * Added the ability to specify custom contract addresses to be used with 0x.js (#165)
        * ZeroExConfig.exchangeContractAddress
        * ZeroExConfig.tokenRegistryContractAddress
        * ZeroExConfig.etherTokenContractAddress
    * Added `zeroEx.tokenRegistry.getContractAddressAsync` (#165)

## v0.15.0 - _September 8, 2017_

    * Added the ability to specify a historical `blockNumber` at which to query the blockchain's state when calling a token or exchange method (#161)

## v0.14.2 - _September 7, 2017_

    * Fixed an issue with bignumber.js types not found (#160)

## v0.14.1 - _September 7, 2017_

    * Fixed an issue with Artifact type not found (#159)

## v0.14.0 - _September 6, 2017_

    * Added `zeroEx.exchange.throwLogErrorsAsErrors` method to public interface (#157)
    * Fixed an issue with overlapping async intervals in `zeroEx.awaitTransactionMinedAsync` (#157)
    * Fixed an issue with log decoder returning `BigNumber`s as `strings` (#157)

## v0.13.0 - _September 6, 2017_

    * Made all the functions submitting transactions to the network to immediately return transaction hash (#151)
    * Added `zeroEx.awaitTransactionMinedAsync` (#151)
    * Added `TransactionReceiptWithDecodedLogs`, `LogWithDecodedArgs`, `DecodedLogArgs` to public types (#151)
    * Added signature validation to `validateFillOrderThrowIfInvalidAsync` (#152)

## v0.12.1 - _September 2, 2017_

    * Added the support for web3@1.x.x provider (#142)
    * Added the optional `zeroExConfig`  parameter to the constructor of `ZeroEx` (#139)
    * Added the ability to specify `gasPrice` when instantiating `ZeroEx` (#139)

## v0.11.0 - _August 24, 2017_

    * Added `zeroEx.token.setUnlimitedProxyAllowanceAsync` (#137)
    * Added `zeroEx.token.setUnlimitedAllowanceAsync` (#137)
    * Added `zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS` (#137)

## v0.10.4 - _Aug 24, 2017_

    * Fixed a bug where checksummed addresses were being pulled from artifacts and not lower-cased. (#135)

## v0.10.1 - _Aug 24, 2017_

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

## v0.9.3 - _Aug 22, 2017_

    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

## v0.9.2 - _Aug 21, 2017_

    * *This version was unpublished because of a publishing issue.*
    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

## v0.9.1 - _Aug. 16, 2017_

    * Fixed the bug causing `zeroEx.token.getBalanceAsync()` to fail if no addresses available (#120)

## v0.9.0 - _Jul. 26, 2017_

    * Migrated to the new version of smart contracts (#101)
    * Removed the ability to call methods on multiple authorized Exchange smart contracts (#106)
    * Made `zeroEx.getOrderHashHex` a static method (#107)
    * Cached `net_version` requests and invalidate the cache on calls to `setProvider` (#95)
    * Renamed `zeroEx.exchange.batchCancelOrderAsync` to `zeroEx.exchange.batchCancelOrdersAsync`
    * Renamed `zeroEx.exchange.batchFillOrderAsync` to `zeroEx.exchange.batchFillOrdersAsync`
    * Updated to typescript v2.4 (#104)
    * Fixed an issue with incorrect balance/allowance validation when ZRX is one of the tokens traded (#109)

## v0.8.0 - _Jul. 4, 2017_

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

## v0.7.1 - _Jun. 26, 2017_

    * Added the ability to convert Ether to wrapped Ether tokens and back via `zeroEx.etherToken.depostAsync` and `zeroEx.etherToken.withdrawAsync` (#81)

## v0.7.0 - _Jun. 22, 2017_

    * Added Kovan smart contract artifacts (#78)
    * Started returning fillAmount from `fillOrderAsync` and `fillUpToAsync` (#72)
    * Started returning cancelledAmount from `cancelOrderAsync` (#72)
    * Renamed type `LogCancelArgs` to `LogCancelContractEventArgs` and `LogFillArgs` to `LogFillContractEventArgs`

## v0.6.2 - _Jun. 21, 2017_

    * Reduced bundle size
    * Improved documentation

## v0.6.1 - _Jun. 19, 2017_

    * Improved documentation

## v0.6.0 - _Jun. 19, 2017_

    * Made `ZeroEx` class accept `Web3Provider` instance instead of `Web3` instance
    * Added types for contract event arguments

## v0.5.2 - _Jun. 15, 2017_

    * Fixed the bug in `postpublish` script that caused that only unminified UMD bundle was uploaded to release page

## v0.5.1 - _Jun. 15, 2017_

    * Added `postpublish` script to publish to Github Releases with assets.
