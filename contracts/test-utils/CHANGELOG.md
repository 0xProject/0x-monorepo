<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.2.0-beta.1 - _November 6, 2019_

    * Dependencies updated

## v3.2.0-beta.0 - _October 3, 2019_

    * Add `chainId` to `TransactionFactory` constructor (#1742)
    * Use new `Order` structure with `domain` field (#1742)
    * Inherit `chaiSetup` from `@0x/dev-utils` (#1761)
    * Add `generatePseudoRandomOrderHash()` to `orderUtils` (#1761)
    * Inherit `OrderStatus` from `@0x/types` (#1761)
    * Update types for arbitrary fee tokens (#1819)
    * Remove formatters (#1834)
    * Add `hexConcat()` in `hex_utils.ts` (#1885)
    * Introduce Mocha blockchain extensions (#2007)
    * Move `*FillResults`, `OrderInfo` types to `@0x/types` (#2031)
    * Add `log_utils.ts` (#2031)
    * Add `haxRandom()` to `hex_utils.ts` (#2031)
    * Add the constants: `MAX_UINT256`, `ADDRESS_LENGTH`, `MAX_UINT256_ROOT`, `ONE_ETHER` (#2031)
    * Make `testCombinatoriallyWithReferenceFuncAsync` non-async (#2031)
    * Update `testWithReferenceFuncAsync` to work with `RevertErrors` (#2031)
    * `web3Wrapper` is created with `shouldAllowUnlimitedContractSize` if `UNLIMITED_CONTRACT_SIZE` environment variable is set. (#2075)
    * Add `toHex()`, `hexLeftPad()`, `hexRightPad()`, and 'hexInvert()' hex utils (#2109)
    * Add `PPM_DENOMINATOR` and `PPM_100_PERCENT` constants. (#2109)
    * Increase the number of ganache accounts to 20 (#2109)
    * Add `Numberish` type. (#2131)
    * Tweaks/Upgrades to `hex_utils`, most notably `hexSlice()` (#2155)
    * Add `hexHash()` to `hex_utils` (#2155)
    * Add `shortZip()` to `lang_utils.ts` (#2155)
    * Add `number_utils.ts` and `hexSize()` (#2220)
    * Add `verifyEventsFromLogs()` (#2287)

## v3.1.16 - _September 17, 2019_

    * Dependencies updated

## v3.1.15 - _September 3, 2019_

    * Dependencies updated

## v3.1.14 - _August 22, 2019_

    * Dependencies updated

## v3.1.13 - _August 8, 2019_

    * Dependencies updated

## v3.1.12 - _July 31, 2019_

    * Dependencies updated

## v3.1.11 - _July 24, 2019_

    * Dependencies updated

## v3.1.10 - _July 15, 2019_

    * Dependencies updated

## v3.1.9 - _July 13, 2019_

    * Dependencies updated

## v3.1.8 - _July 13, 2019_

    * Fixed false positives in `expectTransactionFailedAsync` and `expectContractCallFailedAsync` (#1852)

## v3.1.7 - _May 24, 2019_

    * Dependencies updated

## v3.1.6 - _May 15, 2019_

    * Dependencies updated

## v3.1.5 - _May 14, 2019_

    * Dependencies updated

## v3.1.3 - _May 10, 2019_

    * Dependencies updated

## v3.1.2 - _April 11, 2019_

    * Dependencies updated

## v3.1.1 - _March 21, 2019_

    * Dependencies updated

## v3.1.0 - _March 20, 2019_

    * Added ERC1155Proxy test constants and interfaces (#1661)

## v3.0.9 - _Invalid date_

    * Set evmVersion to byzantium (#1678)
    * Remove Coordinator EIP712 constants. They're now in the `order-utils` package. (#1705)

## v3.0.8 - _March 1, 2019_

    * Dependencies updated

## v3.0.7 - _February 27, 2019_

    * Dependencies updated

## v3.0.6 - _February 26, 2019_

    * Dependencies updated

## v3.0.5 - _February 25, 2019_

    * Dependencies updated

## v3.0.4 - _February 9, 2019_

    * Dependencies updated

## v3.0.3 - _February 7, 2019_

    * Dependencies updated

## v3.0.2 - _February 7, 2019_

    * Fake publish to enable pinning

## v3.0.1 - _February 6, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Import `ZeroExTransaction` type instead of using type defined in this package (#1576)

## v2.0.1 - _January 17, 2019_

    * Dependencies updated

## v2.0.0 - _January 15, 2019_

    * Renamed OrderStatus enum members to PascalCase to conform with tslint enum-naming rule (#1474)

## v1.0.4 - _January 11, 2019_

    * Dependencies updated

## v1.0.3 - _January 9, 2019_

    * Dependencies updated

## v1.0.2 - _December 13, 2018_

    * Dependencies updated
