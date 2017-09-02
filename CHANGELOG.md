# CHANGELOG

v0.12.0 - _September 2, 2017_
    * Added the support for web3@1.x.x provider (#142)
    * Added the optional `zeroExConfig`  parameter to the constructor of `ZeroEx` (#139)
    * Added the ability to specify `gasPrice` when instantiating `ZeroEx` (#139)

v0.11.0 - _August 24, 2017_
------------------------
    * Added `zeroEx.token.setUnlimitedProxyAllowanceAsync` (#137)
    * Added `zeroEx.token.setUnlimitedAllowanceAsync` (#137)
    * Added `zeroEx.token.UNLIMITED_ALLOWANCE_IN_BASE_UNITS` (#137)

v0.10.4 - _Aug 24, 2017_
------------------------
    * Fixed a bug where checksummed addresses were being pulled from artifacts and not lower-cased. (#135)

v0.10.1 - _Aug 24, 2017_
------------------------
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

v0.9.3 - _Aug 22, 2017_
------------------------
    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

v0.9.2 - _Aug 21, 2017_
------------------------
    * *This version was unpublished because of a publishing issue.*
    * Update contract artifacts to include latest Kovan and Mainnet deploys (#118)

v0.9.1 - _Aug. 16, 2017_
------------------------
    * Fixed the bug causing `zeroEx.token.getBalanceAsync()` to fail if no addresses available (#120)

v0.9.0 - _Jul. 26, 2017_
------------------------
    * Migrated to the new version of smart contracts (#101)
    * Removed the ability to call methods on multiple authorized Exchange smart contracts (#106)
    * Made `zeroEx.getOrderHashHex` a static method (#107)
    * Cached `net_version` requests and invalidate the cache on calls to `setProvider` (#95)
    * Renamed `zeroEx.exchange.batchCancelOrderAsync` to `zeroEx.exchange.batchCancelOrdersAsync`
    * Renamed `zeroEx.exchange.batchFillOrderAsync` to `zeroEx.exchange.batchFillOrdersAsync`
    * Updated to typescript v2.4 (#104)
    * Fixed an issue with incorrect balance/allowance validation when ZRX is one of the tokens traded (#109)

v0.8.0 - _Jul. 4, 2017_
------------------------
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

v0.7.1 - _Jun. 26, 2017_
------------------------
    * Added the ability to convert Ether to wrapped Ether tokens and back via `zeroEx.etherToken.depostAsync` and `zeroEx.etherToken.withdrawAsync` (#81)

v0.7.0 - _Jun. 22, 2017_
------------------------
    * Added Kovan smart contract artifacts (#78)
    * Started returning fillAmount from `fillOrderAsync` and `fillUpToAsync` (#72)
    * Started returning cancelledAmount from `cancelOrderAsync` (#72)
    * Renamed type `LogCancelArgs` to `LogCancelContractEventArgs` and `LogFillArgs` to `LogFillContractEventArgs`

v0.6.2 - _Jun. 21, 2017_
------------------------
    * Reduced bundle size
    * Improved documentation

v0.6.1 - _Jun. 19, 2017_
------------------------
    * Improved documentation

v0.6.0 - _Jun. 19, 2017_
------------------------
    * Made `ZeroEx` class accept `Web3Provider` instance instead of `Web3` instance
    * Added types for contract event arguments

v0.5.2 - _Jun. 15, 2017_
------------------------
    * Fixed the bug in `postpublish` script that caused that only unminified UMD bundle was uploaded to release page

v0.5.1 - _Jun. 15, 2017_
------------------------
    * Added `postpublish` script to publish to Github Releases with assets.
