<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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

## v1.0.0-rc.1 - _July 20, 2018_

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

## v0.0.4 - _May 5, 2018_

    * Dependencies updated

## v0.0.3 - _May 4, 2018_

    * Dependencies updated

## v0.0.2 - _May 4, 2018_

    * Dependencies updated
