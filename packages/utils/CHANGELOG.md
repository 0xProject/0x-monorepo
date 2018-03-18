# CHANGELOG

## v0.4.3 - _March 18, 2018_

    * Add `@types/node` to dependencies since `intervalUtils` has the `NodeJS` type as part of its public interface.

## v0.4.2 - _March 18, 2018_

    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)

## v0.4.0 - _March 4, 2018_

    * Use `ethers-contracts` as a backend to decode event args (#413)
    * Move web3 types from devDep to dep since required when using this package (#429)

## v0.3.2 - _February 9, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.3.0 - _February 5, 2018_

    * Fix a bug related to event signature collisions (argument indexes aren't included in event signatures) in the abi_decoder. The decoder used to throw on unknown events with identical signatures as a known event (except indexes). (#366)

## v0.2.0 - _January 17, 2018_

    * Add `onError` parameter to `intervalUtils.setAsyncExcludingInterval` (#312)
    * Add `intervalUtils.setInterval` (#312)
