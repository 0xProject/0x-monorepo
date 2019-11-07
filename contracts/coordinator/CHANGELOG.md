<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.1.0-beta.1 - _November 7, 2019_

    * Dependencies updated

## v2.1.0-beta.0 - _October 3, 2019_

    * Add chainId to domain separator (#1742)
    * Inherit Exchange domain constants from `exchange-libs` to reduce code duplication (#1742)
    * Update domain separator (#1742)
    * Refactor contract to use new ITransactions interface (#1753)
    * Add verifyingContractIfExists arg to LibEIP712CoordinatorDomain constructor (#1753)
    * Remove LibZeroExTransaction contract (#1753)
    * Update tests for arbitrary fee tokens (ZEIP-28). (#1819)
    * Update for new `marketXOrders` consolidation. (#2042)
    * Use built in selectors instead of hard coded constants (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)

## v2.0.13 - _September 17, 2019_

    * Dependencies updated

## v2.0.12 - _September 3, 2019_

    * Dependencies updated

## v2.0.11 - _August 22, 2019_

    * Dependencies updated

## v2.0.10 - _August 8, 2019_

    * Dependencies updated

## v2.0.9 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)

## v2.0.8 - _July 24, 2019_

    * Dependencies updated

## v2.0.7 - _July 15, 2019_

    * Dependencies updated

## v2.0.6 - _July 13, 2019_

    * Dependencies updated

## v2.0.5 - _July 13, 2019_

    * Dependencies updated

## v2.0.4 - _May 24, 2019_

    * Dependencies updated

## v2.0.3 - _May 15, 2019_

    * Dependencies updated

## v2.0.2 - _May 14, 2019_

    * Dependencies updated

## v2.0.1 - _May 10, 2019_

    * Dependencies updated

## v2.0.0 - _April 11, 2019_

    * Make `decodeOrdersFromFillData`, `getCoordinatorApprovalHash`, and `getTransactionHash` public (#1729)
    * Make `assertValidTransactionOrdersApproval` internal (#1729)

## v1.1.0 - _March 21, 2019_

    * Run Web3ProviderEngine without excess block polling (#1695)

## v1.0.0 - _March 20, 2019_

    * Created Coordinator package
    * Use separate EIP712 domains for transactions and approvals (#1705)
    * Add `SignatureType.Invalid` (#1705)
    * Set `evmVersion` to `constantinople` (#1707)
