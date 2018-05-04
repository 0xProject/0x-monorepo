<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v0.6.12 - _May 5, 2018_

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
