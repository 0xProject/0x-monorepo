<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.0.2 - _October 2, 2018_

    * Dependencies updated

## v2.0.1 - _September 28, 2018_

    * Dependencies updated

## v2.0.0 - _September 25, 2018_

    * Fixes dropped events in subscriptions by fetching logs by blockHash instead of blockNumber. Support for fetching by blockHash was added in Geth > v1.8.13 and Parity > v2.1.0. Infura works too. (#1080)
    * Fix misunderstanding about blockstream interface callbacks and pass the raw JSON RPC responses to it (#1080)

## v1.0.5 - _September 25, 2018_

    * Dependencies updated

## v1.0.4 - _September 21, 2018_

    * Dependencies updated

## v1.0.3 - _September 19, 2018_

    * Drastically reduce the bundle size by removing unused parts of included contract artifacts.

## v1.0.2 - _September 18, 2018_

    * Add ZRX & WETH mainnet contract addresses into the included artifacts

## v1.0.1 - _September 5, 2018_

    * Add `OrderValidatorWrapper`
    * Fix bug where contracts not deployed on a network showed an `EXCHANGE_CONTRACT_DOES_NOT_EXIST` error instead of `CONTRACT_NOT_DEPLOYED_ON_NETWORK` (#1044)
    * Export `AssetBalanceAndProxyAllowanceFetcher` and `OrderFilledCancelledFetcher` implementations (#1054)
    * Add `validateOrderFillableOrThrowAsync` and `validateFillOrderThrowIfInvalidAsync` to ExchangeWrapper (#1054)

## v1.0.1-rc.5 - _August 27, 2018_

    * Fix missing `BlockParamLiteral` type import issue

## v1.0.1-rc.4 - _August 24, 2018_

    * Export missing types: `TransactionEncoder`, `ContractAbi`, `JSONRPCRequestPayload`, `JSONRPCResponsePayload`, `JSONRPCErrorCallback`, `AbiDefinition`, `FunctionAbi`, `EventAbi`, `EventParameter`, `DecodedLogArgs`, `MethodAbi`, `ConstructorAbi`, `FallbackAbi`, `DataItem`, `ConstructorStateMutability`, `StateMutability` & `ExchangeSignatureValidatorApprovalEventArgs` (#924)
    * Remove superfluous exported types: `ContractEvent`, `Token`, `OrderFillRequest`, `ContractEventArgs`, `LogEvent`, `OnOrderStateChangeCallback`,     `ECSignature`, `OrderStateValid`, `OrderStateInvalid`, `OrderState`, `FilterObject`, `TransactionReceipt` & `TransactionReceiptWithDecodedLogs` (#924)
    * Added Transaction Encoder for use with 0x Exchange executeTransaction (#975)

## v1.0.1-rc.3 - _August 14, 2018_

    * Added strict encoding/decoding checks for sendTransaction and call (#915)
    * Add ForwarderWrapper (#934)
    * Optimize orders in ForwarderWrapper (#936)

## v1.0.1-rc.2 - _July 26, 2018_

    * Fixed bug caused by importing non-existent dep

## v1.0.1-rc.1 - _July 26, 2018_

    * Dependencies updated

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.1 - _July 20, 2018_

    * Update blockstream to v5.0 and propogate up caught errors to active subscriptions (#815)
    * Update to v2 of 0x rpotocol (#822)

## v0.1.1 - _July 18, 2018_

    * Dependencies updated

## v0.0.5 - _June 19, 2018_

    * Dependencies updated

## v0.0.4 - _May 29, 2018_

    * Expose 'abi' ContractAbi property on all contract wrappers

## v0.0.2 - _May 22, 2018_

    * Dependencies updated

## v0.0.1 - _May 22, 2018_

    * Moved contractWrappers out of 0x.js (#579)
