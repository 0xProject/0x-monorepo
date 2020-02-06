<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v4.1.1 - _February 6, 2020_

    * Fix bug with liquidity source breakdown (#2472)
    * Prune orders before creating a dummy order for the Sampler (#2470)
    * Bump sampler gas limit to 60e6 (#2471)

## v4.1.0 - _February 4, 2020_

    * Allow contract addresses to be passed as optional constructor ags instead of hardcoding (#2461)
    * Add swap quote liquidity source breakdown (#2465)

## v4.0.1 - _January 23, 2020_

    * Fix underestimated protocol fee in worst case quote. (#2452)

## v4.0.0 - _January 22, 2020_

    * Upgrade to new `Forwarder` contract with flat affiliate fees. (#2432)
    * Remove `getSmartContractParamsOrThrow()` from `SwapQuoteConsumer`s. (#2432)
    * Added `getBatchMarketBuySwapQuoteForAssetDataAsync` on `SwapQuoter` (#2427)
    * Add exponential sampling distribution and `sampleDistributionBase` option to `SwapQuoter` (#2427)
    * Compute more accurate best quote price (#2427)
    * Change Exchange sell function from `marketSellOrdersNoThrow` to `marketSellOrdersFillOrKill` (#2450)

## v3.0.3 - _January 6, 2020_

    * Ignore zero sample results from the sampler contract. (#2406)
    * Increase default `runLimit` from `1024` to `4096`. (#2406)
    * Increase default `numSamples` from `8` to `10` (#2406)
    * Fix ordering of optimized orders. (#2406)
    * Fix best and worst quotes being reversed sometimes. (#2406)
    * Fix rounding of quoted asset amounts. (#2406)
    * Undo bridge slippage in best case quote calculation. (#2406)
    * Compare equivalent asset data when validating quotes and checking fee asset data. (#2421)

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
