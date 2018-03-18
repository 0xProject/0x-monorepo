# CHANGELOG

## v0.3.0 _March 18, 2018_

    * Add `web3Wrapper.takeSnapshotAsync`, `web3Wrapper.revertSnapshotAsync`, `web3Wrapper.mineBlockAsync`, `web3Wrapper.increaseTimeAsync` (#426)
    * Add `web3Wrapper.isZeroExWeb3Wrapper` for runtime instanceOf checks (#426)
    * Add a `getProvider` method (#444)

## v0.2.0 _March 4, 2018_

    * Ensure all returned user addresses are lowercase (#373)
    * Add `web3Wrapper.callAsync` (#413)
    * Make `web3Wrapper.estimateGas` accept whole `txData` instead of `data` (#413)
    * Remove `web3Wrapper.getContractInstance` (#413)

## v0.1.12 _February 9, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)
