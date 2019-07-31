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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/ReentrancyGuard.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "./interfaces/IAssetProxyDispatcher.sol";
import "./interfaces/IExchangeRichErrors.sol";
import "./interfaces/IMatchOrders.sol";
import "./interfaces/ITransactions.sol";
import "./LibExchangeRichErrors.sol";
import "./MixinExchangeCore.sol";


contract MixinMatchOrders is
    MixinExchangeCore,
    IMatchOrders
{
    using LibBytes for bytes;

    /// @dev Match complementary orders that have a profitable spread.
    ///      Each order is filled at their respective price point, and
    ///      the matcher receives a profit denominated in the left maker asset.
    /// @param leftOrders Set of orders with the same maker / taker asset.
    /// @param rightOrders Set of orders to match against `leftOrders`
    /// @param leftSignatures Proof that left orders were created by the left makers.
    /// @param rightSignatures Proof that right orders were created by the right makers.
    /// @return batchMatchedFillResults Amounts filled and profit generated.
    function batchMatchOrders(
        LibOrder.Order[] memory leftOrders,
        LibOrder.Order[] memory rightOrders,
        bytes[] memory leftSignatures,
        bytes[] memory rightSignatures
    )
        public
        nonReentrant
        returns (LibFillResults.BatchMatchedFillResults memory batchMatchedFillResults)
    {
        return _batchMatchOrders(
            leftOrders,
            rightOrders,
            leftSignatures,
            rightSignatures,
            false
        );
    }

    /// @dev Match complementary orders that have a profitable spread.
    ///      Each order is maximally filled at their respective price point, and
    ///      the matcher receives a profit denominated in either the left maker asset,
    ///      right maker asset, or a combination of both.
    /// @param leftOrders Set of orders with the same maker / taker asset.
    /// @param rightOrders Set of orders to match against `leftOrders`
    /// @param leftSignatures Proof that left orders were created by the left makers.
    /// @param rightSignatures Proof that right orders were created by the right makers.
    /// @return batchMatchedFillResults Amounts filled and profit generated.
    function batchMatchOrdersWithMaximalFill(
        LibOrder.Order[] memory leftOrders,
        LibOrder.Order[] memory rightOrders,
        bytes[] memory leftSignatures,
        bytes[] memory rightSignatures
    )
        public
        nonReentrant
        returns (LibFillResults.BatchMatchedFillResults memory batchMatchedFillResults)
    {
        return _batchMatchOrders(
            leftOrders,
            rightOrders,
            leftSignatures,
            rightSignatures,
            true
        );
    }

    /// @dev Calculates fill amounts for the matched orders.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the leftOrder order goes to the taker (who matched the two orders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftOrderTakerAssetFilledAmount Amount of left order already filled.
    /// @param rightOrderTakerAssetFilledAmount Amount of right order already filled.
    /// @param shouldMaximallyFillOrders A value that indicates whether or not this calculation should use
    ///                                  the maximal fill order matching strategy.
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function calculateMatchedFillResults(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftOrderTakerAssetFilledAmount,
        uint256 rightOrderTakerAssetFilledAmount,
        bool shouldMaximallyFillOrders
    )
        public
        pure
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        // Derive maker asset amounts for left & right orders, given store taker assert amounts
        uint256 leftTakerAssetAmountRemaining = _safeSub(leftOrder.takerAssetAmount, leftOrderTakerAssetFilledAmount);
        uint256 leftMakerAssetAmountRemaining = _safeGetPartialAmountFloor(
            leftOrder.makerAssetAmount,
            leftOrder.takerAssetAmount,
            leftTakerAssetAmountRemaining
        );
        uint256 rightTakerAssetAmountRemaining = _safeSub(rightOrder.takerAssetAmount, rightOrderTakerAssetFilledAmount);
        uint256 rightMakerAssetAmountRemaining = _safeGetPartialAmountFloor(
            rightOrder.makerAssetAmount,
            rightOrder.takerAssetAmount,
            rightTakerAssetAmountRemaining
        );

        // Maximally fill the orders and pay out profits to the matcher in one or both of the maker assets.
        if (shouldMaximallyFillOrders) {
            _calculateMatchedFillResultsWithMaximalFill(
                matchedFillResults,
                leftOrder,
                rightOrder,
                leftMakerAssetAmountRemaining,
                leftTakerAssetAmountRemaining,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        } else {
            _calculateMatchedFillResults(
                matchedFillResults,
                leftOrder,
                rightOrder,
                leftMakerAssetAmountRemaining,
                leftTakerAssetAmountRemaining,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        }

        // Compute fees for left order
        matchedFillResults.left.makerFeePaid = _safeGetPartialAmountFloor(
            matchedFillResults.left.makerAssetFilledAmount,
            leftOrder.makerAssetAmount,
            leftOrder.makerFee
        );
        matchedFillResults.left.takerFeePaid = _safeGetPartialAmountFloor(
            matchedFillResults.left.takerAssetFilledAmount,
            leftOrder.takerAssetAmount,
            leftOrder.takerFee
        );

        // Compute fees for right order
        matchedFillResults.right.makerFeePaid = _safeGetPartialAmountFloor(
            matchedFillResults.right.makerAssetFilledAmount,
            rightOrder.makerAssetAmount,
            rightOrder.makerFee
        );
        matchedFillResults.right.takerFeePaid = _safeGetPartialAmountFloor(
            matchedFillResults.right.takerAssetFilledAmount,
            rightOrder.takerAssetAmount,
            rightOrder.takerFee
        );

        // Return fill results
        return matchedFillResults;
    }

    /// @dev Match two complementary orders that have a profitable spread.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the left order goes to the taker (who matched the two orders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftSignature Proof that order was created by the left maker.
    /// @param rightSignature Proof that order was created by the right maker.
    /// @return matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
    function matchOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory leftSignature,
        bytes memory rightSignature
    )
        public
        nonReentrant
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        return _matchOrders(
            leftOrder,
            rightOrder,
            leftSignature,
            rightSignature,
            false
        );
    }

    /// @dev Match two complementary orders that have a profitable spread.
    ///      Each order is maximally filled at their respective price point, and
    ///      the matcher receives a profit denominated in either the left maker asset,
    ///      right maker asset, or a combination of both.
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftSignature Proof that order was created by the left maker.
    /// @param rightSignature Proof that order was created by the right maker.
    /// @return matchedFillResults Amounts filled by maker and taker of matched orders.
    function matchOrdersWithMaximalFill(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory leftSignature,
        bytes memory rightSignature
    )
        public
        nonReentrant
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        return _matchOrders(
            leftOrder,
            rightOrder,
            leftSignature,
            rightSignature,
            true
        );
    }

    /// @dev Validates context for matchOrders. Succeeds or throws.
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    function _assertValidMatch(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    )
        internal
        view
    {
        // Make sure there is a profitable spread.
        // There is a profitable spread iff the cost per unit bought (OrderA.MakerAmount/OrderA.TakerAmount) for each order is greater
        // than the profit per unit sold of the matched order (OrderB.TakerAmount/OrderB.MakerAmount).
        // This is satisfied by the equations below:
        // <leftOrder.makerAssetAmount> / <leftOrder.takerAssetAmount> >= <rightOrder.takerAssetAmount> / <rightOrder.makerAssetAmount>
        // AND
        // <rightOrder.makerAssetAmount> / <rightOrder.takerAssetAmount> >= <leftOrder.takerAssetAmount> / <leftOrder.makerAssetAmount>
        // These equations can be combined to get the following:
        if (_safeMul(leftOrder.makerAssetAmount, rightOrder.makerAssetAmount) <
            _safeMul(leftOrder.takerAssetAmount, rightOrder.takerAssetAmount)) {
            LibRichErrors._rrevert(LibExchangeRichErrors.NegativeSpreadError(
                getOrderHash(leftOrder),
                getOrderHash(rightOrder)
            ));
        }
    }

    /// @dev Calculates part of the matched fill results for a given situation using the fill strategy that only
    ///      awards profit denominated in the left maker asset.
    /// @param matchedFillResults The MatchedFillResults struct to update with fill result calculations.
    /// @param leftOrder The left order in the order matching situation.
    /// @param rightOrder The right order in the order matching situation.
    /// @param leftMakerAssetAmountRemaining The amount of the left order maker asset that can still be filled.
    /// @param leftTakerAssetAmountRemaining The amount of the left order taker asset that can still be filled.
    /// @param rightMakerAssetAmountRemaining The amount of the right order maker asset that can still be filled.
    /// @param rightTakerAssetAmountRemaining The amount of the right order taker asset that can still be filled.
    function _calculateMatchedFillResults(
        MatchedFillResults memory matchedFillResults,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftMakerAssetAmountRemaining,
        uint256 leftTakerAssetAmountRemaining,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        internal
        pure
    {
        // Calculate fill results for maker and taker assets: at least one order will be fully filled.
        // The maximum amount the left maker can buy is `leftTakerAssetAmountRemaining`
        // The maximum amount the right maker can sell is `rightMakerAssetAmountRemaining`
        // We have two distinct cases for calculating the fill results:
        // Case 1.
        //   If the left maker can buy more than the right maker can sell, then only the right order is fully filled.
        //   If the left maker can buy exactly what the right maker can sell, then both orders are fully filled.
        // Case 2.
        //   If the left maker cannot buy more than the right maker can sell, then only the left order is fully filled.
        // Case 3.
        //   If the left maker can buy exactly as much as the right maker can sell, then both orders are fully filled.
        if (leftTakerAssetAmountRemaining > rightMakerAssetAmountRemaining) {
            // Case 1: Right order is fully filled
            _calculateCompleteRightFill(
                matchedFillResults,
                leftOrder,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        } else if (leftTakerAssetAmountRemaining < rightMakerAssetAmountRemaining) {
            // Case 2: Left order is fully filled
            matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
            matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
            matchedFillResults.right.makerAssetFilledAmount = leftTakerAssetAmountRemaining;
            // Round up to ensure the maker's exchange rate does not exceed the price specified by the order.
            // We favor the maker when the exchange rate must be rounded.
            matchedFillResults.right.takerAssetFilledAmount = _safeGetPartialAmountCeil(
                rightOrder.takerAssetAmount,
                rightOrder.makerAssetAmount,
                leftTakerAssetAmountRemaining // matchedFillResults.right.makerAssetFilledAmount
            );
        } else { // leftTakerAssetAmountRemaining == rightMakerAssetAmountRemaining
            // Case 3: Both orders are fully filled. Technically, this could be captured by the above cases, but
            //         this calculation will be more precise since it does not include rounding.
            _calculateCompleteFillBoth(
                matchedFillResults,
                leftMakerAssetAmountRemaining,
                leftTakerAssetAmountRemaining,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        }

        // Calculate amount given to taker
        matchedFillResults.profitInLeftMakerAsset = _safeSub(
            matchedFillResults.left.makerAssetFilledAmount,
            matchedFillResults.right.takerAssetFilledAmount
        );
    }

    /// @dev Calculates part of the matched fill results for a given situation using the maximal fill order matching
    ///      strategy.
    /// @param matchedFillResults The MatchedFillResults struct to update with fill result calculations.
    /// @param leftOrder The left order in the order matching situation.
    /// @param rightOrder The right order in the order matching situation.
    /// @param leftMakerAssetAmountRemaining The amount of the left order maker asset that can still be filled.
    /// @param leftTakerAssetAmountRemaining The amount of the left order taker asset that can still be filled.
    /// @param rightMakerAssetAmountRemaining The amount of the right order maker asset that can still be filled.
    /// @param rightTakerAssetAmountRemaining The amount of the right order taker asset that can still be filled.
    function _calculateMatchedFillResultsWithMaximalFill(
        MatchedFillResults memory matchedFillResults,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftMakerAssetAmountRemaining,
        uint256 leftTakerAssetAmountRemaining,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        internal
        pure
    {
        // If a maker asset is greater than the opposite taker asset, than there will be a spread denominated in that maker asset.
        bool doesLeftMakerAssetProfitExist = leftMakerAssetAmountRemaining > rightTakerAssetAmountRemaining;
        bool doesRightMakerAssetProfitExist = rightMakerAssetAmountRemaining > leftTakerAssetAmountRemaining;

        // Calculate the maximum fill results for the maker and taker assets. At least one of the orders will be fully filled.
        //
        // The maximum that the left maker can possibly buy is the amount that the right order can sell.
        // The maximum that the right maker can possibly buy is the amount that the left order can sell.
        //
        // If the left order is fully filled, profit will be paid out in the left maker asset. If the right order is fully filled,
        // the profit will be out in the right maker asset.
        //
        // There are three cases to consider:
        // Case 1.
        //   If the left maker can buy more than the right maker can sell, then only the right order is fully filled.
        // Case 2.
        //   If the right maker can buy more than the left maker can sell, then only the right order is fully filled.
        // Case 3.
        //   If the right maker can sell the max of what the left maker can buy and the left maker can sell the max of
        //   what the right maker can buy, then both orders are fully filled.
        if (leftTakerAssetAmountRemaining > rightMakerAssetAmountRemaining) {
            // Case 1: Right order is fully filled with the profit paid in the left makerAsset
            _calculateCompleteRightFill(
                matchedFillResults,
                leftOrder,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        } else if (rightTakerAssetAmountRemaining > leftMakerAssetAmountRemaining) {
            // Case 2: Left order is fully filled with the profit paid in the right makerAsset.
            matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
            matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
            // Round down to ensure the right maker's exchange rate does not exceed the price specified by the order.
            // We favor the right maker when the exchange rate must be rounded and the profit is being paid in the
            // right maker asset.
            matchedFillResults.right.makerAssetFilledAmount = _safeGetPartialAmountFloor(
                rightOrder.makerAssetAmount,
                rightOrder.takerAssetAmount,
                leftMakerAssetAmountRemaining
            );
            matchedFillResults.right.takerAssetFilledAmount = leftMakerAssetAmountRemaining;
        } else {
            // Case 3: The right and left orders are fully filled
            _calculateCompleteFillBoth(
                matchedFillResults,
                leftMakerAssetAmountRemaining,
                leftTakerAssetAmountRemaining,
                rightMakerAssetAmountRemaining,
                rightTakerAssetAmountRemaining
            );
        }

        // Calculate amount given to taker in the left order's maker asset if the left spread will be part of the profit.
        if (doesLeftMakerAssetProfitExist) {
            matchedFillResults.profitInLeftMakerAsset = _safeSub(
                matchedFillResults.left.makerAssetFilledAmount,
                matchedFillResults.right.takerAssetFilledAmount
            );
        }

        // Calculate amount given to taker in the right order's maker asset if the right spread will be part of the profit.
        if (doesRightMakerAssetProfitExist) {
            matchedFillResults.profitInRightMakerAsset = _safeSub(
                matchedFillResults.right.makerAssetFilledAmount,
                matchedFillResults.left.takerAssetFilledAmount
            );
        }
    }

    /// @dev Calculates the fill results for the maker and taker in the order matching and writes the results
    ///      to the fillResults that are being collected on the order. Both orders will be fully filled in this
    ///      case.
    /// @param matchedFillResults The fill results object to populate with calculations.
    /// @param leftMakerAssetAmountRemaining The amount of the left maker asset that is remaining to be filled.
    /// @param leftTakerAssetAmountRemaining The amount of the left taker asset that is remaining to be filled.
    /// @param rightMakerAssetAmountRemaining The amount of the right maker asset that is remaining to be filled.
    /// @param rightTakerAssetAmountRemaining The amount of the right taker asset that is remaining to be filled.
    function _calculateCompleteFillBoth(
        MatchedFillResults memory matchedFillResults,
        uint256 leftMakerAssetAmountRemaining,
        uint256 leftTakerAssetAmountRemaining,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        internal
        pure
    {
        // Calculate the fully filled results for both orders.
        matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
        matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
        matchedFillResults.right.makerAssetFilledAmount = rightMakerAssetAmountRemaining;
        matchedFillResults.right.takerAssetFilledAmount = rightTakerAssetAmountRemaining;
    }

    /// @dev Calculates the fill results for the maker and taker in the order matching and writes the results
    ///      to the fillResults that are being collected on the order.
    /// @param matchedFillResults The fill results object to populate with calculations.
    /// @param leftOrder The left order that is being maximally filled. All of the information about fill amounts
    ///                  can be derived from this order and the right asset remaining fields.
    /// @param rightMakerAssetAmountRemaining The amount of the right maker asset that is remaining to be filled.
    /// @param rightTakerAssetAmountRemaining The amount of the right taker asset that is remaining to be filled.
    function _calculateCompleteRightFill(
        MatchedFillResults memory matchedFillResults,
        LibOrder.Order memory leftOrder,
        uint256 rightMakerAssetAmountRemaining,
        uint256 rightTakerAssetAmountRemaining
    )
        internal
        pure
    {
        matchedFillResults.right.makerAssetFilledAmount = rightMakerAssetAmountRemaining;
        matchedFillResults.right.takerAssetFilledAmount = rightTakerAssetAmountRemaining;
        matchedFillResults.left.takerAssetFilledAmount = rightMakerAssetAmountRemaining;
        // Round down to ensure the left maker's exchange rate does not exceed the price specified by the order.
        // We favor the left maker when the exchange rate must be rounded and the profit is being paid in the
        // left maker asset.
        matchedFillResults.left.makerAssetFilledAmount = _safeGetPartialAmountFloor(
            leftOrder.makerAssetAmount,
            leftOrder.takerAssetAmount,
            rightMakerAssetAmountRemaining
        );
    }

    /// @dev Match complementary orders that have a profitable spread.
    ///      Each order is filled at their respective price point, and
    ///      the matcher receives a profit denominated in the left maker asset.
    ///      This is the reentrant version of `batchMatchOrders` and `batchMatchOrdersWithMaximalFill`.
    /// @param leftOrders Set of orders with the same maker / taker asset.
    /// @param rightOrders Set of orders to match against `leftOrders`
    /// @param leftSignatures Proof that left orders were created by the left makers.
    /// @param rightSignatures Proof that right orders were created by the right makers.
    /// @param shouldMaximallyFillOrders A value that indicates whether or not the order matching
    ///                        should be done with maximal fill.
    /// @return batchMatchedFillResults Amounts filled and profit generated.
    function _batchMatchOrders(
        LibOrder.Order[] memory leftOrders,
        LibOrder.Order[] memory rightOrders,
        bytes[] memory leftSignatures,
        bytes[] memory rightSignatures,
        bool shouldMaximallyFillOrders
    )
        internal
        returns (LibFillResults.BatchMatchedFillResults memory batchMatchedFillResults)
    {
        // Ensure that the left and right orders have nonzero lengths.
        if (leftOrders.length == 0) {
            LibRichErrors._rrevert(LibExchangeRichErrors.BatchMatchOrdersError(
                BatchMatchOrdersErrorCodes.ZERO_LEFT_ORDERS
            ));
        }
        if (rightOrders.length == 0) {
            LibRichErrors._rrevert(LibExchangeRichErrors.BatchMatchOrdersError(
                BatchMatchOrdersErrorCodes.ZERO_RIGHT_ORDERS
            ));
        }

        // Ensure that the left and right arrays are compatible.
        if (leftOrders.length != leftSignatures.length) {
            LibRichErrors._rrevert(LibExchangeRichErrors.BatchMatchOrdersError(
                BatchMatchOrdersErrorCodes.INVALID_LENGTH_LEFT_SIGNATURES
            ));
        }
        if (rightOrders.length != rightSignatures.length) {
            LibRichErrors._rrevert(LibExchangeRichErrors.BatchMatchOrdersError(
                BatchMatchOrdersErrorCodes.INVALID_LENGTH_RIGHT_SIGNATURES
            ));
        }

        batchMatchedFillResults.left = new LibFillResults.FillResults[](leftOrders.length);
        batchMatchedFillResults.right = new LibFillResults.FillResults[](rightOrders.length);

        // Set up initial indices.
        uint256 leftIdx = 0;
        uint256 rightIdx = 0;

        // Keep local variables for orders, order info, and signatures for efficiency.
        LibOrder.Order memory leftOrder = leftOrders[0];
        LibOrder.Order memory rightOrder = rightOrders[0];
        LibOrder.OrderInfo memory leftOrderInfo = getOrderInfo(leftOrder);
        LibOrder.OrderInfo memory rightOrderInfo = getOrderInfo(rightOrder);
        LibFillResults.FillResults memory leftFillResults;
        LibFillResults.FillResults memory rightFillResults;

        // Loop infinitely (until broken inside of the loop), but keep a counter of how
        // many orders have been matched.
        for (;;) {
            // Match the two orders that are pointed to by the left and right indices
            LibFillResults.MatchedFillResults memory matchResults = _matchOrders(
                leftOrder,
                rightOrder,
                leftSignatures[leftIdx],
                rightSignatures[rightIdx],
                shouldMaximallyFillOrders
            );

            // Update the orderInfo structs with the updated takerAssetFilledAmount
            leftOrderInfo.orderTakerAssetFilledAmount = _safeAdd(
                leftOrderInfo.orderTakerAssetFilledAmount,
                matchResults.left.takerAssetFilledAmount
            );
            rightOrderInfo.orderTakerAssetFilledAmount = _safeAdd(
                rightOrderInfo.orderTakerAssetFilledAmount,
                matchResults.right.takerAssetFilledAmount
            );

            // Aggregate the new fill results with the previous fill results for the current orders.
            _addFillResults(
                leftFillResults,
                matchResults.left
            );
            _addFillResults(
                rightFillResults,
                matchResults.right
            );

            // Update the profit in the left and right maker assets using the profits from
            // the match.
            batchMatchedFillResults.profitInLeftMakerAsset = _safeAdd(
                batchMatchedFillResults.profitInLeftMakerAsset,
                matchResults.profitInLeftMakerAsset
            );
            batchMatchedFillResults.profitInRightMakerAsset = _safeAdd(
                batchMatchedFillResults.profitInRightMakerAsset,
                matchResults.profitInRightMakerAsset
            );

            // If the leftOrder is filled, update the leftIdx, leftOrder, and leftSignature,
            // or break out of the loop if there are no more leftOrders to match.
            if (leftOrderInfo.orderTakerAssetFilledAmount >= leftOrder.takerAssetAmount) {
                // Update the batched fill results once the leftIdx is updated.
                batchMatchedFillResults.left[leftIdx++] = leftFillResults;
                // Clear the intermediate fill results value.
                leftFillResults = LibFillResults.FillResults(0, 0, 0, 0);

                // If all of the left orders have been filled, break out of the loop.
                // Otherwise, update the current right order.
                if (leftIdx == leftOrders.length) {
                    // Update the right batched fill results
                    batchMatchedFillResults.right[rightIdx] = rightFillResults;
                    break;
                } else {
                    leftOrder = leftOrders[leftIdx];
                    leftOrderInfo = getOrderInfo(leftOrder);
                }
            }

            // If the rightOrder is filled, update the rightIdx, rightOrder, and rightSignature,
            // or break out of the loop if there are no more rightOrders to match.
            if (rightOrderInfo.orderTakerAssetFilledAmount >= rightOrder.takerAssetAmount) {
                // Update the batched fill results once the rightIdx is updated.
                batchMatchedFillResults.right[rightIdx++] = rightFillResults;
                // Clear the intermediate fill results value.
                rightFillResults = LibFillResults.FillResults(0, 0, 0, 0);

                // If all of the right orders have been filled, break out of the loop.
                // Otherwise, update the current right order.
                if (rightIdx == rightOrders.length) {
                    // Update the left batched fill results
                    batchMatchedFillResults.left[leftIdx] = leftFillResults;
                    break;
                } else {
                    rightOrder = rightOrders[rightIdx];
                    rightOrderInfo = getOrderInfo(rightOrder);
                }
            }
        }

        // Return the fill results from the batch match
        return batchMatchedFillResults;
    }

    /// @dev Match two complementary orders that have a profitable spread.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the left order goes to the taker (who matched the two orders). This
    ///      function is needed to allow for reentrant order matching (used by `batchMatchOrders` and
    ///      `batchMatchOrdersWithMaximalFill`).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftSignature Proof that order was created by the left maker.
    /// @param rightSignature Proof that order was created by the right maker.
    /// @param shouldMaximallyFillOrders Indicates whether or not the maximal fill matching strategy should be used
    /// @return matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
    function _matchOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory leftSignature,
        bytes memory rightSignature,
        bool shouldMaximallyFillOrders
    )
        internal
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        // We assume that rightOrder.takerAssetData == leftOrder.makerAssetData and rightOrder.makerAssetData == leftOrder.takerAssetData
        // by pointing these values to the same location in memory. This is cheaper than checking equality.
        // If this assumption isn't true, the match will fail at signature validation.
        rightOrder.makerAssetData = leftOrder.takerAssetData;
        rightOrder.takerAssetData = leftOrder.makerAssetData;

        // Get left & right order info
        LibOrder.OrderInfo memory leftOrderInfo = getOrderInfo(leftOrder);
        LibOrder.OrderInfo memory rightOrderInfo = getOrderInfo(rightOrder);

        // Fetch taker address
        address takerAddress = _getCurrentContextAddress();

        // Either our context is valid or we revert
        _assertFillableOrder(
            leftOrder,
            leftOrderInfo,
            takerAddress,
            leftSignature
        );
        _assertFillableOrder(
            rightOrder,
            rightOrderInfo,
            takerAddress,
            rightSignature
        );
        _assertValidMatch(leftOrder, rightOrder);

        // Compute proportional fill amounts
        matchedFillResults = calculateMatchedFillResults(
            leftOrder,
            rightOrder,
            leftOrderInfo.orderTakerAssetFilledAmount,
            rightOrderInfo.orderTakerAssetFilledAmount,
            shouldMaximallyFillOrders
        );

        // Update exchange state
        _updateFilledState(
            leftOrder,
            takerAddress,
            leftOrderInfo.orderHash,
            leftOrderInfo.orderTakerAssetFilledAmount,
            matchedFillResults.left
        );
        _updateFilledState(
            rightOrder,
            takerAddress,
            rightOrderInfo.orderHash,
            rightOrderInfo.orderTakerAssetFilledAmount,
            matchedFillResults.right
        );

        // Settle matched orders. Succeeds or throws.
        _settleMatchedOrders(
            leftOrderInfo.orderHash,
            rightOrderInfo.orderHash,
            leftOrder,
            rightOrder,
            takerAddress,
            matchedFillResults
        );

        return matchedFillResults;
    }

    /// @dev Settles matched order by transferring appropriate funds between order makers, taker, and fee recipient.
    /// @param leftOrderHash First matched order hash.
    /// @param rightOrderHash Second matched order hash.
    /// @param leftOrder First matched order.
    /// @param rightOrder Second matched order.
    /// @param takerAddress Address that matched the orders. The taker receives the spread between orders as profit.
    /// @param matchedFillResults Struct holding amounts to transfer between makers, taker, and fee recipients.
    function _settleMatchedOrders(
        bytes32 leftOrderHash,
        bytes32 rightOrderHash,
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        address takerAddress,
        LibFillResults.MatchedFillResults memory matchedFillResults
    )
        private
    {
        address leftFeeRecipientAddress = leftOrder.feeRecipientAddress;
        address rightFeeRecipientAddress = rightOrder.feeRecipientAddress;

        // Right maker asset -> left maker
        _dispatchTransferFrom(
            rightOrderHash,
            rightOrder.makerAssetData,
            rightOrder.makerAddress,
            leftOrder.makerAddress,
            matchedFillResults.left.takerAssetFilledAmount
        );

        // Left maker asset -> right maker
        _dispatchTransferFrom(
            leftOrderHash,
            leftOrder.makerAssetData,
            leftOrder.makerAddress,
            rightOrder.makerAddress,
            matchedFillResults.right.takerAssetFilledAmount
        );

        // Right maker fee -> right fee recipient
        _dispatchTransferFrom(
            rightOrderHash,
            rightOrder.makerFeeAssetData,
            rightOrder.makerAddress,
            rightFeeRecipientAddress,
            matchedFillResults.right.makerFeePaid
        );

        // Left maker fee -> left fee recipient
        _dispatchTransferFrom(
            leftOrderHash,
            leftOrder.makerFeeAssetData,
            leftOrder.makerAddress,
            leftFeeRecipientAddress,
            matchedFillResults.left.makerFeePaid
        );

        // Settle taker profits.
        _dispatchTransferFrom(
            leftOrderHash,
            leftOrder.makerAssetData,
            leftOrder.makerAddress,
            takerAddress,
            matchedFillResults.profitInLeftMakerAsset
        );
        _dispatchTransferFrom(
            rightOrderHash,
            rightOrder.makerAssetData,
            rightOrder.makerAddress,
            takerAddress,
            matchedFillResults.profitInRightMakerAsset
        );

        // Settle taker fees.
        if (
            leftFeeRecipientAddress == rightFeeRecipientAddress &&
            leftOrder.takerFeeAssetData.equals(rightOrder.takerFeeAssetData)
        ) {
            // Fee recipients and taker fee assets are identical, so we can
            // transfer them in one go.
            _dispatchTransferFrom(
                leftOrderHash,
                leftOrder.takerFeeAssetData,
                takerAddress,
                leftFeeRecipientAddress,
                _safeAdd(
                    matchedFillResults.left.takerFeePaid,
                    matchedFillResults.right.takerFeePaid
                )
            );
        } else {
            // Right taker fee -> right fee recipient
            _dispatchTransferFrom(
                rightOrderHash,
                rightOrder.takerFeeAssetData,
                takerAddress,
                rightFeeRecipientAddress,
                matchedFillResults.right.takerFeePaid
            );

            // Left taker fee -> left fee recipient
            _dispatchTransferFrom(
                leftOrderHash,
                leftOrder.takerFeeAssetData,
                takerAddress,
                leftFeeRecipientAddress,
                matchedFillResults.left.takerFeePaid
            );
        }
    }
}
