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

import "./libs/LibFillResults.sol";
import "./libs/LibOrder.sol";
import "./libs/LibMath.sol";
import "./libs/LibStatus.sol";
import "./libs/LibExchangeErrors.sol";
import "./mixins/MExchangeCore.sol";
import "./mixins/MSettlement.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";

contract MixinExchangeCore is
    SafeMath,
    LibMath,
    LibStatus,
    LibOrder,
    LibFillResults,
    LibExchangeErrors,
    MExchangeCore,
    MSettlement,
    MSignatureValidator,
    MTransactions
{
    // Mapping of orderHash => amount of takerAsset already bought by maker
    mapping (bytes32 => uint256) public filled;

    // Mapping of orderHash => cancelled
    mapping (bytes32 => bool) public cancelled;

    // Mapping of makerAddress => lowest salt an order can have in order to be fillable
    // Orders with a salt less than their maker's epoch are considered cancelled
    mapping (address => uint256) public makerEpoch;

    ////// Core exchange functions //////

    /// @dev Cancels all orders reated by sender with a salt less than or equal to the specified salt value.
    /// @param salt Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 salt)
        external
    {
        uint256 newMakerEpoch = salt + 1;  // makerEpoch is initialized to 0, so to cancelUpTo we need salt + 1
        require(
            newMakerEpoch > makerEpoch[msg.sender],  // epoch must be monotonically increasing
            INVALID_NEW_MAKER_EPOCH
        );
        makerEpoch[msg.sender] = newMakerEpoch;
        emit CancelUpTo(msg.sender, newMakerEpoch);
    }

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        public
        returns (FillResults memory fillResults)
    {
        // Fetch order info
        OrderInfo memory orderInfo = getOrderInfo(order);

        // Fetch taker address
        address takerAddress = getCurrentContextAddress();

        // Either our context is valid or we revert
        assertValidFill(
            order,
            orderInfo.orderStatus,
            orderInfo.orderHash,
            takerAddress,
            orderInfo.orderTakerAssetFilledAmount,
            takerAssetFillAmount,
            signature
        );

        // Compute proportional fill amounts
        uint8 status;
        (status, fillResults) = calculateFillResults(
            order,
            orderInfo.orderStatus,
            orderInfo.orderTakerAssetFilledAmount,
            takerAssetFillAmount
        );
        if (status != uint8(Status.SUCCESS)) {
            emit ExchangeStatus(uint8(status), orderInfo.orderHash);
            return fillResults;
        }

        // Settle order
        settleOrder(order, takerAddress, fillResults);

        // Update exchange internal state
        updateFilledState(
            order,
            takerAddress,
            orderInfo.orderHash,
            orderInfo.orderTakerAssetFilledAmount,
            fillResults
        );
        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    ///      Throws if order is invalid or sender does not have permission to cancel.
    /// @param order Order to cancel. Order must be Status.FILLABLE.
    /// @return True if the order state changed to cancelled.
    ///         False if the order was valid, but in an
    ///               unfillable state (see LibStatus.STATUS for order states)
    function cancelOrder(Order memory order)
        public
        returns (bool)
    {
        // Fetch current order status
        OrderInfo memory orderInfo = getOrderInfo(order);

        // Validate context
        assertValidCancel(order, orderInfo.orderStatus, orderInfo.orderHash);

        // Perform cancel
        return updateCancelledState(order, orderInfo.orderStatus, orderInfo.orderHash);
    }

    /// @dev Gets information about an order: status, hash, and amount filled.
    /// @param order Order to gather information on.
    /// @return OrderInfo Information about the order and its state.
    ///                   See LibOrder.OrderInfo for a complete description.
    function getOrderInfo(Order memory order)
        public
        view
        returns (LibOrder.OrderInfo memory orderInfo)
    {
        // Compute the order hash
        orderInfo.orderHash = getOrderHash(order);

        // If order.makerAssetAmount is zero, we also reject the order.
        // While the Exchange contract handles them correctly, they create
        // edge cases in the supporting infrastructure because they have
        // an 'infinite' price when computed by a simple division.
        if (order.makerAssetAmount == 0) {
            orderInfo.orderStatus = uint8(Status.ORDER_INVALID_MAKER_ASSET_AMOUNT);
            return orderInfo;
        }

        // If order.takerAssetAmount is zero, then the order will always
        // be considered filled because 0 == takerAssetAmount == orderTakerAssetFilledAmount
        // Instead of distinguishing between unfilled and filled zero taker
        // amount orders, we choose not to support them.
        if (order.takerAssetAmount == 0) {
            orderInfo.orderStatus = uint8(Status.ORDER_INVALID_TAKER_ASSET_AMOUNT);
            return orderInfo;
        }

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            orderInfo.orderStatus = uint8(Status.ORDER_EXPIRED);
            return orderInfo;
        }

        // Check if order has been cancelled
        if (cancelled[orderInfo.orderHash]) {
            orderInfo.orderStatus = uint8(Status.ORDER_CANCELLED);
            return orderInfo;
        }
        if (makerEpoch[order.makerAddress] > order.salt) {
            orderInfo.orderStatus = uint8(Status.ORDER_CANCELLED);
            return orderInfo;
        }

        // Fetch filled amount and validate order availability
        orderInfo.orderTakerAssetFilledAmount = filled[orderInfo.orderHash];
        if (orderInfo.orderTakerAssetFilledAmount >= order.takerAssetAmount) {
            orderInfo.orderStatus = uint8(Status.ORDER_FULLY_FILLED);
            return orderInfo;
        }

        // All other statuses are ruled out: order is Fillable
        orderInfo.orderStatus = uint8(Status.ORDER_FILLABLE);
        return orderInfo;
    }

    /// @dev Calculates amounts filled and fees paid by maker and taker.
    /// @param order to be filled.
    /// @param orderStatus Status of order to be filled.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @return status Return status of calculating fill amounts. Returns Status.SUCCESS on success.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function calculateFillResults(
        Order memory order,
        uint8 orderStatus,
        uint256 orderTakerAssetFilledAmount,
        uint256 takerAssetFillAmount
    )
        public
        pure
        returns (
            uint8 status,
            FillResults memory fillResults
        )
    {
        // Fill amount must be greater than 0
        if (takerAssetFillAmount == 0) {
            status = uint8(Status.TAKER_ASSET_FILL_AMOUNT_TOO_LOW);
            return (status, fillResults);
        }

        // Ensure the order is fillable
        if (orderStatus != uint8(Status.ORDER_FILLABLE)) {
            status = orderStatus;
            return (status, fillResults);
        }

        // Compute takerAssetFilledAmount
        uint256 remainingTakerAssetAmount = safeSub(order.takerAssetAmount, orderTakerAssetFilledAmount);
        uint256 takerAssetFilledAmount = min256(takerAssetFillAmount, remainingTakerAssetAmount);

        // Validate fill order rounding
        if (isRoundingError(
            takerAssetFilledAmount,
            order.takerAssetAmount,
            order.makerAssetAmount))
        {
            status = uint8(Status.ROUNDING_ERROR_TOO_LARGE);
            return (status, fillResults);
        }

        // Compute proportional transfer amounts
        // TODO: All three are multiplied by the same fraction. This can
        // potentially be optimized.
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

        status = uint8(Status.SUCCESS);
        return (status, fillResults);
    }

    /// @dev Validates context for fillOrder. Succeeds or throws.
    /// @param order to be filled.
    /// @param orderStatus Status of order to be filled.
    /// @param orderHash Hash of order to be filled.
    /// @param takerAddress Address of order taker.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @param signature Proof that the orders was created by its maker.
    function assertValidFill(
        Order memory order,
        uint8 orderStatus,
        bytes32 orderHash,
        address takerAddress,
        uint256 orderTakerAssetFilledAmount,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
    {
        // Ensure order is valid
        // An order can only be filled if its status is FILLABLE;
        // however, only invalid statuses result in a throw.
        // See LibStatus for a complete description of order statuses.
        require(
            orderStatus != uint8(Status.ORDER_INVALID_MAKER_ASSET_AMOUNT),
            INVALID_ORDER_MAKER_ASSET_AMOUNT
        );
        require(
            orderStatus != uint8(Status.ORDER_INVALID_TAKER_ASSET_AMOUNT),
            INVALID_ORDER_TAKER_ASSET_AMOUNT
        );

        // Validate Maker signature (check only if first time seen)
        if (orderTakerAssetFilledAmount == 0) {
            require(
                isValidSignature(orderHash, order.makerAddress, signature),
                SIGNATURE_VALIDATION_FAILED
            );
        }

        // Validate sender is allowed to fill this order
        if (order.senderAddress != address(0)) {
            require(
                order.senderAddress == msg.sender,
                INVALID_SENDER
            );
        }

        // Validate taker is allowed to fill this order
        if (order.takerAddress != address(0)) {
            require(
                order.takerAddress == takerAddress,
                INVALID_CONTEXT
            );
        }
        require(
            takerAssetFillAmount > 0,
            GT_ZERO_AMOUNT_REQUIRED
        );
    }

    /// @dev Updates state with results of a fill order.
    /// @param order that was filled.
    /// @param takerAddress Address of taker who filled the order.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function updateFilledState(
        Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        FillResults memory fillResults
    )
        internal
    {
        // Update state
        filled[orderHash] = safeAdd(orderTakerAssetFilledAmount, fillResults.takerAssetFilledAmount);

        // Log order
        emit Fill(
            order.makerAddress,
            takerAddress,
            order.feeRecipientAddress,
            fillResults.makerAssetFilledAmount,
            fillResults.takerAssetFilledAmount,
            fillResults.makerFeePaid,
            fillResults.takerFeePaid,
            orderHash,
            order.makerAssetData,
            order.takerAssetData
        );
    }

    /// @dev Validates context for cancelOrder. Succeeds or throws.
    /// @param order that was cancelled.
    /// @param orderStatus Status of order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    function assertValidCancel(
        Order memory order,
        uint8 orderStatus,
        bytes32 orderHash
    )
        internal
    {
        // Ensure order is valid
        // An order can only be cancelled if its status is FILLABLE;
        // however, only invalid statuses result in a throw.
        // See LibStatus for a complete description of order statuses.
        require(
            orderStatus != uint8(Status.ORDER_INVALID_MAKER_ASSET_AMOUNT),
            INVALID_ORDER_MAKER_ASSET_AMOUNT
        );
        require(
            orderStatus != uint8(Status.ORDER_INVALID_TAKER_ASSET_AMOUNT),
            INVALID_ORDER_TAKER_ASSET_AMOUNT
        );

        // Validate transaction signed by maker
        address makerAddress = getCurrentContextAddress();
        require(
            order.makerAddress == makerAddress,
            INVALID_CONTEXT
        );

        // Validate sender is allowed to cancel this order
        if (order.senderAddress != address(0)) {
            require(
                order.senderAddress == msg.sender,
                INVALID_SENDER
            );
        }
    }

    /// @dev Updates state with results of cancelling an order.
    ///      State is only updated if the order is currently fillable.
    ///      Otherwise, updating state would have no effect.
    /// @param order that was cancelled.
    /// @param orderStatus Status of order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    /// @return stateUpdated Returns true only if state was updated.
    function updateCancelledState(
        Order memory order,
        uint8 orderStatus,
        bytes32 orderHash
    )
        internal
        returns (bool stateUpdated)
    {
        // Ensure order is fillable (otherwise cancelling does nothing)
        // See LibStatus for a complete description of order statuses.
        if (orderStatus != uint8(Status.ORDER_FILLABLE)) {
            emit ExchangeStatus(uint8(orderStatus), orderHash);
            stateUpdated = false;
            return stateUpdated;
        }

        // Perform cancel
        cancelled[orderHash] = true;
        stateUpdated = true;

        // Log cancel
        emit Cancel(
            order.makerAddress,
            order.feeRecipientAddress,
            orderHash,
            order.makerAssetData,
            order.takerAssetData
        );

        return stateUpdated;
    }
}
