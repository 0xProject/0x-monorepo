# CHANGELOG

v0.9.0 - TBD
------------------------
    * Move `zeroEx.exchange.getAvailableContractAddressesAsync` to `zeroEx.getAvailableExchangeContractAddressesAsync` (#94)
    * Move `zeroEx.exchange.getProxyAuthorizedContractAddressesAsync` to `zeroEx.getProxyAuthorizedExchangeContractAddressesAsync` (#94)
    * Rename `zeroEx.exchange.batchCancelOrderAsync` to `zeroEx.exchange.batchCancelOrdersAsync`
    * Rename `zeroEx.exchange.batchFillOrderAsync` to `zeroEx.exchange.batchFillOrdersAsync`

v0.8.0 - _Jul. 4, 2017_
------------------------
    * Add the ability to call methods on different authorized versions of the Exchange smart contract (#82)
    * Update contract artifacts to reflect latest changes to the smart contracts (0xproject/contracts#59)
    * Add `zeroEx.proxy.isAuthorizedAsync` and `zeroEx.proxy.getAuthorizedAddressesAsync` (#89)
    * Add `zeroEx.token.subscribeAsync` (#90)
    * Make contract invalidation functions private (#90)
        * `zeroEx.token.invalidateContractInstancesAsync`
        * `zeroEx.exchange.invalidateContractInstancesAsync`
        * `zeroEx.proxy.invalidateContractInstance`
        * `zeroEx.tokenRegistry.invalidateContractInstance`
    * Fix the bug where `zeroEx.setProviderAsync` didn't invalidate etherToken contract's instance

v0.7.1 - _Jun. 26, 2017_
------------------------
    * Add the ability to convert Ether to wrapped Ether tokens and back via `zeroEx.etherToken.depostAsync` and `zeroEx.etherToken.withdrawAsync` (#81)

v0.7.0 - _Jun. 22, 2017_
------------------------
    * Add Kovan smart contract artifacts (#78)
    * Return fillAmount from `fillOrderAsync` and `fillUpToAsync` (#72)
    * Return cancelledAmount from `cancelOrderAsync` (#72)
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
