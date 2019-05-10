<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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
