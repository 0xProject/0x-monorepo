<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v5.4.0-beta.1 - _November 6, 2019_

    * Remove debug functions `getABIDecodedTransactionData` and `getABIDecodedReturnData` (#2243)
    * Remove `getABIEncodedTransactionData` for constant functions (pure and view) (#2243)
    * Introduce TxOpts object for `sendTransactionAsync` and `awaitTransactionSuccessAsync`. Replaces `timeoutMs` and `pollingIntervalMs` arguments for `awaitTransactionSuccessAsync` (#2243)
    * Remove `validateAndSendTransactionAsync`. Replaced with `shouldValidate` key in TxOpts. Defaults to true (#2243)

## v5.4.0-beta.0 - _October 3, 2019_

    * Use V3 contracts (#2181)
    * Hardcode bytecode for local EVM execution (#2198)

## v5.3.2 - _September 17, 2019_

    * Redirect `callAsync` to use local EVM instead of eth_call for pure functions (#2108)

## v5.3.1 - _September 3, 2019_

    * Dependencies updated

## v5.3.0 - _August 22, 2019_

    * Added DevUtils (#2060)

## v5.2.0 - _August 8, 2019_

    * Updated to include `getABIDecodedTransactionData` and `getABIDecodedReturnData` (#2018)

## v5.1.0 - _July 31, 2019_

    * Add subscribe/unsubscribe methods for events (#1970)

## v5.0.3 - _July 24, 2019_

    * Dependencies updated

## v5.0.2 - _July 15, 2019_

    * Dependencies updated

## v5.0.1 - _July 13, 2019_

    * Dependencies updated

## v5.0.0 - _July 13, 2019_

    * Wrappers no longer require passing in the contract ABI at instantiation (#1883)
    * Contract addresses now re-exported from @0x/contract-addresses (#1883)
    * Update wrappers to include parameter assertions (#1823)
    * Update wrappers to normalize address inputs to lowercase (#1951)
    * Update wrappers to include `getABIEncodedTransactionData` for view and pure functions (#1863)

## v4.3.0 - _May 10, 2019_

    * Update Coordinator and Exchange wrappers (#1742)
    * Update wrapper functions to expose `awaitTransactionSuccessAsync()` methods (#1797)
    * Update wrappers to automatically throw `RevertError` types when possible. (#1819)

## v4.2.0 - _April 11, 2019_

    * Added IAssetProxy wrapper (#1714)

## v4.1.0 - _March 21, 2019_

    * Add Coordinator and CoordinatorRegistry contract wrappers (#1689)

## v4.0.3 - _March 20, 2019_

    * Dependencies updated

## v4.0.2 - _March 1, 2019_

    * Dependencies updated

## v4.0.1 - _February 26, 2019_

    * Dependencies updated

## v4.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v3.0.3 - _February 9, 2019_

    * Dependencies updated

## v3.0.2 - _February 7, 2019_

    * Dependencies updated

## v3.0.1 - _February 6, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v2.2.0 - _January 15, 2019_

    * Added `MultiAssetProxy` (#1503)

## v2.1.1 - _January 11, 2019_

    * Dependencies updated

## v2.1.0 - _January 9, 2019_

    * Added Dutch Auction Wrapper (#1465)

## v2.0.2 - _December 13, 2018_

    * Dependencies updated

## v2.0.1 - _December 11, 2018_

    * Dependencies updated

## v2.0.0 - _November 28, 2018_

    * Update Exchange artifact to receive ZRX asset data as a constructor argument (#1309)

## v1.1.0 - _November 21, 2018_

    * `deployFrom0xArtifactAsync` additionally accepts artifacts that conform to the `SimpleContractArtifact` interface (#1298)

## v1.0.5 - _November 14, 2018_

    * Dependencies updated

## v1.0.4 - _November 13, 2018_

    * Dependencies updated

## v1.0.3 - _November 12, 2018_

    * Dependencies updated

## v1.0.2 - _November 9, 2018_

    * Dependencies updated

## v1.0.1 - _October 18, 2018_

    * Dependencies updated

## v1.0.0 - _Invalid date_

    * Initial release (#1105)
