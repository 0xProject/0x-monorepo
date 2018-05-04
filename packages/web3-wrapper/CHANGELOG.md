<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v0.6.3 - _May 5, 2018_

    * Dependencies updated

## v0.6.2 - _May 4, 2018_

    * Dependencies updated

## v0.6.1 - _April 18, 2018_

    * Dependencies updated

## v0.6.0 - _April 11, 2018_

    * Make `isAddress` and `toWei` static (#501)
    * Add static methods `toUnitAmount` and `toBaseUnitAmount` (#501)

## v0.5.0 - _April 2, 2018_

    * Add `web3Wrapper.awaitTransactionMinedAsync` (#485)
    * Add a public field `abiDecoder: AbiDecoder` which allows you to add your ABIs that are later used to decode logs (#485)
    * Export enum `Web3WrapperErrors` with a single value so far: `TransactionMiningTimeout` (#485)

## v0.4.0 - _April 2, 2018_

    * Rename `signTransactionAsync` to `signMessageAsync` for clarity (#465)

## v0.3.0 - _March 17, 2018_

    * Add `web3Wrapper.takeSnapshotAsync`, `web3Wrapper.revertSnapshotAsync`, `web3Wrapper.mineBlockAsync`, `web3Wrapper.increaseTimeAsync` (#426)
    * Add `web3Wrapper.isZeroExWeb3Wrapper` for runtime instanceOf checks (#426)
    * Add a `getProvider` method (#444)

## v0.2.0 - _March 3, 2018_

    * Ensure all returned user addresses are lowercase (#373)
    * Add `web3Wrapper.callAsync` (#413)
    * Make `web3Wrapper.estimateGas` accept whole `txData` instead of `data` (#413)
    * Remove `web3Wrapper.getContractInstance` (#413)

## v0.1.12 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)
