<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

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

## v1.0.0-rc.1 - _July 20, 2018_

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

## v0.6.3 - _May 5, 2018_

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
