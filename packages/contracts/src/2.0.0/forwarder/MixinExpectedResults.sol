/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../utils/LibBytes/LibBytes.sol";
import "../protocol/Exchange/libs/LibFillResults.sol";
import "../protocol/Exchange/libs/LibMath.sol";
import "../protocol/Exchange/libs/LibOrder.sol";
import "./MixinConstants.sol";

contract MixinExpectedResults is
    LibMath,
    LibFillResults,
    MixinConstants
{

    /// @dev Simulates the 0x Exchange fillOrder validation and calculations, without performing any state changes.
    /// @param order An Order struct containing order specifications.
    /// @param takerAssetFillAmount A number representing the amount of this order to fill.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function calculateFillResults(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount
    )
        internal
        view
        returns (FillResults memory fillResults)
    {
        LibOrder.OrderInfo memory orderInfo = EXCHANGE.getOrderInfo(order);
        uint256 remainingTakerAssetAmount = safeSub(order.takerAssetAmount, orderInfo.orderTakerAssetFilledAmount);
        uint256 takerAssetFilledAmount = min256(takerAssetFillAmount, remainingTakerAssetAmount);

        fillResults.takerAssetFilledAmount = takerAssetFilledAmount;
        fillResults.makerAssetFilledAmount = getPartialAmount(
            fillResults.takerAssetFilledAmount,
            order.takerAssetAmount,
            order.makerAssetAmount
        );
        fillResults.makerFeePaid = getPartialAmount(
            fillResults.takerAssetFilledAmount,
            order.takerAssetAmount,
            order.makerFee
        );
        fillResults.takerFeePaid = getPartialAmount(
            fillResults.takerAssetFilledAmount,
            order.takerAssetAmount,
            order.takerFee
        );
        return fillResults;
    }

    /// @dev Calculates a FillResults total for selling takerAssetFillAmount over all orders. 
    ///      Including the fees required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param takerAssetFillAmount A number representing the amount of this order to fill.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function calculateMarketSellResults(
        LibOrder.Order[] memory orders,
        uint256 takerAssetFillAmount
    )
        internal
        view
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            uint256 remainingTakerAssetFillAmount = safeSub(takerAssetFillAmount, totalFillResults.takerAssetFilledAmount);
            FillResults memory singleFillResult = calculateFillResults(orders[i], remainingTakerAssetFillAmount);
            addFillResults(totalFillResults, singleFillResult);
            if (totalFillResults.takerAssetFilledAmount == takerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Calculates a total FillResults for buying makerAssetFillAmount over all orders.
    ///      Including the fees required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param makerAssetFillAmount A number representing the amount of this order to fill.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function calculateMarketBuyResults(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount
    )
        public
        view
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            uint256 remainingMakerAssetFillAmount = safeSub(makerAssetFillAmount, totalFillResults.makerAssetFilledAmount);
            uint256 remainingTakerAssetFillAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                remainingMakerAssetFillAmount
            );
            FillResults memory singleFillResult = calculateFillResults(orders[i], remainingTakerAssetFillAmount);
            addFillResults(totalFillResults, singleFillResult);
            if (totalFillResults.makerAssetFilledAmount == makerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Calculates fill results for buyFeeTokens. This handles fees on buying ZRX
    ///      so the end result is the expected amount of ZRX (not less after fees).
    /// @param orders An array of Order struct containing order specifications.
    /// @param zrxFillAmount A number representing the amount zrx to buy
    /// @return totalFillResults Expected fill result amounts from buying fees
    function calculateMarketBuyZrxResults(
        LibOrder.Order[] memory orders,
        uint256 zrxFillAmount
    )
        public
        view
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            uint256 remainingZrxFillAmount = safeSub(zrxFillAmount, totalFillResults.makerAssetFilledAmount);
            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingWethSellAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                safeSub(orders[i].makerAssetAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingZrxFillAmount
            );
            FillResults memory singleFillResult = calculateFillResults(orders[i], safeAdd(remainingWethSellAmount, 1));

            singleFillResult.makerAssetFilledAmount = safeSub(singleFillResult.makerAssetFilledAmount, singleFillResult.takerFeePaid);
            addFillResults(totalFillResults, singleFillResult);
            // As we compensate for the rounding issue above have slightly more ZRX than the requested zrxFillAmount
            if (totalFillResults.makerAssetFilledAmount >= zrxFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }
}
