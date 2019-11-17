<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v6.2.0-beta.2 - _November 17, 2019_

    * Dependencies updated

## v6.2.0-beta.1 - _November 7, 2019_

    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v6.2.0-beta.0 - _October 3, 2019_

    * Dependencies updated

## v6.1.14 - _September 17, 2019_

    * Dependencies updated

## v6.1.13 - _September 3, 2019_

    * Dependencies updated

## v6.1.12 - _August 22, 2019_

    * Dependencies updated

## v6.1.11 - _August 8, 2019_

    * Dependencies updated

## v6.1.10 - _July 31, 2019_

    * Dependencies updated

## v6.1.9 - _July 24, 2019_

    * Dependencies updated

## v6.1.8 - _July 15, 2019_

    * Dependencies updated

## v6.1.7 - _July 13, 2019_

    * Dependencies updated

## v6.1.6 - _July 13, 2019_

    * Dependencies updated

## v6.1.5 - _May 24, 2019_

    * Dependencies updated

## v6.1.4 - _May 15, 2019_

    * Dependencies updated

## v6.1.3 - _May 14, 2019_

    * Convert `metaData.remainingTakerAssetAmount` to BigNumber if present in APIOrder (#1810)

## v6.1.1 - _May 10, 2019_

    * Dependencies updated

## v6.1.0 - _April 11, 2019_

    * Moved order_utils into `@0x/order-utils` package as `orderCalculationUtils` (#1714)

## v6.0.5 - _March 21, 2019_

    * Dependencies updated

## v6.0.4 - _March 20, 2019_

    * Dependencies updated

## v6.0.3 - _March 1, 2019_

    * Dependencies updated

## v6.0.2 - _February 27, 2019_

    * Dependencies updated

## v6.0.1 - _February 26, 2019_

    * Dependencies updated

## v6.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v5.0.4 - _February 9, 2019_

    * Dependencies updated

## v5.0.3 - _February 7, 2019_

    * Dependencies updated

## v5.0.2 - _February 7, 2019_

    * Dependencies updated

## v5.0.1 - _February 6, 2019_

    * Dependencies updated

## v5.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v4.1.0 - _Invalid date_

    * Adds new public method getLiquidityForAssetDataAsync, and exposes getOrdersAndFillableAmountsAsync as public method (#1512)

## v4.0.2 - _January 17, 2019_

    * Dependencies updated

## v4.0.1 - _January 15, 2019_

    * Dependencies updated

## v4.0.0 - _January 11, 2019_

    * Raise custom InsufficientAssetLiquidityError error with amountAvailableToFill attribute (#1437)

## v3.0.5 - _January 9, 2019_

    * Dependencies updated

## v3.0.4 - _December 13, 2018_

    * Dependencies updated

## v3.0.3 - _December 11, 2018_

    * Update SRA order provider to include Dai

## v3.0.2 - _November 28, 2018_

    * Dependencies updated

## v3.0.1 - _November 21, 2018_

    * Dependencies updated (#1276)

## v3.0.0 - _November 14, 2018_

    * update `getBuyQuoteAsync` to return eth spent on assets instead of per unit amount (#1252)

## v2.2.2 - _November 13, 2018_

    * Dependencies updated

## v2.2.1 - _November 12, 2018_

    * Dependencies updated

## v2.2.0 - _November 9, 2018_

    * `getAssetBuyerForProvidedOrders` factory function now takes 3 args instead of 4 (#1187)
    * the `OrderProvider` now requires a new method `getAvailableMakerAssetDatasAsync` and the `StandardRelayerAPIOrderProvider` requires the network id at init. (#1203)
    * No longer require that provided orders all have the same maker and taker asset data (#1197)
    * Fix bug where `BuyQuoteInfo` objects could return `totalEthAmount` and `feeEthAmount` that were not whole numbers (#1207)
    * Fix bug where default values for `AssetBuyer` public facing methods could get overriden by `undefined` values (#1207)
    * Lower default expiry buffer from 5 minutes to 2 minutes (#1217)

## v2.1.0 - _October 18, 2018_

    * Add `gasLimit` and `gasPrice` as optional properties on `BuyQuoteExecutionOpts`
    * Export `BuyQuoteInfo` type (#1131)
    * Updated to use new modularized artifacts and the latest version of @0xproject/contract-wrappers (#1105)
    * Add `gasLimit` and `gasPrice` as optional properties on `BuyQuoteExecutionOpts` (#1116)
    * Add `docs:json` command to package.json (#1139)
    * Add missing types to public interface (#1139)
    * Throw `SignatureRequestDenied` and `TransactionValueTooLow` errors when executing buy (#1147)

## v2.0.0 - _October 4, 2018_

    * Expand AssetBuyer to work with multiple assets at once (#1086)
    * Fix minRate and maxRate calculation (#1113)

## v1.0.3 - _October 2, 2018_

    * Dependencies updated

## v1.0.2 - _September 28, 2018_

    * Dependencies updated

## v1.0.1 - _September 25, 2018_

    * Dependencies updated

## v1.0.0 - _September 25, 2018_

    * Dependencies updated

## v1.0.0-rc.1 - _Invalid date_

    * Init
