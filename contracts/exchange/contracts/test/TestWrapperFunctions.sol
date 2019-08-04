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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../src/Exchange.sol";


/// @dev A version of the Exchange contract with`_fillOrder()`,
/// `_cancelOrder()`, and `getOrderInfo()` overridden to test
/// `MixinWrapperFunctions`.
contract TestWrapperFunctions is
    Exchange
{
    // solhint-disable no-unused-vars
    event FillOrderCalled(
        Order order,
        uint256 takerAssetFillAmount,
        bytes signature
    );

    event CancelOrderCalled(
        Order order
    );

    // solhint-disable no-empty-blocks
    constructor ()
        public
        Exchange(0x74657374)
    {}

    /// @dev Overridden to only log arguments and revert with certain inputs.
    function _fillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (FillResults memory fillResults)
    {
        emit FillOrderCalled(
            order,
            takerAssetFillAmount,
            signature
        );

        // Fail if the salt is uint256(-1).
        if (order.salt == uint256(-1)) {
            revert("FILL_ORDER_FAILED");
        }
    }

    /// @dev Overridden to only log arguments and revert with certain inputs.
    function _cancelOrder(
        Order memory order
    )
        internal
    {
        emit CancelOrderCalled(
            order
        );

        // Fail if the salt is uint256(-1).
        if (order.salt == uint256(-1)) {
            revert("CANCEL_ORDER_FAILED");
        }
    }

    /// @dev Overridden to be deterministic.
    function getOrderInfo(Order memory order)
        public
        view
        returns (OrderInfo memory orderInfo)
    {
        // Lower uint128 of `order.salt` is the `orderTakerAssetFilledAmount`.
        orderInfo.orderTakerAssetFilledAmount = uint128(order.salt);
        // High byte of `order.salt` is the `orderStatus`.
        orderInfo.orderTakerAssetFilledAmount = uint8(order.salt >> 248);
        // `orderHash` is just `keccak256(order.salt)`.
        orderInfo.orderHash = keccak256(abi.encode(order.salt));
    }
}
