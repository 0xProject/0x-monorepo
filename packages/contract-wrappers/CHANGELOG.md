<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.0.1 - _November 9, 2018_

    * Fix bug in `ForwarderWrapper` where `feeRecipientAddress` was not correctly normalized. (#1178)

## v3.0.0 - _October 18, 2018_

    * Add optional validation to the forwarder wrapper methods
    * Updated to use new modularized artifacts. (#1105)
    * Top-level `ContractWrappers` class has a new optional `contractAddresses` parameter. (#1105)
    * Default contract addresses are no longer stored in artifacts and are instead loaded from the `@0xproject/contract-addresses` package. (#1105)
    * Most contract addresses are now defined at instantiation time and are available as properties (e.g., `exchangeWrapper.address`) instead of methods (e.g., `exchangeWrapper.getContractAddress()`). (#1105)
    * Removed `setProvider` method in top-level `ContractWrapper` class and added new `unsubscribeAll` method. (#1105)
    * Some properties and methods have been renamed. For example, some methods that previously could throw no longer can, and so their names have been updated accordingly. (#1105)
    * Removed ContractNotFound errors. Checking for this error was somewhat ineffecient. Relevant methods/functions now return the default error from web3-wrapper, which we feel provides enough information. (#1105)
    * Add `ForwarderWrapperError` to public interface (#1147)
    * Add `ContractWrapperError.SignatureRequestDenied` to public interface (#1147)

## v2.0.2 - _October 4, 2018_

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

## v1.0.0-rc.1 - _July 19, 2018_

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
