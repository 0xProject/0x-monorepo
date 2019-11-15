/*

  Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./MixinAssets.sol";


contract MixinExchangeWrapper is
    LibConstants,
    MixinAssets
{
    using LibSafeMath for uint256;

    /// @dev Fills the input order.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function _fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            IExchange(address(0)).fillOrder.selector,
            order,
            takerAssetFillAmount,
            signature
        );

        address exchange = address(EXCHANGE);
        (bool didSucceed, bytes memory returnData) = exchange.call(fillOrderCalldata);
        if (didSucceed) {
            assert(returnData.length == 160);
            fillResults = abi.decode(returnData, (LibFillResults.FillResults));
        }

        // fillResults values will be 0 by default if call was unsuccessful
        return fillResults;
    }

    /// @dev Executes a single call of fillOrder according to the wethSellAmount and
    ///      the amount already sold.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingTakerAssetFillAmount Remaining amount of WETH to sell.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketSellSingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingTakerAssetFillAmount
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // No taker fee or percentage fee
        if (order.takerFee == 0 || _isPercentageFee(order.takerFeeAssetData, order.makerAssetData)) {
            // Attempt to sell the remaining amount of WETH
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.protocolFeePaid);

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount
                .safeSub(singleFillResults.takerFeePaid);
        // WETH fee
        } else if (order.takerFeeAssetData.equals(order.takerAssetData)) {

            // We will first sell WETH as the takerAsset, then use it to pay the takerFee.
            // This ensures that we reserve enough to pay the taker and protocol fees.
            uint256 takerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.takerAssetAmount.safeAdd(order.takerFee),
                remainingTakerAssetFillAmount
            );

            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                takerAssetFillAmount,
                signature
            );

            // WETH is also spent on the taker fee, so we add it here.
            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.takerFeePaid)
                .safeAdd(singleFillResults.protocolFeePaid);

            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;
        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH has been sold by taker.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketSellWeth(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;
        uint256 protocolFee = tx.gasprice.safeMul(EXCHANGE.protocolFeeMultiplier());

        for (uint256 i = 0; i != ordersLength; i++) {
            // Preemptively skip to avoid division by zero in _marketSellSingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            // The remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = wethSellAmount
                .safeSub(totalWethSpentAmount)
                .safeSub(protocolFee);

            (
                uint256 wethSpentAmount,
                uint256 makerAssetAcquiredAmount
            ) = _marketSellSingleOrder(
                orders[i],
                signatures[i],
                remainingTakerAssetFillAmount
            );

            _transferAssetToSender(orders[i].makerAssetData, makerAssetAcquiredAmount);

            totalWethSpentAmount = totalWethSpentAmount
                .safeAdd(wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount
                .safeAdd(makerAssetAcquiredAmount);

            // Stop execution if the entire amount of WETH has been sold
            if (totalWethSpentAmount >= wethSellAmount) {
                break;
            }
        }
    }

    /// @dev Executes a single call of fillOrder according to the makerAssetBuyAmount and
    ///      the amount already bought.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingMakerAssetFillAmount Remaining amount of maker asset to buy.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketBuySingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingMakerAssetFillAmount
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // No taker fee or WETH fee
        if (order.takerFee == 0 || order.takerFeeAssetData.equals(order.takerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            // WETH is also spent on the protocol and taker fees, so we add it here.
            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.takerFeePaid)
                .safeAdd(singleFillResults.protocolFeePaid);

            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;
        // Percentage fee
        } else if (_isPercentageFee(order.takerFeeAssetData, order.makerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount.safeSub(order.takerFee),
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.protocolFeePaid);

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount
                .safeSub(singleFillResults.takerFeePaid);
        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is acquired.
    ///      Note that the Forwarder may fill more than the makerAssetBuyAmount so that, after percentage fees
    ///      are paid, the net amount acquired after fees is equal to makerAssetBuyAmount (modulo rounding).
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to fill.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketBuyExactAmountWithWeth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {
            // Preemptively skip to avoid division by zero in _marketBuySingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            uint256 remainingMakerAssetFillAmount = makerAssetBuyAmount
                .safeSub(totalMakerAssetAcquiredAmount);

            (
                uint256 wethSpentAmount,
                uint256 makerAssetAcquiredAmount
            ) = _marketBuySingleOrder(
                orders[i],
                signatures[i],
                remainingMakerAssetFillAmount
            );

            _transferAssetToSender(orders[i].makerAssetData, makerAssetAcquiredAmount);

            totalWethSpentAmount = totalWethSpentAmount
                .safeAdd(wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount
                .safeAdd(makerAssetAcquiredAmount);

            // Stop execution if the entire amount of makerAsset has been bought
            if (totalMakerAssetAcquiredAmount >= makerAssetBuyAmount) {
                break;
            }
        }

        if (totalMakerAssetAcquiredAmount < makerAssetBuyAmount) {
            LibRichErrors.rrevert(LibForwarderRichErrors.CompleteBuyFailedError(
                makerAssetBuyAmount,
                totalMakerAssetAcquiredAmount
            ));
        }
    }

    /// @dev Checks whether an order's taker fee is effectively denominated in the maker asset.
    ///      This is the case if they have the same ERC20Proxy asset data, or if the makerAssetData
    ///      is the ERC20Bridge equivalent of the takerFeeAssetData.
    /// @param takerFeeAssetData Byte array encoded for the takerFee asset proxy.
    /// @param makerAssetData Byte array encoded for the maker asset proxy.
    /// @return isPercentageFee Whether or not the taker fee asset matches the maker asset.
    function _isPercentageFee(
        bytes memory takerFeeAssetData,
        bytes memory makerAssetData
    )
        internal
        pure
        returns (bool)
    {
        bytes4 takerFeeAssetProxyId = takerFeeAssetData.readBytes4(0);
        // If the takerFee asset is not ERC20, it cannot be a percentage fee (and will revert with
        // an UnsupportedFeeError in the calling function).
        if (takerFeeAssetProxyId != ERC20_PROXY_ID) {
            return false;
        }

        bytes4 makerAssetProxyId = makerAssetData.readBytes4(0);
        if (makerAssetProxyId == ERC20_PROXY_ID) {
            // If the maker asset is ERC20, we can directly compare the asset data.
            return takerFeeAssetData.equals(makerAssetData);
        } else if (makerAssetProxyId == ERC20_BRIDGE_PROXY_ID) {
            // If the maker asset is from an ERC20Bridge, compare the underlying token addresses.
            address takerFeeToken = takerFeeAssetData.readAddress(16);
            address makerToken = makerAssetData.readAddress(16);
            return (takerFeeToken == makerToken);
        } else {
            // If the maker asset is of any other type, the taker fee cannot be a percentage fee.
            return false;
        }
    }
}
