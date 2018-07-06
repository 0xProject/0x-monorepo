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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../protocol/Exchange/Exchange.sol";
import "../protocol/Exchange/libs/LibFillResults.sol";
import "../protocol/Exchange/libs/LibOrder.sol";
import "../protocol/Exchange/libs/LibMath.sol";
import "./MixinConstants.sol";


contract MixinMarketBuyZrx is
    LibMath,
    LibFillResults,
    MixinConstants
{

    /// @dev Buys zrxBuyAmount of ZRX fee tokens, taking into account the fees on buying fee tokens. This will guarantee
    ///      At least zrxBuyAmount of ZRX fee tokens are purchased (sometimes slightly over due to rounding issues).
    ///      It is possible that a request to buy 200 ZRX fee tokens will require purchasing 202 ZRX tokens
    ///      As 2 ZRX is required to purchase the 200 ZRX fee tokens. This guarantees at least 200 ZRX for future purchases.
    /// @param orders An array of Order struct containing order specifications for fees.
    /// @param signatures An array of Proof that order has been created by maker for the fee orders.
    /// @param zrxBuyAmount The number of requested ZRX fee tokens.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker. makerTokenAmount is the zrx amount deducted of fees
    function marketBuyZrxInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256 zrxBuyAmount
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            // All of these are ZRX/WETH, we can drop the respective assetData from callData
            orders[i].makerAssetData = ZRX_ASSET_DATA;
            orders[i].takerAssetData = WETH_ASSET_DATA;
            // Calculate the remaining amount of makerToken to buy
            uint256 remainingZrxBuyAmount = safeSub(zrxBuyAmount, totalFillResults.makerAssetFilledAmount);
            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingWethSellAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                safeSub(orders[i].makerAssetAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingZrxBuyAmount
            );
            // Attempt to sell the remaining amount of takerToken
            // Round up the amount to ensure we don't under buy by a fractional amount
            FillResults memory singleFillResult = EXCHANGE.fillOrder(
                orders[i],
                safeAdd(remainingWethSellAmount, 1),
                signatures[i]
            );
            // We didn't buy the full amount when buying ZRX as some were taken for fees
            singleFillResult.makerAssetFilledAmount = safeSub(singleFillResult.makerAssetFilledAmount, singleFillResult.takerFeePaid);
            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResult);
            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerAssetFilledAmount >= zrxBuyAmount) {
                break;
            }
        }
        return totalFillResults;
    }
}
