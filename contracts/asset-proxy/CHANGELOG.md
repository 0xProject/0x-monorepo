<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.3.0-beta.1 - _November 6, 2019_

    * Dependencies updated

## v2.3.0-beta.0 - _October 3, 2019_

    * Disallow the zero address from being made an authorized address in MixinAuthorizable, and created an archive directory that includes an old version of Ownable (#2019)
    * Remove `LibAssetProxyIds` contract (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Remove unused dependency on IAuthorizable in IAssetProxy (#1910)
    * Add `ERC20BridgeProxy` (#2220)
    * Add `Eth2DaiBridge` (#2221)
    * Add `UniswapBridge` (#2233)
    * Replaced `SafeMath` with `LibSafeMath` (#2254)

## v2.2.8 - _September 17, 2019_

    * Dependencies updated

## v2.2.7 - _September 3, 2019_

    * Dependencies updated

## v2.2.6 - _August 22, 2019_

    * Dependencies updated

## v2.2.5 - _August 8, 2019_

    * Dependencies updated

## v2.2.4 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)

## v2.2.3 - _July 24, 2019_

    * Dependencies updated

## v2.2.2 - _July 15, 2019_

    * Dependencies updated

## v2.2.1 - _July 13, 2019_

    * Dependencies updated

## v2.2.0 - _July 13, 2019_

    * Add `LibAssetProxyIds` contract (#1835)
    * Updated ERC1155 Asset Proxy. Less optimization. More explicit handling of edge cases. (#1852)
    * Implement StaticCallProxy (#1863)

## v2.1.5 - _May 24, 2019_

    * Dependencies updated

## v2.1.4 - _May 15, 2019_

    * Dependencies updated

## v2.1.3 - _May 14, 2019_

    * Dependencies updated

## v2.1.2 - _May 10, 2019_

    * Update tests to use contract-built-in `awaitTransactionSuccessAsync` (#1797)
    * Make `ERC721Wrapper.setApprovalForAll()` take an owner address instead of a token ID (#1819)
    * Automatically set unlimited proxy allowances in `ERC721.setBalancesAndAllowancesAsync()` (#1819)
    * Add `setProxyAllowanceForAllAsync()` to `ERC1155ProxyWrapper`. (#1819)

## v2.1.1 - _April 11, 2019_

    * Dependencies updated

## v2.1.0 - _March 21, 2019_

    * Run Web3ProviderEngine without excess block polling (#1695)

## v2.0.0 - _March 20, 2019_

    * Do not reexport external dependencies (#1682)
    * Add ERC1155Proxy (#1661)
    * Bumped solidity version to ^0.5.5 (#1701)
    * Integration testing for ERC1155Proxy (#1673)

## v1.0.9 - _March 1, 2019_

    * Dependencies updated

## v1.0.8 - _February 27, 2019_

    * Dependencies updated

## v1.0.7 - _February 26, 2019_

    * Dependencies updated

## v1.0.6 - _February 25, 2019_

    * Dependencies updated

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

    * Move all AssetProxy contracts out of contracts-protocol to new package (#1539)
