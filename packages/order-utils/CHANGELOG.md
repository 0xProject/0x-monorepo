<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v8.5.0-beta.4 - _December 2, 2019_

    * Dependencies updated

## v8.5.0-beta.3 - _November 20, 2019_

    * Dependencies updated

## v8.5.0-beta.2 - _November 17, 2019_

    * [Breaking] Removed `OrderStateUtils`, `OrderValidationUtils`, `ExchangeTransferSimulator` and all abstract and store classes. For order validation, please use the `DevUtils` contract wrapper method `getOrderRelevantState`|`getOrderRelevantStates` (#2324)
    * Removed exports CoordinatorRevertErrors, ExchangeRevertErrors, ForwarderRevertErrors, LibMathRevertErrors, orderHashUtils, orderParsingUtils, StakingRevertErrors and transactionHashUtils (#2321)
    * Removed many functions from export signatureUtils (#2321)
    * Removed function isValidOrderHash from export orderHashUtils (#2321)

## v8.5.0-beta.1 - _November 7, 2019_

    * Remove `TransferFailedError` from `ForwarderRevertErrors`. (#2309)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v8.5.0-beta.0 - _October 3, 2019_

    * Add `chainId` `OrderValidationUtils`, `OrderFactory` (#1742)
    * Update tools to use new `Order` and `ZeroExTransaction` structure (#1742)
    * Update domain schema for Exchange and Coordinator (#1742)
    * Add Exchange `RevertError` types to `ExchangeRevertErrors` (#1761)
    * Add `SignatureOrderValidatorError` type to `ExchangeRevertErrors` (#1774)
    * Add `SignatureWalletOrderValidatorError` type to `ExchangeRevertErrors` (#1774)
    * Reorder parameters of some `RevertError` types to match smart contracts. (#1790)
    * Use arbitrary fee tokens instead of ZRX (ZEIP-28) for tools needed by contracts packages. (#1819)
    * Update `RevertError` types for new base constructor (#1819)
    * Add `Expired` TransactionErrorCode (#1832)
    * Add `expirationTimeSeconds` to `ZeroExTransaction` parameters used for hashing (#1832)
    * Add `validator` field to `SignatureValidatorError` `RevertError` types. (#1885)
    * Remove unused `RevertError` types. (#1885)
    * Add `ExchangeRevertErrors.SignatureErrorCode.InvalidSigner`. (#2042)
    * Add `takerAssetFillAmount` field to `IncompleteFillError` type (#2075)
    * Update `IncompleteFillError` to take an `errorCode`, `expectedAssetFillAmount`, and `actualAssetFillAmount` fields. (#2075)
    * Add EIP712 types for Staking (#1910)
    * Add `InvalidCobbDouglasAlphaError` `RevertError` type to `StakingRevertErrors` (#2109)
    * Rename `OperatorShareMustBeBetween0And100Error` `RevertError` type to `InvalidPoolOperatorShareError`. (#2109)
    * Add `TransactionGasPriceError` and `TransactionInvalidContextError` to error registry. (#2109)
    * Add `EthVaultNotSetError, `RewardVaultNotSetError`, and `InvalidStakeStatusError` to error registry. (#2118)
    * Add `InvalidStakeStatusError` to error registry. (#2126)
    * Add `InitializationError`, `InvalidParamValue` to `StakingRevertErrors`. (#2131)
    * Add `CumulativeRewardIntervalError`. (#2154)
    * Remove `validateOrderFillableOrThrowAsync`, `simpleValidateOrderFillableOrThrowAsync`, `validateMakerTransferThrowIfInvalidAsync` (#2181)
    * Add `PreviousEpochNotFinalizedError` to `StakingRevertErrors`. (#2155)
    * Add `InvalidMinimumPoolStake` to `StakingRevertErrors.InvalidParamValueErrorCode`. (#2155)
    * Renamed `OnlyCallableByPoolOperatorOrMakerError` to `OnlyCallableByPoolOperatorError`. (#2250)
    * Removed protocol fee != 0 error. (#2278)

## v8.4.0 - _September 17, 2019_

    * Implement `simpleValidateOrderFillableOrThrowAsync` (#2096)

## v8.3.1 - _September 3, 2019_

    * Dependencies updated

## v8.3.0 - _August 22, 2019_

    * Fix isValidValidatorSignatureAsync, allow to pass exchangeAddress to isValidSignatureAsync. (#2017)
    * Fix `Wallet` and `Validator` signature validation (#2078)

## v8.2.5 - _August 8, 2019_

    * Dependencies updated

## v8.2.4 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deploy0xArtifactAsync to include log decode dependencies. (#1995)

## v8.2.3 - _July 24, 2019_

    * Ensure `assetData` is word aligned (#1964)

## v8.2.2 - _July 15, 2019_

    * Dependencies updated

## v8.2.1 - _July 13, 2019_

    * Dependencies updated

## v8.2.0 - _July 13, 2019_

    * Add support for encoding/decoding StaticCallProxy assetData (#1863)
    * Add support for marketSell utils (#1914)
    * Add support for encoding/decoding DutchAuction assetData (#1943)
    * Added `validateMakerTransferThrowIfInvalidAsync` to OrderValidationUtils (#1937)

## v8.1.1 - _May 24, 2019_

    * Dependencies updated

## v8.1.0 - _May 15, 2019_

    * Add `ecSignTransactionAsync` (#1817)

## v8.0.2 - _May 14, 2019_

    * Dependencies updated

## v8.0.0 - _May 10, 2019_

    * Renamed `OrderError` to `TypedDataError` (#1792)

## v7.2.0 - _April 11, 2019_

    * Added `orderCalculationUtils` (#1714)

## v7.1.1 - _March 21, 2019_

    * Dependencies updated

## v7.1.0 - _March 20, 2019_

    * Add Coordinator EIP712 constants (#1705)
    * Added encoding/decoding for ERC1155 asset data (#1661)

## v7.0.2 - _March 1, 2019_

    * Dependencies updated

## v7.0.1 - _February 26, 2019_

    * Dependencies updated

## v7.0.0 - _February 25, 2019_

    * Add support for EIP1193 providers & Web3.js providers >= 1.0-beta.38 (#1627)
    * Update provider params to type SupportedProvider which outlines all supported providers (#1627)

## v6.1.0 - _February 9, 2019_

    * Updated implementation of `generatePseudoRandomSalt` to use generator from @0x/utils (#1569)

## v6.0.1 - _February 7, 2019_

    * Dependencies updated

## v6.0.0 - _February 7, 2019_

    * undefined

## v5.0.0 - _February 6, 2019_

    * Add `transactionHashUtils` (#1576)
    * Refactor `eip712Utils` to allow custom domain params (#1576)
    * Export constant EIP712 params (#1576)

## v4.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Fix preSigned `isSignatureValidAsync` check (#1580)

## v3.1.2 - _January 15, 2019_

    * Dependencies updated

## v3.1.1 - _January 11, 2019_

    * Dependencies updated

## v3.1.0 - _January 9, 2019_

    * Use new ABI encoder, add encoding/decoding logic for MultiAsset assetData, and add information to return values in orderStateUtils (#1363)

## v3.0.7 - _December 13, 2018_

    * Dependencies updated

## v3.0.6 - _December 11, 2018_

    * Fix bug in wallet signature type verification (#1414)

## v3.0.5 - _December 10, 2018_

    * Dependencies updated

## v3.0.4 - _November 28, 2018_

    * Dependencies updated

## v3.0.3 - _November 21, 2018_

    * Dependencies updated

## v3.0.2 - _November 14, 2018_

    * Dependencies updated

## v3.0.1 - _November 13, 2018_

    * Dependencies updated

## v3.0.0 - _November 12, 2018_

    * Add signature validation, regular cancellation and `cancelledUpTo` checks to `validateOrderFillableOrThrowAsync` (#1235)
    * Improved the errors thrown by `validateOrderFillableOrThrowAsync` by making them more descriptive (#1235)
    * Throw previously swallowed network errors when calling `validateOrderFillableOrThrowAsync` (see issue: #1218) (#1235)
    * Modified the `AbstractOrderFilledCancelledFetcher` interface slightly such that `isOrderCancelledAsync` accepts a `signedOrder` instead of an `orderHash` param (#1235)

## v2.0.1 - _November 9, 2018_

    * Dependencies updated

## v2.0.0 - _October 18, 2018_

    * Added `ecSignOrderAsync` to first sign an order using `eth_signTypedData` and fallback to `eth_sign`. (#1102)
    * Added `ecSignTypedDataOrderAsync` to sign an order exclusively using `eth_signTypedData`. (#1102)
    * Rename `ecSignOrderHashAsync` to `ecSignHashAsync` removing `SignerType` parameter. (#1102)
    * Use `AssetData` union type for function return values. (#1131)

## v1.0.7 - _October 4, 2018_

    * Dependencies updated

## v1.0.6 - _September 28, 2018_

    * Add signerAddress normalization to `isValidECSignature` to avoid `invalid address recovery` error if caller supplies a checksummed address (#1096)

## v1.0.5 - _September 25, 2018_

    * Dependencies updated

## v1.0.4 - _September 25, 2018_

    * Dependencies updated

## v1.0.3 - _September 21, 2018_

    * Dependencies updated

## v1.0.2 - _September 19, 2018_

    * Drastically reduce the bundle size by removing unused parts of included contract artifacts.

## v1.0.1 - _September 5, 2018_

    * Export `orderParsingUtils` (#1044)

## v1.0.1-rc.6 - _August 27, 2018_

    * Fix missing `BlockParamLiteral` type import issue

## v1.0.1-rc.5 - _Invalid date_

    * Remove Caller and Trezor SignatureTypes (#1015)

## v1.0.1-rc.4 - _August 24, 2018_

    * Remove rounding error being thrown when maker amount is very small (#959)
    * Added rateUtils and sortingUtils (#953)
    * Update marketUtils api such that all optional parameters are bundled into one optional param and more defaults are provided (#954)
    * Instead of exporting signature util methods individually, they are now exported as `signatureUtils` (#924)
    * Export types: `SignedOrder`, `Order`, `OrderRelevantState`, `OrderState`, `ECSignature`, `ERC20AssetData`, `ERC721AssetData`, `AssetProxyId`, `SignerType`, `SignatureType`, `OrderStateValid`, `OrderStateInvalid`, `ExchangeContractErrs`, `TradeSide`, `TransferType`, `FindFeeOrdersThatCoverFeesForTargetOrdersOpts`, `FindOrdersThatCoverMakerAssetFillAmountOpts`, `FeeOrdersAndRemainingFeeAmount`, `OrdersAndRemainingFillAmount`, `Provider`, `JSONRPCRequestPayload`, `JSONRPCErrorCallback` and `JSONRPCResponsePayload` (#924)
    * Rename `resultOrders` to `resultFeeOrders` for object returned by `findFeeOrdersThatCoverFeesForTargetOrders` in `marketUtils` api (#997)
    * Make `sortFeeOrdersByFeeAdjustedRate` in `sortingUtils` generic (#997)
    * Update `findFeeOrdersThatCoverFeesForTargetOrders` to round the the nearest integer when calculating required fees (#997)

## v1.0.1-rc.3 - _August 14, 2018_

    * Update ecSignOrderHashAsync to return signature string with signature type byte. Removes messagePrefixOpts. (#914)
    * Added a synchronous `createOrder` method in `orderFactory`, updated public interfaces to support some optional parameters (#936)
    * Added marketUtils (#937)
    * Dependencies updated

## v1.0.1-rc.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1-rc.1 - _July 26, 2018_

    * Dependencies updated

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.2 - _July 23, 2018_

    * Upgrade ethereumjs-abi dep including a fix so that addresses starting with 0 are properly decoded by `decodeERC20AssetData`

## v1.0.0-rc.1 - _July 19, 2018_

    * Refactor to work with V2 of 0x protocol (#636)
    * Export parseECSignature method (#684)
    * Handle Typed Arrays when hashing data (#894)

## v0.0.9 - _July 18, 2018_

    * Dependencies updated

## v0.0.8 - _July 9, 2018_

    * Dependencies updated

## v0.0.7 - _June 19, 2018_

    * Dependencies updated

## v0.0.6 - _May 29, 2018_

    * Dependencies updated

## v0.0.5 - _May 22, 2018_

    * Add orderStateUtils, a module for computing order state needed to decide if an order is still valid

## v0.0.4 - _May 4, 2018_

    * Dependencies updated

## v0.0.3 - _May 4, 2018_

    * Dependencies updated

## v0.0.2 - _May 4, 2018_

    * Dependencies updated
