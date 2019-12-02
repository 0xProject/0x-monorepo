<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.3.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v3.3.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v3.3.0-beta.2 - _November 17, 2019_

    * Drastically reduced bundle size by adding .npmignore, only exporting specific artifacts/wrappers/utils (#2330)
    * Introduced new exports AuthorizableRevertErrors, LibAddressArrayRevertErrors, LibBytesRevertErrors, OwnableRevertErrors, ReentrancyGuardRevertErrors and SafeMathRevertErrors (#2321)

## v3.3.0-beta.1 - _November 7, 2019_

    * Dependencies updated

## v3.3.0-beta.0 - _October 3, 2019_

    * Change ReentrancyGuard implementation to cheaper one (#1699)
    * Add LibEIP712 contract (#1753)
    * Add `RichErrors` and `mixins/MRichErrors` (#1761)
    * Break out types/interaces from `MRichErrors` into `MRichErrorTypes`. (#1790)
    * Add LibEIP1271.sol (#1885)
    * Updated RichErrors to the library pattern, and implemented RichErrors for all remaining reverts and requires (#1913)
    * Added unit tests for all of the internal functions in the package (#2014)
    * Updated Ownable to revert when the owner attempts to transfer ownership to the zero address (#2019)
    * Add reference functions for `SafeMath` functions. (#2031)
    * Throw a `SafeMathError` in `SafeMath._safeDiv()` when denominator is zero. (#2031)
    * Create `LibSafeMath` (#2055)
    * Rename `_rrevert` to `rrevert` in `LibRichErrors` contract (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Added LibFractions (#2118)
    * Introduce automatic normalization and some zero-value shortcuts in `LibFractions`. (#2155)
    * Emit an event in `transferOwnership` (#2253)
    * Removed `deepCopyBytes`, `popLast20Bytes`, `readBytesWithLength`, and `writeBytesWithLength` in `LibBytes`. (#2265)
    * Replaced `SafeMath` with `LibSafeMath` (#2254)

## v3.2.4 - _September 17, 2019_

    * Dependencies updated

## v3.2.3 - _September 3, 2019_

    * Dependencies updated

## v3.2.2 - _August 22, 2019_

    * Dependencies updated

## v3.2.1 - _August 8, 2019_

    * Dependencies updated

## v3.2.0 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)
    * Added tests for decoding log arguments when artifact dependencies are included/excluded. (#1995)

## v3.1.10 - _July 24, 2019_

    * Dependencies updated

## v3.1.9 - _July 15, 2019_

    * Dependencies updated

## v3.1.8 - _July 13, 2019_

    * Dependencies updated

## v3.1.7 - _July 13, 2019_

    * Dependencies updated

## v3.1.6 - _May 24, 2019_

    * Dependencies updated

## v3.1.5 - _May 15, 2019_

    * Dependencies updated

## v3.1.4 - _May 14, 2019_

    * Dependencies updated

## v3.1.2 - _May 10, 2019_

    * Dependencies updated

## v3.1.1 - _April 11, 2019_

    * Dependencies updated

## v3.1.0 - _March 21, 2019_

    * Added `startProviderEngine` to `providerUtils`. Preventing excess block polling (#1695)

## v3.0.0 - _March 20, 2019_

    * Optimize loops in LibAddressArray (#1668)
    * Upgrade contracts to Solidity 0.5.5 (#1682)
    * Added Address.sol with test for whether or not an address is a contract (#1657)
    * Add unit tests for `LibAddressArray` (#1712)
    * Fix `LibAddressArray.indexOf` returning incorrect index. (#1712)

## v2.0.8 - _March 1, 2019_

    * Dependencies updated

## v2.0.7 - _February 27, 2019_

    * Dependencies updated

## v2.0.6 - _February 26, 2019_

    * Dependencies updated

## v2.0.5 - _February 25, 2019_

    * Fix bug in `LibBytes.slice` and `LibBytes.sliceDestructive` (#1604)
    * Upgrade contracts to Solidity 0.5.3 (#1604)

## v2.0.4 - _February 9, 2019_

    * Dependencies updated

## v2.0.3 - _February 7, 2019_

    * Dependencies updated

## v2.0.2 - _February 7, 2019_

    * Fake publish to enable pinning

## v2.0.1 - _February 6, 2019_

    * Dependencies updated

## v2.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Fix imports in `TestConstants` and `TestLibBytes` to be relative. This way they show up correctly in coverage reports (#1535)
    * Add LibAddressArray contract (#1539)
    * Do not nest contracts in redundant directories (#1539)
    * Rename utils directory to src (#1539)

## v1.0.6 - _January 17, 2019_

    * Dependencies updated

## v1.0.5 - _January 15, 2019_

    * Dependencies updated

## v1.0.4 - _January 11, 2019_

    * Dependencies updated

## v1.0.3 - _January 9, 2019_

    * Dependencies updated

## v1.0.2 - _December 13, 2018_

    * Dependencies updated
