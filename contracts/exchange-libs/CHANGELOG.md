<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.1.0-beta.1 - _November 6, 2019_

    * Dependencies updated

## v3.1.0-beta.0 - _October 3, 2019_

    * Break up `LibEIP712` into reusable components (#1742)
    * Add `chainId` to EIP712 domain schema (#1742)
    * Rename `verifyingContract` to `verifyingContractAddress` in domain schema (#1742)
    * Add LibZeroExTransaction contract (#1753)
    * Add verifyingContractIfExists arg to LibEIP712ExchangeDomain constructor (#1753)
    * Remove LibEIP712ExchangeDomainConstants and LibEIP712 contracts (#1753)
    * Add `LibExchangeRichErrorDecoder` contract. (#1790)
    * Break out types/interaces from `MExchangeRichErrors` into `MExchangeRichErrorTypes`. (#1790)
    * Reorder some revert error parameters for consistency (#1790)
    * Add new `Order` fields for arbitrary fee tokens (ZEIP-28). (#1819)
    * Remove `LibAbiEncoder` and `LibConstants`. (#1819)
    * Add `generate-exchange-selectors` package script. (#1819)
    * Add `expirationTimeSeconds` to `ZeroExTransaction` struct (#1823)
    * Add reference functions for `LibMath` and `LibFillResults` (#2031)
    * Move in revamped `LibMath` tests from the `contracts-exchange` package. (#2031)
    * Move in revamped `LibFillResults` tests from the `contracts-exchange` package. (#2031)
    * Remove unecessary zero-denominator checks in `LibMath`. (#2031)
    * Fix coverage hooks. (#2031)
    * Regenerate selectors. (#2042)
    * Convert `LibFillResults`, `LibOrder`, `LibZeroExTransaction`, and `LibMath` to libraries (#2055)
    * Remove `LibExchangeSelectors` (#2055)
    * Add `LibExchangeRichErrors` (#2055)
    * Add `calculateFillResults` and `calculateMatchedFillResults` to `LibFillResults` (#2055)
    * Remove `_hashEIP712ExchangeMessage` from `LibEIP712ExchangeDomain` (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Update `IncompleteFillError` to take an `errorCode`, `expectedAssetFillAmount`, and `actualAssetFillAmount` fields. (#2075)
    * Move `IWallet.sol` from `asset-proxy` and `exchange` packages to here. (#2233)

## v3.0.8 - _September 17, 2019_

    * Dependencies updated

## v3.0.7 - _September 3, 2019_

    * Dependencies updated

## v3.0.6 - _August 22, 2019_

    * Dependencies updated

## v3.0.5 - _August 8, 2019_

    * Dependencies updated

## v3.0.4 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)

## v3.0.3 - _July 24, 2019_

    * Dependencies updated

## v3.0.2 - _July 15, 2019_

    * Dependencies updated

## v3.0.1 - _July 13, 2019_

    * Dependencies updated

## v3.0.0 - _July 13, 2019_

    * Move `LibTransactionDecoder` to contracts/dev-utils package (#1848)

## v2.1.6 - _May 24, 2019_

    * Dependencies updated

## v2.1.5 - _May 15, 2019_

    * Dependencies updated

## v2.1.4 - _May 14, 2019_

    * Dependencies updated

## v2.1.2 - _May 10, 2019_

    * Dependencies updated

## v2.1.1 - _April 11, 2019_

    * Dependencies updated

## v2.1.0 - _March 21, 2019_

    * Run Web3ProviderEngine without excess block polling (#1695)

## v2.0.0 - _March 20, 2019_

    * Upgrade contracts to Solidity 0.5.5 (#1682)

## v1.1.3 - _March 1, 2019_

    * Dependencies updated

## v1.1.2 - _February 27, 2019_

    * Dependencies updated

## v1.1.1 - _February 26, 2019_

    * Dependencies updated

## v1.1.0 - _February 25, 2019_

    * Upgrade contracts to Solidity 0.5.3 (#1604)
    * Make constants internal (#1604)

## v1.0.5 - _February 9, 2019_

    * Dependencies updated

## v1.0.4 - _February 7, 2019_

    * Dependencies updated

## v1.0.3 - _February 7, 2019_

    * Fake publish to enable pinning

## v1.0.2 - _February 6, 2019_

    * Dependencies updated

## v1.0.1 - _February 5, 2019_

    * Dependencies updated

## v1.0.0 - _Invalid date_

    * Rename contracts-libs to contracts-exchange-libs (#1539)
    * Move LibAddressArray contract to contracts-utils (#1539)
