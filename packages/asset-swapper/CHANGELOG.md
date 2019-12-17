<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.0.2 - _December 17, 2019_

    * Fix gasPrice from `ethgasstation` to be in WEI instead of GWEI (#2393)
    * Add aggregator utils (#2353)

## v3.0.1 - _December 9, 2019_

    * Dependencies updated

## v3.0.0 - _December 2, 2019_

    * Refactor of logic for marketBuy/marketSell order pruning and selecting, introduced protocol fees, and refactored types used by the package (#2272)
    * Incorporate paying protocol fees. (#2350)
    * Update BigNumber version to ~9.0.0 (#2342)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v2.1.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v2.1.0-beta.3 - _November 20, 2019_

    * Refactor of logic for marketBuy/marketSell order pruning and selecting, introduced protocol fees, and refactored types used by the package (#2272)
    * Incorporate paying protocol fees. (#2350)

## v2.1.0-beta.2 - _November 7, 2019_

    * Update BigNumber version to ~9.0.0 (#2342)

## v2.1.0-beta.1 - _November 7, 2019_

    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v2.1.0-beta.0 - _October 3, 2019_

    * Dependencies updated

## v2.0.0 - _September 17, 2019_

    * AssetSwapper to use `@0x/orderbook` to fetch and subscribe to order updates (#2056)

## v1.0.3 - _September 3, 2019_

    * Dependencies updated

## v1.0.2 - _August 22, 2019_

    * Dependencies updated

## v1.0.1 - _August 8, 2019_

    * Dependencies updated

## v1.0.0 - _July 31, 2019_

    * Added optimization utils to consumer output (#1988)
    * Expanded test coverage (#1980)

## v0.0.5 - _July 24, 2019_

    * Dependencies updated

## v0.0.4 - _July 15, 2019_

    * Switched MarketOperation type to enum and expanded default constants configuration (#1959)
    * Added additional options to control asset-swapper behavior and optimized consumer output (#1966)

## v0.0.3 - _July 13, 2019_

    * Dependencies updated

## v0.0.2 - _July 13, 2019_

    * Dependencies updated

## v0.0.1 - _Invalid date_

    * Refactored asset-buyer into asset-swapper to support ERC<>ERC marketSell and marketBuy operations (#1845)
