<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v2.2.0-beta.1 - _November 6, 2019_

    * Dependencies updated

## v2.2.0-beta.0 - _October 3, 2019_

    * Use new/cheaper reentrancy guard/mutex (#1699)
    * Update domain separator (#1742)
    * Refactor `executeTransaction` to take `ZeroExTransaction` struct as input (#1753)
    * Refactor example contracts that use `executeTransaction` (#1753)
    * Upgrade all string reverts to rich reverts (#1761)
    * Add support for `SignatureType.OrderValidator` for orders (#1774)
    * Add support for `SignatureType.WalletOrderValidator` for orders (#1774)
    * Add a `bytes` return value to `executeTransaction`, which is equal to the encoded return data of the underlying Exchange function call (#1793)
    * Implement `batchExecuteTransactions` (#1793)
    * Refactor preSign to be compatible with `executeTransaction` (#1793)
    * Remove ZRX fees in lieu of arbitrary maker and taker fee tokens. (#1819)
    * Incorporate Multi-asset and ERC1155 tests into `fillOrder` and `matchOrders` tests (#1819)
    * Swap fill order from maker -> taker to taker -> maker (#1819)
    * Avoid redundant transfer in `fillOrder()` and `matchOrders()` when maker/taker is the same as feeRecipient and assets are the same (#1819)
    * Implement `cancelOrderNoThrow` and `batchCancelOrdersNoThrow` functions (#1827)
    * `executeTransaction` will now revert if the input transaction is expired (#1832)
    * Log an `TransactionExecuted` event when an `executeTransaction` call is successful (#1832)
    * Return a FillResults array for batch fill variants (#1834)
    * Add `MixinTransferSimulator` contract for simulating multiple transfers on-chain (#1868)
    * Add `EIP1271Wallet` signature type (#1885)
    * Remove `WalletOrderValidator` and `OrderValidator` signature types (#1885)
    * Make the regular `Validator` signature type have EIP1271 behavior (#1885)
    * Always check signature types that are validated via contract (not just on first fill). (#1885)
    * Remove unecessary rich revert error types. (#1885)
    * Add `IEIP1271Wallet` interface (#1885)
    * Add `validatorAddress` field to `SignatureValidatorError` rich reverts (#1885)
    * Make `calculateMatchedFillResults` public (#1885)
    * Updated RichErrors to the library pattern (#1913)
    * Rewrote _dispatchTransferFrom in Solidity (#2020)
    * Add `TestIsolatedExchange` contract and `IsolatedExchangeWrapper` test class (#2031)
    * Add `ReferenceFunctions` as package export. (#2031)
    * Remove `TestExchangeMath.sol`. Exchange math functions are now tested in the `exchange-libs` package and reference implementations are available there as well. (#2031)
    * Remove functions from `TestExchangeInternals.sol` that are no longer tested in this package. (#2031)
    * Remove `_assertValidFill()` (#2031)
    * Add `wrapper_unit_tests` tests and `TestWrapperFunctions` contract (#2042)
    * Disallow `signerAddress == 0` in signature validation functions. (#2042)
    * Update `Wallet` signature type behavior to be in line with v2.1. (#2042)
    * Add (semi) automated reentrancy tests and remove manual ones (#2042)
    * Refactor to use new `LibFillResults`, `LibOrder`, `LibZeroExTransaction`, and `LibMath` to libraries (#2055)
    * Remove `LibExchangeRichErrors` and `IExchangeRichErrors` (#2055)
    * Use built in selectors instead of `LibExchangeSelectors` constants (#2055)
    * Move `calculateFillResults` and `calculateMatchedFillResults` to `LibFillResults` in `exchange-libs` package (#2055)
    * Compile and export all contracts, artifacts, and wrappers by default (#2055)
    * Rename `marketSellOrders` and `marketBuyOrders` back to `marketSellOrdersNoThrow` and `marketBuyOrdersNoThrow`. (#2075)
    * Introduce new `marketSellOrdersFillOrKill` and `marketBuyOrdersFillOrKill` functions. (#2075)
    * Use `abi.decode()` in `LibExchangeRichErrorDecoder` over `LibBytes`. (#2075)
    * Overridden functions in `ReentrancyTester` now return sane values. (#2075)

## v2.1.14 - _September 17, 2019_

    * Dependencies updated

## v2.1.13 - _September 3, 2019_

    * Dependencies updated

## v2.1.12 - _August 22, 2019_

    * Dependencies updated

## v2.1.11 - _August 8, 2019_

    * Dependencies updated

## v2.1.10 - _July 31, 2019_

    * Updated calls to <contract wrapper>.deployFrom0xArtifactAsync to include artifact dependencies. (#1995)

## v2.1.9 - _July 24, 2019_

    * Dependencies updated

## v2.1.8 - _July 15, 2019_

    * Dependencies updated

## v2.1.7 - _July 13, 2019_

    * Dependencies updated

## v2.1.6 - _July 13, 2019_

    * Dependencies updated

## v2.1.5 - _May 24, 2019_

    * Dependencies updated

## v2.1.4 - _May 15, 2019_

    * Dependencies updated

## v2.1.3 - _May 14, 2019_

    * Dependencies updated

## v2.1.2 - _May 10, 2019_

    * Dependencies updated

## v2.1.1 - _April 11, 2019_

    * Dependencies updated

## v2.1.0 - _March 21, 2019_

    * Run Web3ProviderEngine without excess block polling (#1695)

## v2.0.0 - _March 20, 2019_

    * Do not reexport external dependencies (#1682)
    * Upgrade contracts to Solidity 0.5.5 (#1682)
    * Integration testing for ERC1155Proxy (#1673)

## v1.0.9 - _March 1, 2019_

    * Dependencies updated

## v1.0.8 - _February 27, 2019_

    * Dependencies updated

## v1.0.7 - _February 26, 2019_

    * Dependencies updated

## v1.0.6 - _February 25, 2019_

    * Dependencies updated

## v1.0.5 - _February 9, 2019_

    * Dependencies updated

## v1.0.4 - _February 7, 2019_

    * Dependencies updated

## v1.0.3 - _February 7, 2019_

    * Fake publish to enable pinning

## v1.0.2 - _February 6, 2019_

    * Dependencies updated

## v1.0.1 - _February 5, 2019_

    * Dependencies updated

## v1.0.0 - _Invalid date_

    * Move Exchange contract out of contracts-protocol to new package (#1539)
    * Move example contracts out of contracts-examples to new package (#1539)
