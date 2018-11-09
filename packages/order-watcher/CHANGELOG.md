<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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
