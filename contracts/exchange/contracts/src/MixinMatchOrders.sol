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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/ReentrancyGuard.sol";
import "@0x/contracts-utils/contracts/src/RichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "./interfaces/IAssetProxyDispatcher.sol";
import "./MixinExchangeCore.sol";
import "./interfaces/IMatchOrders.sol";
import "./interfaces/ITransactions.sol";
import "./MixinExchangeRichErrors.sol";


contract MixinMatchOrders is
    MixinExchangeRichErrors,
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
        // Ensure that the left and right arrays are compatible and have nonzero lengths
        require(leftOrders.length > 0, "Invalid number of left orders");
        require(rightOrders.length > 0, "Invalid number of right orders");
        require(leftOrders.length == leftSignatures.length, "Incompatible leftOrders and leftSignatures");
        require(rightOrders.length == rightSignatures.length, "Incompatible rightOrders and rightSignatures");

        // Without simulating all of the order matching, this program cannot know how many
        // matches there will be. To ensure that batchMatchedFillResults has enough memory
        // allocated for the left and the right side, we will allocate enough space for the
        // maximum amount of matches (the maximum of the left and the right sides).
        uint256 maxLength = _max256(leftOrders.length, rightOrders.length);
        batchMatchedFillResults.left = new LibFillResults.FillResults[](maxLength);
        batchMatchedFillResults.right = new LibFillResults.FillResults[](maxLength);

        // Initialize initial variables
        uint256 matchCount;
        uint256 leftIdx = 0;
        uint256 rightIdx = 0;
        LibOrder.Order memory leftOrder = leftOrders[0];
        LibOrder.Order memory rightOrder = rightOrders[0];
        bytes memory leftSignature = leftSignatures[0];
        bytes memory rightSignature = rightSignatures[0];

        // Loop infinitely (until broken inside of the loop), but keep a counter of how
        // many orders have been matched.
        for (matchCount = 0;; matchCount++) {
            // Match the two orders that are pointed to by the left and right indices
            LibFillResults.MatchedFillResults memory matchResults = _matchOrders(
                leftOrder,
                rightOrder,
                leftSignature,
                rightSignature
            );

            // Add the matchResults and the profit made during the match to the
            // batchMatchedFillResults for this batch.
            batchMatchedFillResults.left[matchCount] = matchResults.left;
            batchMatchedFillResults.right[matchCount] = matchResults.right;
            batchMatchedFillResults.profitInLeftMakerAsset = _safeAdd(
                batchMatchedFillResults.profitInLeftMakerAsset,
                matchResults.leftMakerAssetSpreadAmount
            );
            // batchMatchedFillResults.profitInRightMakerAsset += 0; // Placeholder for ZEIP 40

            // If the leftOrder is filled, update the leftIdx, leftOrder, and leftSignature,
            // or break out of the loop if there are no more leftOrders to match.
            if (_isFilled(leftOrder, matchResults.left)) {
                if (++leftIdx == leftOrders.length) {
                    break;
                } else {
                    leftOrder = leftOrders[leftIdx];
                    leftSignature = leftSignatures[leftIdx];
                }
            }

            // If the rightOrder is filled, update the rightIdx, rightOrder, and rightSignature,
            // or break out of the loop if there are no more rightOrders to match.
            if (_isFilled(rightOrder, matchResults.right)) {
                if (++rightIdx == rightOrders.length) {
                    break;
                } else {
                    rightOrder = rightOrders[rightIdx];
                    rightSignature = rightSignatures[rightIdx];
                }
            }
        }

        // Update the lengths of the fill results for batchMatchResults
        assembly {
            mstore(mload(batchMatchedFillResults), matchCount)
            mstore(mload(add(batchMatchedFillResults, 32)), matchCount)
        }

        // Return the fill results from the batch match
        return batchMatchedFillResults;
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
        return _matchOrders(leftOrder, rightOrder, leftSignature, rightSignature);
    }

    /// @dev Calculates fill amounts for the matched orders.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the leftOrder order goes to the taker (who matched the two orders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftOrderTakerAssetFilledAmount Amount of left order already filled.
    /// @param rightOrderTakerAssetFilledAmount Amount of right order already filled.
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function calculateMatchedFillResults(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint256 leftOrderTakerAssetFilledAmount,
        uint256 rightOrderTakerAssetFilledAmount
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

        // Calculate fill results for maker and taker assets: at least one order will be fully filled.
        // The maximum amount the left maker can buy is `leftTakerAssetAmountRemaining`
        // The maximum amount the right maker can sell is `rightMakerAssetAmountRemaining`
        // We have two distinct cases for calculating the fill results:
        // Case 1.
        //   If the left maker can buy more than the right maker can sell, then only the right order is fully filled.
        //   If the left maker can buy exactly what the right maker can sell, then both orders are fully filled.
        // Case 2.
        //   If the left maker cannot buy more than the right maker can sell, then only the left order is fully filled.
        if (leftTakerAssetAmountRemaining >= rightMakerAssetAmountRemaining) {
            // Case 1: Right order is fully filled
            matchedFillResults.right.makerAssetFilledAmount = rightMakerAssetAmountRemaining;
            matchedFillResults.right.takerAssetFilledAmount = rightTakerAssetAmountRemaining;
            matchedFillResults.left.takerAssetFilledAmount = matchedFillResults.right.makerAssetFilledAmount;
            // Round down to ensure the maker's exchange rate does not exceed the price specified by the order.
            // We favor the maker when the exchange rate must be rounded.
            matchedFillResults.left.makerAssetFilledAmount = _safeGetPartialAmountFloor(
                leftOrder.makerAssetAmount,
                leftOrder.takerAssetAmount,
                matchedFillResults.left.takerAssetFilledAmount
            );
        } else {
            // Case 2: Left order is fully filled
            matchedFillResults.left.makerAssetFilledAmount = leftMakerAssetAmountRemaining;
            matchedFillResults.left.takerAssetFilledAmount = leftTakerAssetAmountRemaining;
            matchedFillResults.right.makerAssetFilledAmount = matchedFillResults.left.takerAssetFilledAmount;
            // Round up to ensure the maker's exchange rate does not exceed the price specified by the order.
            // We favor the maker when the exchange rate must be rounded.
            matchedFillResults.right.takerAssetFilledAmount = _safeGetPartialAmountCeil(
                rightOrder.takerAssetAmount,
                rightOrder.makerAssetAmount,
                matchedFillResults.right.makerAssetFilledAmount
            );
        }

        // Calculate amount given to taker
        matchedFillResults.leftMakerAssetSpreadAmount = _safeSub(
            matchedFillResults.left.makerAssetFilledAmount,
            matchedFillResults.right.takerAssetFilledAmount
        );

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

    _assertValidMatch(
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
            _rrevert(NegativeSpreadError(
                getOrderHash(leftOrder),
                getOrderHash(rightOrder)
            ));
        }
    }

    /// @dev Determines whether or not an order has been fully filled and returns the result.
    /// @param order The order that should be checked.
    /// @param fillResults The results of the most recent fill -- used to determine whether
    ///                    or not the order was fully filled.
    /// @return A boolean reflecting whether or not the order was fully filled
    function _isFilled(
        LibOrder.Order memory order,
        LibFillResults.FillResults memory fillResults
    )
        internal
        view
        returns (bool)
    {
        LibOrder.OrderInfo memory orderInfo = getOrderInfo(order);
        if (OrderStatus(orderInfo.orderStatus) == OrderStatus.FULLY_FILLED) {
            return true;
        }
        return false;
    }

    /// @dev Match two complementary orders that have a profitable spread.
    ///      Each order is filled at their respective price point. However, the calculations are
    ///      carried out as though the orders are both being filled at the right order's price point.
    ///      The profit made by the left order goes to the taker (who matched the two orders). This
    ///      function is needed to allow for reentrant order matching (used by batchMatchOrders).
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    /// @param leftSignature Proof that order was created by the left maker.
    /// @param rightSignature Proof that order was created by the right maker.
    /// @return matchedFillResults Amounts filled and fees paid by maker and taker of matched orders.
    function _matchOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory leftSignature,
        bytes memory rightSignature
    )
        private
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
        matchedFillResults = _calculateMatchedFillResults(
            leftOrder,
            rightOrder,
            leftOrderInfo.orderTakerAssetFilledAmount,
            rightOrderInfo.orderTakerAssetFilledAmount
        );

        // Validate fill contexts
        _assertValidFill(
            leftOrder,
            leftOrderInfo,
            matchedFillResults.left.takerAssetFilledAmount,
            matchedFillResults.left.takerAssetFilledAmount,
            matchedFillResults.left.makerAssetFilledAmount
        );
        _assertValidFill(
            rightOrder,
            rightOrderInfo,
            matchedFillResults.right.takerAssetFilledAmount,
            matchedFillResults.right.takerAssetFilledAmount,
            matchedFillResults.right.makerAssetFilledAmount
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
            matchedFillResults.leftMakerAssetSpreadAmount
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
