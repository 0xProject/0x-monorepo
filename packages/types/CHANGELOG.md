<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.1.2 - _February 8, 2020_

    * Dependencies updated

## v3.1.1 - _December 17, 2019_

    * Added `DydxBridgeOnlyCallableByErc20BridgeProxy` and `DydxBridgeUnrecognizedBridgeAction` (#2378)

## v3.1.0 - _December 9, 2019_

    * Add `ERC20BridgeAssetData` (#2373)

## v3.0.0 - _December 2, 2019_

    * Remove `SendTransactionOpts` and `AwaitTransactionSuccessOpts` types and move them to @0x/base-contracts (#2325)
    * Add `SendTransactionOpts` and `AwaitTransactionSuccessOpts` types for contract wrappers (#2243)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)
    * Add `OrderStatus` type (#1761)
    * Add `OrderInfo`, `FillResults`, `MatchedFillResults`, `BatchMatchedFillResults` types (#2031)
    * Add status types for Staking contracts (#1910)
    * Add `ERC20Bridge` to `AssetProxyId` (#2220)

## v2.5.0-beta.3 - _December 2, 2019_

    * Dependencies updated

## v2.5.0-beta.2 - _November 17, 2019_

    * Remove `SendTransactionOpts` and `AwaitTransactionSuccessOpts` types and move them to @0x/base-contracts (#2325)

## v2.5.0-beta.1 - _November 7, 2019_

    * Add `SendTransactionOpts` and `AwaitTransactionSuccessOpts` types for contract wrappers (#2243)
    * All references to network ID have been removed, and references to chain ID have been introduced instead (#2313)

## v2.5.0-beta.0 - _October 3, 2019_

    * Add `OrderStatus` type (#1761)
    * Add `OrderInfo`, `FillResults`, `MatchedFillResults`, `BatchMatchedFillResults` types (#2031)
    * Add status types for Staking contracts (#1910)
    * Add `ERC20Bridge` to `AssetProxyId` (#2220)

## v2.4.3 - _September 17, 2019_

    * Dependencies updated

## v2.4.2 - _September 3, 2019_

    * Dependencies updated

## v2.4.1 - _July 24, 2019_

    * Dependencies updated

## v2.4.0 - _July 13, 2019_

    * Add MarketOperation type (#1914)

## v2.3.0 - _Invalid date_

    * Add StaticCallProxy types (#1863)
    * Add `InvalidStaticCallDataOffset`, `TargetNotEven`, `UnexpectedStaticCallResult`, and `InvalidAssetDataEnd` to `RevertReason` enum (#1863)
    * Add `domain` field to `Order`, `ZeroExTransaction` (#1742)
    * Rename OrderWithoutExchangeAddress to OrderWithoutDomain (#1742)
    * Add `chainId` field to `EIP712DomainWithDefaultSchema` (#1742)
    * Add `OrderStatus` type (#1761)
    * Add `SignatureType.OrderValidator` and `SignatureType.WalletOrderValidator` (#1774)
    * Update `Order` type for arbitrary fee tokens (ZEIP-28). (#1819)
    * Add `expirationTimeSeconds` to `ZeroExTransaction` type (#1832)
    * Add `TransfersSuccessful` revert reason and `OrderTransferResults` enum (#1868)
    * Consolidate all Validator `SignatureType`s to just `Validator` (#1885)
    * Add `EIP1271Wallet` to `SignatureType` (#1885)

## v2.2.2 - _April 11, 2019_

    * Dependencies updated

## v2.2.1 - _March 21, 2019_

    * Dependencies updated

## v2.2.0 - _March 20, 2019_

    * Added ERC1155 revert reasons (#1657)
    * Added `ERC1155AssetData`, `ERC1155AssetDataNoProxyId`, and `ERC1155AssetDataAbi` (#1661)
    * Add `InvalidOrigin` revert reason (#1668)
    * Add `RevertReason.SignatureInvalid` thrown by Coordinator (#1705)
    * Add `RevertReason.InvalidFreeMemoryPtr` thrown by LibAddressArray (#1712)

## v2.1.1 - _February 26, 2019_

    * Dependencies updated

## v2.1.0 - _February 25, 2019_

    * Add `FromLessThanToRequired` and `ToLessThanLengthRequired` revert reasons (#1604)

## v2.0.2 - _February 7, 2019_

    * Dependencies updated

## v2.0.1 - _February 6, 2019_

    * Dependencies updated

## v2.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)
    * Update `ZeroExTransaction` type and add `SignedZeroExTransaction` type (#1576)
    * Add `EIP712DomainWithDefaultSchema` type (#1576)

## v1.5.2 - _January 15, 2019_

    * Dependencies updated

## v1.5.1 - _January 11, 2019_

    * Dependencies updated

## v1.5.0 - _January 9, 2019_

    * Added types for Dutch Auction contract (#1465)

## v1.4.1 - _December 13, 2018_

    * Dependencies updated

## v1.4.0 - _December 11, 2018_

    * Add `LengthMismatch` and `LengthGreaterThan3Required` revert reasons (#1224)
    * Add RevertReasons for DutchAuction contract (#1225)
    * Add MultiAsset types (#1363)

## v1.3.0 - _November 21, 2018_

    * Add the `SimpleContractArtifact` type, which describes the artifact format published in the `@0x/contract-artifacts` package (#1298)

## v1.2.1 - _November 9, 2018_

    * Dependencies updated

## v1.2.0 - _October 18, 2018_

    * Added `EIP712Parameter` `EIP712Types` `EIP712TypedData` for EIP712 signing (#1102)
    * Added `ZeroExTransaction` type for Exchange executeTransaction (#1102)
    * Add `AssetData` union type (`type AssetData = ERC20AssetData | ERC721AssetData`) (#1131)

## v1.1.4 - _October 4, 2018_

    * Dependencies updated

## v1.1.3 - _October 2, 2018_

    * Dependencies updated

## v1.1.2 - _September 28, 2018_

    * Dependencies updated

## v1.1.1 - _September 25, 2018_

    * Dependencies updated

## v1.1.0 - _September 25, 2018_

    * Add ObjectMap type (#1037)
    * Add SRA types from connect (#1085)

## v1.0.2 - _September 21, 2018_

    * Dependencies updated

## v1.0.1 - _September 5, 2018_

    * Add AssetProxyOwner revert reasons (#1041)
    * Add MultiSigWalletWithTimeLock revert reasons (#1050)

## v1.0.1-rc.6 - _August 27, 2018_

    * Add WalletError and ValidatorError revert reasons (#1012)
    * Remove Caller and Trezor SignatureTypes (#1015)

## v1.0.1-rc.5 - _August 24, 2018_

    * Add revert reasons for ERC721Token (#933)

## v1.0.1-rc.4 - _August 14, 2018_

    * Added SignerType to handle different signing prefix scenarios (#914)

## v1.0.1-rc.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.1-rc.2 - _July 26, 2018_

    * Dependencies updated

## v1.0.1-rc.1 - _July 26, 2018_

    * Remove `ECSignatureBuffer`

## v1.0.0 - _July 23, 2018_

    * Dependencies updated

## v1.0.0-rc.1 - _July 19, 2018_

    * Updated types for V2 of 0x protocol
    * Add `ECSignatureBuffer`
    * Add Forwarder contract revert reasons

## v0.8.2 - _July 9, 2018_

    * Dependencies updated

## v0.8.1 - _June 19, 2018_

    * Dependencies updated

## v0.8.0 - _May 22, 2018_

    * Change the order type to v2 format (#618)

## v0.7.0 - _May 22, 2018_

    * Make OpCode type an enum (#589)
    * Moved ExchangeContractErrs, DoneCallback, Token, OrderRelevantState, OrderStateValid, OrderStateInvalid, OrderState, OrderAddresses and OrderValues types from 0x.js (#579)

## v0.6.3 - _May 4, 2018_

    * Dependencies updated

## v0.6.2 - _May 4, 2018_

    * Dependencies updated

## v0.6.1 - _April 18, 2018_

    * Dependencies updated

## v0.6.0 - _April 11, 2018_

    * Add Provider type (#501)

## v0.5.0 - _April 2, 2018_

    * Make `DataItem.components` optional (#485)

## v0.4.2 - _April 2, 2018_

    * Dependencies updated

## v0.4.0 - _March 17, 2018_

    * Remove `JSONRPCPayload` (#426)
    * Consolidate `Order`, `SignedOrder`, and `ECSignature` into the `@0xproject/types` package (#456)

## v0.3.1 - _March 7, 2018_

    * Added `RawLogEntry` type.

## v0.3.0 - _March 3, 2018_

    * Add `data` to `TxData` (#413)
    * Add `number` as an option to `ContractEventArg` (#413)
    * Move web3 types from devDep to dep since required when using this package (#429)

## v0.2.1 - _February 8, 2018_

    * Fix publishing issue where .npmignore was not properly excluding undesired content (#389)

## v0.2.0 - _February 6, 2018_

    * Added BlockLiteralParam and BlockParam, refactored out of 0x.js types. (#355)
