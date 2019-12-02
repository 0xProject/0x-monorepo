<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v12.2.0-beta.4 - _December 2, 2019_

    * Remove dependency on `abi-gen-wrappers`
    * Regenrate Forwarder wrapper (#2374)

## v12.2.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v12.2.0-beta.2 - _November 17, 2019_

    * [Breaking] Remove `erc20Proxy`, `erc721Proxy` and `dutchAuction` wrappers (#2324)
    * [Breaking] Big refactor of contract wrapper interface. See https://github.com/0xProject/0x-monorepo/pull/2325 for details (#2325)
    * Export types `ContractFunctionObj` and `ContractTxFunctionObj` (#2325)

## v12.2.0-beta.1 - _November 7, 2019_

    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v12.2.0-beta.0 - _October 3, 2019_

    * Use new `Order` and `ZeroExTransaction` structures with `domain` field (#1742)
    * Update exchange wrapper (#1742)

## v12.1.0 - _September 17, 2019_

    * Add `devUtils` to `ContractWrappers` class. (#2146)

## v12.0.0 - _September 3, 2019_

    * Import wrappers from @0x/abi-gen-wrappers instead of directly implementing within this package. (#2086)
    * Change CoordinatorWrapper constructor to take a provider instead of a Web3Wrapper instance (#2023)

## v11.1.0 - _August 22, 2019_

    * Add `contractAddresses` to `ContractWrappers` class. Add `validateAndSendTransactionAsync` to all methods. Add interfaces ForwarderError, ContractError, TraderInfo, OrderAndTraderInfo. (#2068)

## v11.0.0 - _August 8, 2019_

    * Use @0x/abi-gen to generate wrappers. For a full list of changes, see https://github.com/0xProject/0x-monorepo/issues/2040 (#2037)

## v10.1.0 - _July 31, 2019_

    * Updated interface to `deployFrom0xArtifactAsync` to include log decode dependencies. (#1995)
    * Updated interface to `deployAsync` to include log decode dependencies. (#1995)

## v10.0.0 - _Invalid date_

    * Constructors for `ERC20TokenWrapper`, `ERC721TokenWrapper`, and `EtherTokenWrapper` no longer accept networkId (#1970)

## v9.1.8 - _July 24, 2019_

    * re-export new ethereum-types type, TupleDataItem (#1919)

## v9.1.7 - _July 15, 2019_

    * Dependencies updated

## v9.1.6 - _July 13, 2019_

    * Dependencies updated

## v9.1.5 - _July 13, 2019_

    * Use assetDataUtils for encoding and decoding DutchAuctionData

## v9.1.4 - _May 24, 2019_

    * Dependencies updated

## v9.1.3 - _May 15, 2019_

    * Fix decoding bug in `DutchAuctionWrapper.decodeDutchAuctionData` (#1815)
    * Fallback to eth_sign if eth_signedTypedData fails (#1817)

## v9.1.2 - _May 14, 2019_

    * Dependencies updated

## v9.1.0 - _May 10, 2019_

    * Added CoordinatorWrapper to support orders with the Coordinator extension contract (#1792)

## v9.0.0 - _April 11, 2019_

    * Added a simulation to transfer from maker to taker during `exchange.validateOrderFillableOrThrowAsync` (#1714)
    * Added additional properties to `ValidateOrderFillableOpts`. An order can now be validated to fill a non-zero amount by specifying `validateRemainingOrderAmountIsFillable` as `false`. The default `true` will continue to validate the entire remaining balance is fillable. (#1714)

## v8.0.5 - _March 21, 2019_

    * Dependencies updated

## v8.0.4 - _March 20, 2019_

    * Dependencies updated

## v8.0.3 - _March 1, 2019_

    * Move contracts-test-utils and fill-scenarios to dev dependency (#1657)

## v8.0.2 - _February 27, 2019_

    * Dependencies updated

## v8.0.1 - _February 26, 2019_

    * Dependencies updated

## v8.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v7.1.0 - _February 9, 2019_

    * Added calldata decoding to ContractWrappers (#1569)

## v7.0.2 - _February 7, 2019_

    * Dependencies updated

## v7.0.1 - _February 7, 2019_

    * Dependencies updated

## v7.0.0 - _February 6, 2019_

    * Use new `ZeroExTransaction` interface (#1576)
    * Rename `getTransactionHex` to `getTransactionHashHex` (#1576)
    * Rename `getTransactionHex` to `getTransactionHashHex` (#1576)

## v6.0.0 - _February 5, 2019_

    * Fix OrderValidatorWrapper constructor to use the correct address (#1568)
    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v5.0.1 - _January 17, 2019_

    * Dependencies updated

## v5.0.0 - _January 15, 2019_

    * Renamed OrderStatus enum members to PascalCase to conform with tslint enum-naming rule (#1474)
    * Remove Exchange `matchOrdersAsync` optimization (#1514)

## v4.2.1 - _January 11, 2019_

    * Dependencies updated

## v4.2.0 - _January 9, 2019_

    * Added Dutch Auction wrapper (#1465)

## v4.1.4 - _Invalid date_

    * Add support for Trust Wallet signature denial error
    * Add balance and allowance queries for `MultiAssetProxy` (#1363)

## v4.1.3 - _December 13, 2018_

    * Dependencies updated

## v4.1.2 - _December 11, 2018_

    * Dependencies updated

## v4.1.1 - _November 28, 2018_

    * Dependencies updated

## v4.1.0 - _November 21, 2018_

    * Add a `nonce` field for `TxOpts` so that it's now possible to re-broadcast stuck transactions with a higher gas amount (#1292)

## v4.0.2 - _November 14, 2018_

    * Dependencies updated

## v4.0.1 - _November 13, 2018_

    * Dependencies updated

## v4.0.0 - _November 12, 2018_

    * Add signature validation, regular cancellation and `cancelledUpTo` checks to `validateOrderFillableOrThrowAsync` (#1235)
    * Improved the errors thrown by `validateOrderFillableOrThrowAsync` by making them more descriptive (#1235)
    * Throw previously swallowed network errors when calling `validateOrderFillableOrThrowAsync` (see issue: #1218) (#1235)

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
