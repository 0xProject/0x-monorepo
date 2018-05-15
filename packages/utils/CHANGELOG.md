<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v0.6.1 - _May 5, 2018_

    * Dependencies updated

## v0.6.0 - _May 4, 2018_

    * Update ethers-contracts to ethers.js (#540)

## v0.5.2 - _April 18, 2018_

    * Export NULL_BYTES constant (#500)

## v0.5.1 - _April 11, 2018_

    * Dependencies updated

## v0.5.0 - _April 2, 2018_

    * Make `AbiDecoder.addABI` public (#485)

## v0.4.4 - _April 2, 2018_

    * Dependencies updated

## v0.4.3 - _March 17, 2018_

    * Add `@types/node` to dependencies since `intervalUtils` has the `NodeJS` type as part of its public interface.

## v0.4.2 - _March 17, 2018_

    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)

## v0.4.0 - _March 3, 2018_

    * Use `ethers-contracts` as a backend to decode event args (#413)
    * Move web3 types from devDep to dep since required when using this package (#429)

## v0.3.2 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.3.0 - _February 4, 2018_

    * Fix a bug related to event signature collisions (argument indexes aren't included in event signatures) in the abi_decoder. The decoder used to throw on unknown events with identical signatures as a known event (except indexes). (#366)

## v0.2.0 - _January 16, 2018_

    * Add `onError` parameter to `intervalUtils.setAsyncExcludingInterval` (#312)
    * Add `intervalUtils.setInterval` (#312)
