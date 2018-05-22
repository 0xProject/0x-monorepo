<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v0.3.0 - _May 22, 2018_

    * Properly export the executable binary (#588)

## v0.2.13 - _May 4, 2018_

    * Dependencies updated

## v0.2.12 - _May 4, 2018_

    * Dependencies updated

## v0.2.11 - _April 18, 2018_

    * Dependencies updated

## v0.2.10 - _April 11, 2018_

    * Dependencies updated

## v0.2.9 - _April 2, 2018_

    * Dependencies updated

## v0.2.8 - _April 2, 2018_

    * Dependencies updated

## v0.2.5 - _March 17, 2018_

    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)

## v0.2.4 - _March 3, 2018_

    * Add a `backend` parameter that allows you to specify the Ethereum library you use in your templates (`web3` or `ethers`). Ethers auto-converts small ints to numbers whereas Web3 doesn't. Defaults to `web3` (#413)
    * Add support for [tuple types](https://solidity.readthedocs.io/en/develop/abi-spec.html#handling-tuple-types) (#413)
    * Add `hasReturnValue` to context data (#413)

## v0.2.1 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.2.0 - _February 6, 2018_

    * Added CLI options for explicit specifying location of partials and main template (#346)
    * Added CLI option to specify networkId, adding support for the JSON artifact format found in @0xproject/contracts (#388)

## v0.1.0 - _January 10, 2018_

    * Fixed array typings with union types (#295)
    * Add event ABIs to context data passed to templates (#302)
    * Add constructor ABIs to context data passed to templates (#304)
