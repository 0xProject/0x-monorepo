<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v5.0.2 - _December 17, 2019_

    * Dependencies updated

## v5.0.1 - _December 9, 2019_

    * Dependencies updated

## v5.0.0 - _December 2, 2019_

    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)
    * Add `eip712DomainSchema` schema (#1742)
    * Add required field `domain` to `order` and `zeroExTransaction` schemas (#1742)
    * Add `makerAssetData` and `takerAssetData` to `Order` schemas (#1819)
    * Add `expirationTimeSeconds` to `ZeroExTransaction` schema (#1832)

## v4.1.0-beta.3 - _December 2, 2019_

    * Dependencies updated

## v4.1.0-beta.2 - _November 17, 2019_

    * Dependencies updated

## v4.1.0-beta.1 - _November 7, 2019_

    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v4.1.0-beta.0 - _October 3, 2019_

    * Add `eip712DomainSchema` schema (#1742)
    * Add required field `domain` to `order` and `zeroExTransaction` schemas (#1742)
    * Add `makerAssetData` and `takerAssetData` to `Order` schemas (#1819)
    * Add `expirationTimeSeconds` to `ZeroExTransaction` schema (#1832)

## v4.0.2 - _September 17, 2019_

    * Dependencies updated

## v4.0.1 - _September 3, 2019_

    * Dependencies updated

## v4.0.0 - _August 22, 2019_

    * Removed @0x/order-watcher

## v3.1.13 - _August 8, 2019_

    * Dependencies updated

## v3.1.12 - _July 31, 2019_

    * Dependencies updated

## v3.1.11 - _July 24, 2019_

    * permit mixed-case addresses

## v3.0.11 - _July 13, 2019_

    * Dependencies updated

## v3.0.10 - _May 10, 2019_

    * Dependencies updated

## v3.0.9 - _April 11, 2019_

    * Dependencies updated

## v3.0.8 - _March 21, 2019_

    * Dependencies updated

## v3.0.7 - _March 20, 2019_

    * Dependencies updated

## v3.0.6 - _March 1, 2019_

    * Dependencies updated

## v3.0.5 - _February 26, 2019_

    * Dependencies updated

## v3.0.4 - _February 25, 2019_

    * Dependencies updated

## v3.0.3 - _February 9, 2019_

    * Dependencies updated

## v3.0.2 - _February 7, 2019_

    * Dependencies updated

## v3.0.1 - _February 6, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Add `verifyingContractAddress` to `zeroExTransactionSchema` (#1576)

## v2.1.7 - _January 15, 2019_

    * Dependencies updated

## v2.1.6 - _January 11, 2019_

    * Dependencies updated

## v2.1.5 - _January 9, 2019_

    * Dependencies updated

## v2.1.4 - _December 13, 2018_

    * Dependencies updated

## v2.1.3 - _December 11, 2018_

    * Dependencies updated

## v2.1.2 - _November 21, 2018_

    * Dependencies updated

## v2.1.1 - _November 14, 2018_

    * Dependencies updated

## v2.1.0 - _November 12, 2018_

    * Improve schemas by enforcing that amounts that must be whole numbers (e.g Order asset amounts) no longer allow decimal amounts (#1173)
    * Add schemas from @0x/connect (#1250)

## v2.0.0 - _October 18, 2018_

    * Convert all schemas to JSON files so that they can be used with `json-schema` implemenations in other programming languages. (#1145)

## v1.0.7 - _October 4, 2018_

    * Dependencies updated

## v1.0.6 - _October 2, 2018_

    * Dependencies updated

## v1.0.5 - _September 28, 2018_

    * Dependencies updated

## v1.0.4 - _September 25, 2018_

    * Dependencies updated

## v1.0.3 - _September 25, 2018_

    * Dependencies updated

## v1.0.2 - _September 21, 2018_

    * Dependencies updated

## v1.0.1 - _September 5, 2018_

    * Dependencies updated

## v1.0.1-rc.6 - _August 27, 2018_

    * Dependencies updated

## v1.0.1-rc.5 - _August 24, 2018_

    * Update incorrect relayer api fee recipients response schema (#974)

## v1.0.1-rc.4 - _August 14, 2018_

    * Allow for additional properties in txData schema (#938)
    * Change hexSchema to match `0x` (#937)
    * Upgrade Relayer API schemas for relayer API V2 (#916)

## v1.0.1-rc.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.1-rc.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1-rc.1 - _July 26, 2018_

    * Dependencies updated

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.1 - _July 19, 2018_

    * Update schemas for V2 or 0x Protocol (#615)
    * Added CallData schema (#821)
    * Update CallData schema id to CallData (#894)

## v0.8.3 - _July 18, 2018_

    * Dependencies updated

## v0.8.2 - _July 9, 2018_

    * Dependencies updated

## v0.8.1 - _June 19, 2018_

    * Dependencies updated

## v0.8.0 - _May 22, 2018_

    * Update Order & SignedOrder schemas, remove ECSignature schema and add Hex schema as part of V2 upgrades (#615)

## v0.7.24 - _May 22, 2018_

    * Dependencies updated

## v0.7.23 - _May 4, 2018_

    * Dependencies updated

## v0.7.22 - _May 4, 2018_

    * Dependencies updated

## v0.7.21 - _April 18, 2018_

    * Dependencies updated

## v0.7.20 - _April 11, 2018_

    * Dependencies updated

## v0.7.19 - _April 2, 2018_

    * Dependencies updated

## v0.7.18 - _April 2, 2018_

    * Dependencies updated

## v0.7.13 - _February 8, 2018_

    *   Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.7.0 - _December 19, 2017_

    * Rename `subscriptionOptsSchema` to `blockRangeSchema` (#272)

## v0.6.7 - _November 13, 2017_

    * Re-publish JSON-schema previously published under NPM package 0x-json-schemas
