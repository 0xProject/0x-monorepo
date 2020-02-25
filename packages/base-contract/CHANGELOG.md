<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v6.2.1 - _February 25, 2020_

    * Dependencies updated

## v6.2.0 - _February 8, 2020_

    * Ignore bytecode with unlinked library references in constructor (#2463)
    * Add exported function `linkLibrariesInBytecode()` (#2463)

## v6.1.2 - _February 6, 2020_

    * Dependencies updated

## v6.1.1 - _February 4, 2020_

    * Throw Error when revert is StringRevertError (#2453)

## v6.1.0 - _January 22, 2020_

    * Support catching empty reverts on live networks. (#2433)

## v6.0.3 - _January 6, 2020_

    * Dependencies updated

## v6.0.2 - _December 17, 2019_

    * Dependencies updated

## v6.0.1 - _December 9, 2019_

    * Dependencies updated

## v6.0.0 - _December 2, 2019_

    * Moved shared logic into `BaseContract` helpers to reduce size. (#2343)
    * Make `evmExecAsync` protected and rename to `_evmExecAsync` (#2243)
    * Remove duplicate types `IndexedFilterValues`, `DecodedLogEvent`, `EventCallback` (#2243)
    * Added ContractFunctionObj type and supporting types (#2325)
    * Added AwaitTransactionSuccessOpts and SendTransactionOpts (#2325)
    * Automatically decode and throw rich reverts in `_throwIfRevertWithReasonCallResult` (#1761)
    * Remove dependency on ethers.js (#1761)
    * Add more RevertError decoding functions (#1819)
    * Make the Promise returned by `awaitTransactionSuccessAsync` compatible with base Promise type (#1885)
    * Properly encode `BigNumber` indexed filter values in `getTopicsForIndexedArgs()` (#2155)

## v5.5.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v5.5.0-beta.3 - _November 20, 2019_

    * Moved shared logic into `BaseContract` helpers to reduce size. (#2343)

## v5.5.0-beta.2 - _November 17, 2019_

    * Dependencies updated

## v5.5.0-beta.1 - _November 7, 2019_

    * Make `evmExecAsync` protected and rename to `_evmExecAsync` (#2243)
    * Remove duplicate types `IndexedFilterValues`, `DecodedLogEvent`, `EventCallback` (#2243)
    * Added ContractFunctionObj type and supporting types (#2325)
    * Added AwaitTransactionSuccessOpts and SendTransactionOpts (#2325)

## v5.5.0-beta.0 - _October 3, 2019_

    * Automatically decode and throw rich reverts in `_throwIfRevertWithReasonCallResult` (#1761)
    * Remove dependency on ethers.js (#1761)
    * Add more RevertError decoding functions (#1819)
    * Make the Promise returned by `awaitTransactionSuccessAsync` compatible with base Promise type (#1885)
    * Properly encode `BigNumber` indexed filter values in `getTopicsForIndexedArgs()` (#2155)

## v5.4.0 - _September 17, 2019_

    * Add `evmExecAsync` to use local EVM instead of eth_call for pure functions (#2108)

## v5.3.3 - _September 3, 2019_

    * Dependencies updated

## v5.3.2 - _August 22, 2019_

    * Updated to ethereumjs-blockstream@^7.0.0 (#2089)

## v5.3.1 - _August 8, 2019_

    * Dependencies updated

## v5.3.0 - _July 31, 2019_

    * Updated interface to `deployFrom0xArtifactAsync` to include log decode dependencies. (#1995)
    * Updated interface to `deployAsync` to include log decode dependencies. (#1995)

## v5.2.0 - _Invalid date_

    * Add SubscriptionManager (#1970)

## v5.1.2 - _July 24, 2019_

    * Dependencies updated

## v5.1.1 - _July 13, 2019_

    * Dependencies updated

## v5.1.0 - _May 10, 2019_

    * Export `PromiseWithTransactionHash` type (#1797)

## v5.0.5 - _April 11, 2019_

    * Dependencies updated

## v5.0.4 - _March 21, 2019_

    * Dependencies updated

## v5.0.3 - _March 20, 2019_

    * Dependencies updated

## v5.0.2 - _March 1, 2019_

    * Dependencies updated

## v5.0.1 - _February 26, 2019_

    * Dependencies updated

## v5.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v4.0.3 - _February 9, 2019_

    * Dependencies updated

## v4.0.2 - _February 7, 2019_

    * Dependencies updated

## v4.0.1 - _February 6, 2019_

    * Dependencies updated

## v4.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v3.0.13 - _January 15, 2019_

    * Dependencies updated

## v3.0.12 - _January 11, 2019_

    * Dependencies updated

## v3.0.11 - _January 9, 2019_

    * Dependencies updated

## v3.0.10 - _December 13, 2018_

    * Dependencies updated

## v3.0.9 - _December 11, 2018_

    * Dependencies updated

## v3.0.8 - _November 28, 2018_

    * Dependencies updated

## v3.0.7 - _November 21, 2018_

    * Dependencies updated

## v3.0.6 - _November 14, 2018_

    * Dependencies updated

## v3.0.5 - _November 13, 2018_

    * Dependencies updated

## v3.0.4 - _November 12, 2018_

    * Dependencies updated

## v3.0.3 - _November 9, 2018_

    * Dependencies updated

## v3.0.2 - _October 18, 2018_

    * Dependencies updated

## v3.0.1 - _October 4, 2018_

    * Dependencies updated

## v3.0.0 - _September 28, 2018_

    * Change the way we detect BN to work with the newest ethers.js (#1069)
    * Add baseContract._throwIfRevertWithReasonCallResult (#1069)

## v2.0.5 - _September 25, 2018_

    * Dependencies updated

## v2.0.4 - _September 25, 2018_

    * Dependencies updated

## v2.0.3 - _September 21, 2018_

    * Dependencies updated

## v2.0.2 - _September 5, 2018_

    * Dependencies updated

## v2.0.1 - _August 27, 2018_

    * Dependencies updated

## v2.0.0 - _August 24, 2018_

    * Dependencies updated

## v2.0.0-rc.1 - _August 14, 2018_

    * Added strict encoding/decoding checks for sendTransaction and call (#915)

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Dependencies updated

## v0.3.6 - _July 18, 2018_

    * Dependencies updated

## v0.3.5 - _July 9, 2018_

    * Dependencies updated

## v0.3.4 - _June 19, 2018_

    * Update EthersJs to fix the `value.toLowerCase()` is not a function bug caused by `ethers.js` breaking patch version https://github.com/ethers-io/ethers.js/issues/201

## v0.3.3 - _May 31, 2018_

    * Incorrect publish that was unpublished

## v0.3.2 - _May 22, 2018_

    * Dependencies updated

## v0.3.1 - _May 4, 2018_

    * Dependencies updated

## v0.3.0 - _May 4, 2018_

    * Update ethers-contracts to ethers.js (#540)

## v0.2.1 - _April 18, 2018_

    * Dependencies updated

## v0.2.0 - _April 11, 2018_

    * Contract wrappers now accept Provider and defaults instead of Web3Wrapper (#501)

## v0.1.0 - _April 2, 2018_

    * Add tests for traversing ABI tree (#485)
    * Fix ABI tuples traversing (#485)
    * Fix ABI arrays traversing (#485)

## v0.0.6 - _April 2, 2018_

    * Dependencies updated

## v0.0.2 - _March 3, 2018_

    * Initial release
