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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./mixins/MExchangeCore.sol";
import "./mixins/MMatchOrders.sol";
import "./mixins/MSettlement.sol";
import "./mixins/MTransactions.sol";
import "../../utils/SafeMath/SafeMath.sol";
import "./libs/LibMath.sol";
import "./libs/LibOrder.sol";
import "./libs/LibStatus.sol";
import "../../utils/LibBytes/LibBytes.sol";

contract MixinMatchOrders is
    SafeMath,
    LibBytes,
    LibMath,
    LibStatus,
    LibOrder,
    MExchangeCore,
    MMatchOrders,
    MSettlement,
    MTransactions
    {

    /// @dev Validates context for matchOrders. Succeeds or throws.
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    function validateMatchOrdersContextOrRevert(
        Order memory leftOrder,
        Order memory rightOrder)
        internal
    {
        // The leftOrder maker asset must be the same as the rightOrder taker asset.
        require(areBytesEqual(leftOrder.makerAssetData, rightOrder.takerAssetData));

        // The leftOrder taker asset must be the same as the rightOrder maker asset.
        require(areBytesEqual(leftOrder.takerAssetData, rightOrder.makerAssetData));

        // Make sure there is a positive spread.
        // There is a positive spread iff the cost per unit bought (OrderA.MakerAmount/OrderA.TakerAmount) for each order is greater
        // than the profit per unit sold of the matched order (OrderB.TakerAmount/OrderB.MakerAmount).
        // This is satisfied by the equations below:
        // <leftOrder.makerAssetAmount> / <leftOrder.takerAssetAmount> >= <rightOrder.takerAssetAmount> / <rightOrder.makerAssetAmount>
        // AND
        // <rightOrder.makerAssetAmount> / <rightOrder.takerAssetAmount> >= <leftOrder.takerAssetAmount> / <leftOrder.makerAssetAmount>
        // These equations can be combined to get the following:
        require(
            safeMul(leftOrder.makerAssetAmount, rightOrder.makerAssetAmount) >=
            safeMul(leftOrder.takerAssetAmount, rightOrder.takerAssetAmount)
        );
    }

    /// @dev Validates matched fill results. Succeeds or throws.
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function validateMatchedOrderFillResultsOrThrow(MatchedFillResults memory matchedFillResults)
        internal
    {
        // The right order must spend at least as much as we're transferring to the left order's maker.
        // If the amount transferred from the right order is greater than what is transferred, it is a rounding error amount.
        // Ensure this difference is negligible by dividing the values with each other. The result should equal to ~1.
        require(matchedFillResults.right.makerAssetFilledAmount >= matchedFillResults.left.takerAssetFilledAmount);
        require(!isRoundingError(matchedFillResults.right.makerAssetFilledAmount, matchedFillResults.left.takerAssetFilledAmount, 1));
    }

    /// @dev Calculates partial value given a numerator and denominator.
    ///      Throws if there is a rounding error.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function safeGetPartialAmount(
        uint256 numerator,
        uint256 denominator,
        uint256 target)
        internal pure
        returns (uint256 partialAmount)
    {
        require(!isRoundingError(numerator, denominator, target));
        return getPartialAmount(numerator, denominator, target);
    }

    /// @dev Calculates fill amounts for the matched orders.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the leftOrder order goes to the taker (who matched the two orders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftOrderStatus Order status of left order.
    /// @param rightOrderStatus Order status of right order.
    /// @param leftOrderFilledAmount Amount of left order already filled.
    /// @param rightOrderFilledAmount Amount of right order already filled.
    /// @return status Return status of calculating fill amounts. Returns Status.SUCCESS on success.
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function calculateMatchedFillResults(
        Order memory leftOrder,
        Order memory rightOrder,
        uint8 leftOrderStatus,
        uint8 rightOrderStatus,
        uint256 leftOrderFilledAmount,
        uint256 rightOrderFilledAmount)
        internal
        returns (
            uint8 status,
            MatchedFillResults memory matchedFillResults)
    {
        // We settle orders at the price point defined by the right order (profit goes to the order taker)
        // The constraint can be either on the left or on the right.
        // The constraint is on the left iff the amount required to fill the left order
        // is less than or equal to the amount we can spend from the right order:
        //    <leftTakerAssetAmountRemaining> <= <rightTakerAssetAmountRemaining> * <rightMakerToTakerRatio>
        //    <leftTakerAssetAmountRemaining> <= <rightTakerAssetAmountRemaining> * <rightOrder.makerAssetAmount> / <rightOrder.takerAssetAmount>
        //    <leftTakerAssetAmountRemaining> * <rightOrder.takerAssetAmount> <= <rightTakerAssetAmountRemaining> * <rightOrder.makerAssetAmount>
        uint256 rightTakerAssetAmountRemaining = safeSub(rightOrder.takerAssetAmount, rightOrderFilledAmount);
        uint256 leftTakerAssetAmountRemaining = safeSub(leftOrder.takerAssetAmount, leftOrderFilledAmount);
        uint256 leftOrderAmountToFill = 0;
        uint256 rightOrderAmountToFill = 0;
        if (
            safeMul(leftTakerAssetAmountRemaining, rightOrder.takerAssetAmount) <=
            safeMul(rightTakerAssetAmountRemaining, rightOrder.makerAssetAmount)
        ) {
            // Left order is the constraint: maximally fill left
            leftOrderAmountToFill = leftTakerAssetAmountRemaining;

            // The right order receives an amount proportional to how much was spent.
            // TODO: Ensure rounding error is in the correct direction.
            rightOrderAmountToFill = safeGetPartialAmount(
                rightOrder.takerAssetAmount,
                rightOrder.makerAssetAmount,
                leftOrderAmountToFill);
        } else {
            // Right order is the constraint: maximally fill right
            rightOrderAmountToFill = rightTakerAssetAmountRemaining;

            // The left order receives an amount proportional to how much was spent.
            // TODO: Ensure rounding error is in the correct direction.
            leftOrderAmountToFill = safeGetPartialAmount(
                rightOrder.makerAssetAmount,
                rightOrder.takerAssetAmount,
                rightOrderAmountToFill);
        }

        // Calculate fill results for left order
        (   status,
            matchedFillResults.left
        ) = calculateFillResults(
            leftOrder,
            leftOrderStatus,
            leftOrderFilledAmount,
            leftOrderAmountToFill);
        if (status != uint8(Status.SUCCESS)) {
            return (status, matchedFillResults);
        }

        // Calculate fill results for right order
        (   status,
            matchedFillResults.right
        ) = calculateFillResults(
            rightOrder,
            rightOrderStatus,
            rightOrderFilledAmount,
            rightOrderAmountToFill);
        if (status != uint8(Status.SUCCESS)) {
            return (status, matchedFillResults);
        }

        // Validate the fill results
        validateMatchedOrderFillResultsOrThrow(matchedFillResults);

        // Return status & fill results
        return (status, matchedFillResults);
    }

    /// @dev Match two complementary orders that have a positive spread.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the left order goes to the taker (who matched the two orders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftSignature Proof that order was created by the left maker.
    /// @param rightSignature Proof that order was created by the right maker.
    /// @return matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
    function matchOrders(
        Order memory leftOrder,
        Order memory rightOrder,
        bytes leftSignature,
        bytes rightSignature)
        public
        returns (MatchedFillResults memory matchedFillResults)
    {
        // Get left status
        OrderInfo memory leftOrderInfo;
        (   leftOrderInfo.orderStatus,
            leftOrderInfo.orderHash,
            leftOrderInfo.orderFilledAmount
        ) = getOrderInfo(leftOrder);
        if (leftOrderInfo.orderStatus != uint8(Status.ORDER_FILLABLE)) {
            emit ExchangeStatus(uint8(leftOrderInfo.orderStatus), leftOrderInfo.orderHash);
            return matchedFillResults;
        }

        // Get right status
        OrderInfo memory rightOrderInfo;
        (   rightOrderInfo.orderStatus,
            rightOrderInfo.orderHash,
            rightOrderInfo.orderFilledAmount
        ) = getOrderInfo(rightOrder);
        if (rightOrderInfo.orderStatus != uint8(Status.ORDER_FILLABLE)) {
            emit ExchangeStatus(uint8(rightOrderInfo.orderStatus), rightOrderInfo.orderHash);
            return matchedFillResults;
        }

        // Fetch taker address
        address takerAddress = getCurrentContextAddress();

        // Either our context is valid or we revert
        validateMatchOrdersContextOrRevert(leftOrder, rightOrder);

        // Compute proportional fill amounts
        uint8 matchedFillAmountsStatus;
        (   matchedFillAmountsStatus,
            matchedFillResults
        ) = calculateMatchedFillResults(
            leftOrder,
            rightOrder,
            leftOrderInfo.orderStatus,
            rightOrderInfo.orderStatus,
            leftOrderInfo.orderFilledAmount,
            rightOrderInfo.orderFilledAmount);
        if (matchedFillAmountsStatus != uint8(Status.SUCCESS)) {
            return matchedFillResults;
        }

        // Validate fill contexts
        validateFillOrderContextOrRevert(
            leftOrder,
            leftOrderInfo.orderStatus,
            leftOrderInfo.orderHash,
            leftOrderInfo.orderFilledAmount,
            leftSignature,
            rightOrder.makerAddress,
            matchedFillResults.left.takerAssetFilledAmount);
        validateFillOrderContextOrRevert(
            rightOrder,
            rightOrderInfo.orderStatus,
            rightOrderInfo.orderHash,
            rightOrderInfo.orderFilledAmount,
            rightSignature,
            leftOrder.makerAddress,
            matchedFillResults.right.takerAssetFilledAmount);

        // Settle matched orders. Succeeds or throws.
        settleMatchedOrders(leftOrder, rightOrder, matchedFillResults, takerAddress);

        // Update exchange state
        updateFilledState(
            leftOrder,
            rightOrder.makerAddress,
            leftOrderInfo.orderHash,
            matchedFillResults.left
        );
        updateFilledState(
            rightOrder,
            leftOrder.makerAddress,
            rightOrderInfo.orderHash,
            matchedFillResults.right
        );

        // Return results
        return matchedFillResults;
    }
}
