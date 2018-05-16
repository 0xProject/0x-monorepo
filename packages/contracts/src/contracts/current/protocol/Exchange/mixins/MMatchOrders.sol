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
pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "../libs/LibOrder.sol";
import "../libs/LibFillResults.sol";
import "./MExchangeCore.sol";
import "../interfaces/IMatchOrders.sol";

contract MMatchOrders is
    IMatchOrders
{

    /// This struct exists solely to avoid the stack limit constraint
    /// in matchOrders
    struct OrderInfo {
        uint8 orderStatus;
        bytes32 orderHash;
        uint256 orderFilledAmount;
    }

    /// @dev Validates context for matchOrders. Succeeds or throws.
    /// @param leftOrder First order to match.
    /// @param rightOrder Second order to match.
    function assertValidMatch(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder
    )
        internal;

    /// @dev Validates matched fill results. Succeeds or throws.
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function assertValidMatch(LibFillResults.MatchedFillResults memory matchedFillResults)
        internal;

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
    /// @param matchedFillResults Amounts to fill and fees to pay by maker and taker of matched orders.
    function calculateMatchedFillResults(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        uint8 leftOrderStatus,
        uint8 rightOrderStatus,
        uint256 leftOrderFilledAmount,
        uint256 rightOrderFilledAmount
    )
        internal
        returns (LibFillResults.MatchedFillResults memory matchedFillResults);
}
