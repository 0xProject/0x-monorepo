<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.0.2 - _October 4, 2018_

    * Dependencies updated

## v2.0.1 - _October 2, 2018_

    * Dependencies updated

## v2.0.0 - _September 28, 2018_

    * Make abi_decoder compatible with ethers ^4.0.0 (#1069)

## v1.0.11 - _September 25, 2018_

    * Dependencies updated

## v1.0.10 - _September 25, 2018_

    * Dependencies updated

## v1.0.9 - _September 21, 2018_

    * Dependencies updated

## v1.0.8 - _September 5, 2018_

    * Dependencies updated

## v1.0.7 - _August 27, 2018_

    * Dependencies updated

## v1.0.6 - _August 24, 2018_

    * Dependencies updated

## v1.0.5 - _August 13, 2018_

    * Increased BigNumber decimal precision from 20 to 78 (#807)
    * Store different ABIs for events with same function signature and different amount of indexed arguments (#933)

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Add `AbortController` polyfill to `fetchAsync` (#903)

## v1.0.0 - _July 19, 2018_

    * Add `fetchAsync` which adds a default timeout to all requests (#874)

## v0.7.3 - _July 18, 2018_

    * Dependencies updated

## v0.7.2 - _July 9, 2018_

    * Added errorUtils.spawnSwitchErr
    * Add logUtils.warn (#589)
    * Fixes uncaught Error in abi_decoder (#763)

## v0.7.1 - _June 19, 2018_

    * Dependencies updated

## v0.7.0 - _May 31, 2018_

    * Incorrect publish that was unpublished

## v0.6.2 - _May 22, 2018_

    * Dependencies updated

## v0.6.1 - _May 4, 2018_

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
