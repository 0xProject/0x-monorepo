<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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
