<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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

    * Change /order_config request to a POST instead of GET (#1091)

## v2.0.4 - _September 25, 2018_

    * Dependencies updated

## v2.0.3 - _September 25, 2018_

    * Import SRA-related types from @0xproject/types (#1085)

## v2.0.2 - _September 21, 2018_

    * Dependencies updated

## v2.0.1 - _September 19, 2018_

    * Dependencies updated

## v2.0.0 - _September 5, 2018_

    * Change `OrderConfigRequest` to use BigNumber instead of string for relevant fields. (#1058)

## v2.0.0-rc.2 - _August 27, 2018_

    * Dependencies updated

## v2.0.0-rc.1 - _August 24, 2018_

    * Updated for SRA v2 (#974)
    * Stopped exporting `Order` type (#924)

## v1.0.5 - _August 14, 2018_

    * Dependencies updated

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Remove `WebSocketOrderbookChannel` from the public interface and replace with `orderbookChannelFactory`

## v0.6.17 - _July 18, 2018_

    * Dependencies updated

## v0.6.16 - _July 9, 2018_

    * Dependencies updated

## v0.6.15 - _June 19, 2018_

    * Dependencies updated

## v0.6.14 - _May 29, 2018_

    * Dependencies updated

## v0.6.13 - _May 22, 2018_

    * Dependencies updated

## v0.6.12 - _May 4, 2018_

    * Dependencies updated

## v0.6.11 - _May 4, 2018_

    * Dependencies updated

## v0.6.10 - _April 18, 2018_

    * Dependencies updated

## v0.6.9 - _April 11, 2018_

    * Dependencies updated

## v0.6.8 - _April 2, 2018_

    * Dependencies updated

## v0.6.7 - _April 2, 2018_

    * Dependencies updated

## v0.6.4 - _March 17, 2018_

    * Consolidate `Order`, `SignedOrder`, and `ECSignature` into the `@0xproject/types` package (#456)

## v0.6.2 - _February 15, 2018_

    * Fix JSON parse empty response (#407)

## v0.6.0 - _February 15, 2018_

    * Add pagination options to HttpClient methods (#393)
    * Add heartbeat configuration to WebSocketOrderbookChannel constructor (#406)

## v0.5.7 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.5.0 - _January 16, 2018_

    * Sanitize api endpoint url and remove trailing slashes (#318)
    * Improve error message text in HttpClient (#318)
    * Stop appending '/v0' to api endpoint url in HttpClient (#318)

## v0.4.0 - _January 10, 2018_

    * Prevent getFeesAsync method on HttpClient from mutating input (#296)

## v0.3.0 - _December 7, 2017_

    * Expose WebSocketOrderbookChannel and associated types to public interface (#251)
    * Remove tokenA and tokenB fields from OrdersRequest (#256)

## v0.2.0 - _November 28, 2017_

    * Add SignedOrder and TokenTradeInfo to the public interface
    * Add ECSignature and Order to the public interface
    * Remove dependency on 0x.js

## v0.1.0 - _November 21, 2017_

    * Provide a HttpClient class for interacting with standard relayer api compliant HTTP urls
