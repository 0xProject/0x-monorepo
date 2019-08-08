<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v4.0.17 - _August 8, 2019_

    * Dependencies updated

## v4.0.16 - _July 31, 2019_

    * Dependencies updated

## v4.0.15 - _July 24, 2019_

    * Dependencies updated

## v4.0.14 - _July 15, 2019_

    * Dependencies updated

## v4.0.13 - _July 13, 2019_

    * Dependencies updated

## v4.0.12 - _July 13, 2019_

    * Dependencies updated

## v4.0.11 - _May 24, 2019_

    * Dependencies updated

## v4.0.10 - _May 15, 2019_

    * Dependencies updated

## v4.0.9 - _May 14, 2019_

    * Dependencies updated

## v4.0.7 - _May 10, 2019_

    * Fix race-condition bug due to async callback modifying shared state (#1789)
    * Fix bug where WETH deposit/withdrawal events would not trigger an order state update (#1809)

## v4.0.6 - _April 11, 2019_

    * Dependencies updated

## v4.0.5 - _March 21, 2019_

    * Dependencies updated

## v4.0.4 - _March 20, 2019_

    * Update websocket from ^1.0.25 to ^1.0.26 (#1685)
    * Fix issue where ERC721 Approval events could cause a lookup on undefined object (#1692)
    * Fix race-condition bugs due to async event callbacks modifying shared state (#1718)
    * Run Web3ProviderEngine without excess block polling (#1695)

## v4.0.3 - _March 1, 2019_

    * Dependencies updated

## v4.0.2 - _February 27, 2019_

    * Dependencies updated

## v4.0.1 - _February 26, 2019_

    * Dependencies updated

## v4.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v3.0.4 - _February 9, 2019_

    * Dependencies updated

## v3.0.3 - _February 7, 2019_

    * Dependencies updated

## v3.0.2 - _February 7, 2019_

    * Dependencies updated

## v3.0.1 - _February 6, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v2.4.3 - _January 17, 2019_

    * Dependencies updated

## v2.4.2 - _January 15, 2019_

    * Dependencies updated

## v2.4.1 - _January 11, 2019_

    * Dependencies updated

## v2.4.0 - _January 9, 2019_

    * Add support for `MultiAssetProxy` (#1363)

## v2.3.0 - _Invalid date_

    * Added a WebSocket interface to OrderWatcher so that it can be used by a client written in any language (#1427)

## v2.2.8 - _December 13, 2018_

    * Dependencies updated

## v2.2.7 - _December 11, 2018_

    * Dependencies updated

## v2.2.6 - _November 28, 2018_

    * Dependencies updated

## v2.2.5 - _November 21, 2018_

    * Dependencies updated

## v2.2.4 - _November 14, 2018_

    * Fix the bug when order watcher was throwing an error on order removal when maker token was ZRX (#1259)

## v2.2.3 - _November 13, 2018_

    * Start jsonRpcRequestId at 1, not 0 as 0 breaks the web3.js websocket RPC provider (#1227)
    * Fix the bug when order watcher was trying to convert undefined to an object in case of CancelUpTo event

## v2.2.2 - _November 12, 2018_

    * Dependencies updated

## v2.2.1 - _November 9, 2018_

    * Dependencies updated

## v2.2.0 - _October 18, 2018_

    * Added getStats function and returns a Stats object (#1118)
    * Updated to use new modularized artifacts and the latest version of @0xproject/contract-wrappers. Constructor has a new optional `contractAddresses` parameter. (#1105)

## v2.1.1 - _October 4, 2018_

    * Dependencies updated

## v2.1.0 - _September 28, 2018_

    * Export ExpirationWatcher (#1097)

## v2.0.0 - _September 25, 2018_

    * Fixes dropped events issue by fetching logs by blockHash instead of blockNumber. Support for fetching by blockHash was added in Geth > v1.8.13 and Parity > v2.1.0. Infura works too. (#1080)
    * Fix misunderstanding about blockstream interface callbacks and pass the raw JSON RPC responses to it (#1080)
    * Add `transactionHash` to `OrderState` emitted by `OrderWatcher` subscriptions if the order's state change originated from a transaction. (#1087)

## v1.0.5 - _September 25, 2018_

    * Dependencies updated

## v1.0.4 - _September 21, 2018_

    * Dependencies updated

## v1.0.3 - _September 19, 2018_

    * Drastically reduce the bundle size by removing unused parts of included contract artifacts.

## v1.0.2 - _September 18, 2018_

    * Add ZRX & WETH mainnet contract addresses into the included artifacts

## v1.0.1 - _September 5, 2018_

    * Dependencies updated

## v1.0.1-rc.5 - _August 27, 2018_

    * Fix missing `BlockParamLiteral` type import issue

## v1.0.1-rc.4 - _August 24, 2018_

    * Export types: `ExchangeContractErrs`, `OrderRelevantState`, `JSONRPCRequestPayload`, `JSONRPCErrorCallback` and `JSONRPCResponsePayload` (#924)
    * Remove exporting types: `BlockParamLiteral`, `BlockParam`, `Order` (#924)

## v1.0.1-rc.3 - _August 14, 2018_

    * Dependencies updated

## v1.0.1-rc.2 - _July 26, 2018_

    * Fixed bug caused by importing non-existent dep

## v1.0.1-rc.1 - _July 26, 2018_

    * Dependencies updated

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.1 - _July 19, 2018_

    * Add support for ERC721 event watching and Exchange V2 events (#887)

## v0.0.8 - _July 18, 2018_

    * Dependencies updated

## v0.0.7 - _July 9, 2018_

    * Switch out simple getLogs polling with ethereumjs-blockstream (#825)
    * Do not stop subscription if error is encountered (#825)
    * Fixed a bug that caused the incorrect block to be fetched via JSON-RPC within Blockstream (#875)
    * Remove stateLayer config from OrderWatcher. It now always operates on the latest block (#875)

## v0.0.6 - _June 19, 2018_

    * Dependencies updated

## v0.0.5 - _May 29, 2018_

    * Dependencies updated

## v0.0.4 - _May 29, 2018_

    * Dependencies updated

## v0.0.3 - _May 29, 2018_

    * Dependencies updated

## v0.0.2 - _May 22, 2018_

    * Dependencies updated

## v0.0.1 - _May 22, 2018_

    * Moved OrderWatcher out of 0x.js package (#579)
