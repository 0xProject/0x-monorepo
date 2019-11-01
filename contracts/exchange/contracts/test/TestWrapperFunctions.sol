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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "../src/Exchange.sol";


/// @dev A version of the Exchange contract with`_fillOrder()`,
/// `_cancelOrder()`, and `getOrderInfo()` overridden to test
/// `MixinWrapperFunctions`.
contract TestWrapperFunctions is
    Exchange
{
    uint8 internal constant MAX_ORDER_STATUS = uint8(LibOrder.OrderStatus.CANCELLED);
    uint256 internal constant ALWAYS_FAILING_SALT = uint256(-1);
    string internal constant ALWAYS_FAILING_SALT_REVERT_REASON = "ALWAYS_FAILING_SALT";

    // solhint-disable no-unused-vars
    event FillOrderCalled(
        LibOrder.Order order,
        uint256 takerAssetFillAmount,
        bytes signature
    );

    event CancelOrderCalled(
        LibOrder.Order order
    );

    // solhint-disable no-empty-blocks
    constructor ()
        public
        // Initialize the exchange with a fixed chainId ("test" in hex).
        Exchange(0x74657374)
    {}

    /// @dev Overridden to be deterministic and simplified.
    function getOrderInfo(LibOrder.Order memory order)
        public
        view
        returns (LibOrder.OrderInfo memory orderInfo)
    {
        // Lower uint128 of `order.salt` is the `orderTakerAssetFilledAmount`.
        orderInfo.orderTakerAssetFilledAmount = uint128(order.salt);
        // High byte of `order.salt` is the `orderStatus`.
        orderInfo.orderStatus = uint8(order.salt >> 248) % (MAX_ORDER_STATUS + 1);
        orderInfo.orderHash = order.getTypedDataHash(EIP712_EXCHANGE_DOMAIN_HASH);
    }

    function fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        public
        returns (LibFillResults.FillResults memory fillResults)
    {
        return _fillOrderNoThrow(
            order,
            takerAssetFillAmount,
            signature
        );
    }

    /// @dev Overridden to log arguments, be deterministic, and revert with certain inputs.
    function _fillOrder(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        emit FillOrderCalled(
            order,
            takerAssetFillAmount,
            signature
        );

        // Fail if the salt is ALWAYS_FAILING_SALT.
        if (order.salt == ALWAYS_FAILING_SALT) {
            revert(ALWAYS_FAILING_SALT_REVERT_REASON);
        }

        // We aren't interested in correctness here because we are testing the
        // behavior of the caller, not `_fillOrder()` itself. We just need some
        // values that the caller can aggregate together.
        fillResults.makerAssetFilledAmount = order.makerAssetAmount;
        fillResults.takerAssetFilledAmount = order.takerAssetAmount;
        fillResults.makerFeePaid = order.makerFee;
        fillResults.takerFeePaid = order.takerFee;
        fillResults.protocolFeePaid = protocolFeeMultiplier;
    }

    /// @dev Overridden to only log arguments and revert with certain inputs.
    function _cancelOrder(
        LibOrder.Order memory order
    )
        internal
    {
        emit CancelOrderCalled(
            order
        );

        // Fail if the salt is ALWAYS_FAILING_SALT.
        if (order.salt == ALWAYS_FAILING_SALT) {
            revert(ALWAYS_FAILING_SALT_REVERT_REASON);
        }
    }
}
