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

import "../../utils/ReentrancyGuard/ReentrancyGuard.sol";
import "./libs/LibConstants.sol";
import "./libs/LibFillResults.sol";
import "./libs/LibOrder.sol";
import "./libs/LibMath.sol";
import "./mixins/MExchangeCore.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";
import "./mixins/MAssetProxyDispatcher.sol";


contract MixinExchangeCore is
    ReentrancyGuard,
    LibConstants,
    LibMath,
    LibOrder,
    LibFillResults,
    MAssetProxyDispatcher,
    MExchangeCore,
    MSignatureValidator,
    MTransactions
{
    // Mapping of orderHash => amount of takerAsset already bought by maker
    mapping (bytes32 => uint256) public filled;

    // Mapping of orderHash => cancelled
    mapping (bytes32 => bool) public cancelled;

    // Mapping of makerAddress => senderAddress => lowest salt an order can have in order to be fillable
    // Orders with specified senderAddress and with a salt less than their epoch are considered cancelled
    mapping (address => mapping (address => uint256)) public orderEpoch;

    /// @dev Cancels all orders created by makerAddress with a salt less than or equal to the targetOrderEpoch
    ///      and senderAddress equal to msg.sender (or null address if msg.sender == makerAddress).
    /// @param targetOrderEpoch Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 targetOrderEpoch)
        external
        nonReentrant
    {
        address makerAddress = getCurrentContextAddress();
        // If this function is called via `executeTransaction`, we only update the orderEpoch for the makerAddress/msg.sender combination.
        // This allows external filter contracts to add rules to how orders are cancelled via this function.
        address senderAddress = makerAddress == msg.sender ? address(0) : msg.sender;

        // orderEpoch is initialized to 0, so to cancelUpTo we need salt + 1
        uint256 newOrderEpoch = targetOrderEpoch + 1;  
        uint256 oldOrderEpoch = orderEpoch[makerAddress][senderAddress];

        // Ensure orderEpoch is monotonically increasing
        require(
            newOrderEpoch > oldOrderEpoch, 
            "INVALID_NEW_ORDER_EPOCH"
        );

        // Update orderEpoch
        orderEpoch[makerAddress][senderAddress] = newOrderEpoch;
        emit CancelUpTo(
            makerAddress,
            senderAddress,
            newOrderEpoch
        );
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
        nonReentrant
        returns (FillResults memory fillResults)
    {
        fillResults = fillOrderInternal(
            order,
            takerAssetFillAmount,
            signature
        );
        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    ///      Throws if order is invalid or sender does not have permission to cancel.
    /// @param order Order to cancel. Order must be OrderStatus.FILLABLE.
    function cancelOrder(Order memory order)
        public
        nonReentrant
    {
        cancelOrderInternal(order);
    }

    /// @dev Gets information about an order: status, hash, and amount filled.
    /// @param order Order to gather information on.
    /// @return OrderInfo Information about the order and its state.
    ///         See LibOrder.OrderInfo for a complete description.
    function getOrderInfo(Order memory order)
        public
        view
        returns (OrderInfo memory orderInfo)
    {
        // Compute the order hash
        orderInfo.orderHash = getOrderHash(order);

        // Fetch filled amount
        orderInfo.orderTakerAssetFilledAmount = filled[orderInfo.orderHash];

        // If order.makerAssetAmount is zero, we also reject the order.
        // While the Exchange contract handles them correctly, they create
        // edge cases in the supporting infrastructure because they have
        // an 'infinite' price when computed by a simple division.
        if (order.makerAssetAmount == 0) {
            orderInfo.orderStatus = uint8(OrderStatus.INVALID_MAKER_ASSET_AMOUNT);
            return orderInfo;
        }

        // If order.takerAssetAmount is zero, then the order will always
        // be considered filled because 0 == takerAssetAmount == orderTakerAssetFilledAmount
        // Instead of distinguishing between unfilled and filled zero taker
        // amount orders, we choose not to support them.
        if (order.takerAssetAmount == 0) {
            orderInfo.orderStatus = uint8(OrderStatus.INVALID_TAKER_ASSET_AMOUNT);
            return orderInfo;
        }

        // Validate order availability
        if (orderInfo.orderTakerAssetFilledAmount >= order.takerAssetAmount) {
            orderInfo.orderStatus = uint8(OrderStatus.FULLY_FILLED);
            return orderInfo;
        }

        // Validate order expiration
        // solhint-disable-next-line not-rely-on-time
        if (block.timestamp >= order.expirationTimeSeconds) {
            orderInfo.orderStatus = uint8(OrderStatus.EXPIRED);
            return orderInfo;
        }

        // Check if order has been cancelled
        if (cancelled[orderInfo.orderHash]) {
            orderInfo.orderStatus = uint8(OrderStatus.CANCELLED);
            return orderInfo;
        }
        if (orderEpoch[order.makerAddress][order.senderAddress] > order.salt) {
            orderInfo.orderStatus = uint8(OrderStatus.CANCELLED);
            return orderInfo;
        }

        // All other statuses are ruled out: order is Fillable
        orderInfo.orderStatus = uint8(OrderStatus.FILLABLE);
        return orderInfo;
    }

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderInternal(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (FillResults memory fillResults)
    {
        // Fetch order info
        OrderInfo memory orderInfo = getOrderInfo(order);

        // Fetch taker address
        address takerAddress = getCurrentContextAddress();
        
        // Assert that the order is fillable by taker
        assertFillableOrder(
            order,
            orderInfo,
            takerAddress,
            signature
        );
        
        // Get amount of takerAsset to fill
        uint256 remainingTakerAssetAmount = safeSub(order.takerAssetAmount, orderInfo.orderTakerAssetFilledAmount);
        uint256 takerAssetFilledAmount = min256(takerAssetFillAmount, remainingTakerAssetAmount);

        // Validate context
        assertValidFill(
            order,
            orderInfo,
            takerAssetFillAmount,
            takerAssetFilledAmount,
            fillResults.makerAssetFilledAmount
        );

        // Compute proportional fill amounts
        fillResults = calculateFillResults(order, takerAssetFilledAmount);

        // Update exchange internal state
        updateFilledState(
            order,
            takerAddress,
            orderInfo.orderHash,
            orderInfo.orderTakerAssetFilledAmount,
            fillResults
        );
    
        // Settle order
        settleOrder(
            order,
            takerAddress,
            fillResults
        );

        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    ///      Throws if order is invalid or sender does not have permission to cancel.
    /// @param order Order to cancel. Order must be OrderStatus.FILLABLE.
    function cancelOrderInternal(Order memory order)
        internal
    {
        // Fetch current order status
        OrderInfo memory orderInfo = getOrderInfo(order);

        // Validate context
        assertValidCancel(order, orderInfo);

        // Perform cancel
        updateCancelledState(order, orderInfo.orderHash);
    }

    /// @dev Updates state with results of a fill order.
    /// @param order that was filled.
    /// @param takerAddress Address of taker who filled the order.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
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
            order.feeRecipientAddress,
            takerAddress,
            msg.sender,
            fillResults.makerAssetFilledAmount,
            fillResults.takerAssetFilledAmount,
            fillResults.makerFeePaid,
            fillResults.takerFeePaid,
            orderHash,
            order.makerAssetData,
            order.takerAssetData
        );
    }

    /// @dev Updates state with results of cancelling an order.
    ///      State is only updated if the order is currently fillable.
    ///      Otherwise, updating state would have no effect.
    /// @param order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    function updateCancelledState(
        Order memory order,
        bytes32 orderHash
    )
        internal
    {
        // Perform cancel
        cancelled[orderHash] = true;

        // Log cancel
        emit Cancel(
            order.makerAddress,
            order.feeRecipientAddress,
            msg.sender,
            orderHash,
            order.makerAssetData,
            order.takerAssetData
        );
    }
    
    /// @dev Validates context for fillOrder. Succeeds or throws.
    /// @param order to be filled.
    /// @param orderInfo OrderStatus, orderHash, and amount already filled of order.
    /// @param takerAddress Address of order taker.
    /// @param signature Proof that the orders was created by its maker.
    function assertFillableOrder(
        Order memory order,
        OrderInfo memory orderInfo,
        address takerAddress,
        bytes memory signature
    )
        internal
        view
    {
        // An order can only be filled if its status is FILLABLE.
        require(
            orderInfo.orderStatus == uint8(OrderStatus.FILLABLE),
            "ORDER_UNFILLABLE"
        );
        
        // Validate sender is allowed to fill this order
        if (order.senderAddress != address(0)) {
            require(
                order.senderAddress == msg.sender,
                "INVALID_SENDER"
            );
        }
        
        // Validate taker is allowed to fill this order
        if (order.takerAddress != address(0)) {
            require(
                order.takerAddress == takerAddress,
                "INVALID_TAKER"
            );
        }
        
        // Validate Maker signature (check only if first time seen)
        if (orderInfo.orderTakerAssetFilledAmount == 0) {
            require(
                isValidSignature(
                    orderInfo.orderHash,
                    order.makerAddress,
                    signature
                ),
                "INVALID_ORDER_SIGNATURE"
            );
        }
    }
    
    /// @dev Validates context for fillOrder. Succeeds or throws.
    /// @param order to be filled.
    /// @param orderInfo OrderStatus, orderHash, and amount already filled of order.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @param takerAssetFilledAmount Amount of takerAsset that will be filled.
    /// @param makerAssetFilledAmount Amount of makerAsset that will be transfered.
    function assertValidFill(
        Order memory order,
        OrderInfo memory orderInfo,
        uint256 takerAssetFillAmount,  // TODO: use FillResults
        uint256 takerAssetFilledAmount,
        uint256 makerAssetFilledAmount
    )
        internal
        view
    {
        // Revert if fill amount is invalid
        // TODO: reconsider necessity for v2.1
        require(
            takerAssetFillAmount != 0,
            "INVALID_TAKER_AMOUNT"
        );
        
        // Make sure taker does not pay more than desired amount
        // NOTE: This assertion should never fail, it is here
        //       as an extra defence against potential bugs.
        require(
            takerAssetFilledAmount <= takerAssetFillAmount,
            "TAKER_OVERPAY"
        );
        
        // Make sure order is not overfilled
        // NOTE: This assertion should never fail, it is here
        //       as an extra defence against potential bugs.
        require(
            safeAdd(orderInfo.orderTakerAssetFilledAmount, takerAssetFilledAmount) <= order.takerAssetAmount,
            "ORDER_OVERFILL"
        );
        
        // Make sure order is filled at acceptable price.
        // The order has an implied price from the makers perspective:
        //    order price = order.makerAssetAmount / order.takerAssetAmount
        // i.e. the number of makerAsset maker is paying per takerAsset. The
        // maker is guaranteed to get this price or a better (lower) one. The
        // actual price maker is getting in this fill is:
        //    fill price = makerAssetFilledAmount / takerAssetFilledAmount
        // We need `fill price <= order price` for the fill to be fair to maker.
        // This amounts to:
        //     makerAssetFilledAmount        order.makerAssetAmount
        //    ------------------------  <=  -----------------------
        //     takerAssetFilledAmount        order.takerAssetAmount
        // or, equivalently:
        //     makerAssetFilledAmount * order.takerAssetAmount <=
        //     order.makerAssetAmount * takerAssetFilledAmount
        // NOTE: This assertion should never fail, it is here
        //       as an extra defence against potential bugs.
        require(
            safeMul(makerAssetFilledAmount, order.takerAssetAmount)
            <= 
            safeMul(order.makerAssetAmount, takerAssetFilledAmount),
            "INVALID_FILL_PRICE"
        );
    }

    /// @dev Validates context for cancelOrder. Succeeds or throws.
    /// @param order to be cancelled.
    /// @param orderInfo OrderStatus, orderHash, and amount already filled of order.
    function assertValidCancel(
        Order memory order,
        OrderInfo memory orderInfo
    )
        internal
        view
    {
        // Ensure order is valid
        // An order can only be cancelled if its status is FILLABLE.
        require(
            orderInfo.orderStatus == uint8(OrderStatus.FILLABLE),
            "ORDER_UNFILLABLE"
        );

        // Validate sender is allowed to cancel this order
        if (order.senderAddress != address(0)) {
            require(
                order.senderAddress == msg.sender,
                "INVALID_SENDER"
            );
        }

        // Validate transaction signed by maker
        address makerAddress = getCurrentContextAddress();
        require(
            order.makerAddress == makerAddress,
            "INVALID_MAKER"
        );
    }

    /// @dev Calculates amounts filled and fees paid by maker and taker.
    /// @param order to be filled.
    /// @param takerAssetFilledAmount Amount of takerAsset that will be filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function calculateFillResults(
        Order memory order,
        uint256 takerAssetFilledAmount
    )
        internal
        pure
        returns (FillResults memory fillResults)
    {
        // Compute proportional transfer amounts
        fillResults.takerAssetFilledAmount = takerAssetFilledAmount;
        fillResults.makerAssetFilledAmount = safeGetPartialAmountFloor(
            takerAssetFilledAmount,
            order.takerAssetAmount,
            order.makerAssetAmount
        );
        fillResults.makerFeePaid = safeGetPartialAmountFloor(
            fillResults.makerAssetFilledAmount,
            order.makerAssetAmount,
            order.makerFee
        );
        fillResults.takerFeePaid = safeGetPartialAmountFloor(
            takerAssetFilledAmount,
            order.takerAssetAmount,
            order.takerFee
        );

        return fillResults;
    }

    /// @dev Settles an order by transferring assets between counterparties.
    /// @param order Order struct containing order specifications.
    /// @param takerAddress Address selling takerAsset and buying makerAsset.
    /// @param fillResults Amounts to be filled and fees paid by maker and taker.
    function settleOrder(
        LibOrder.Order memory order,
        address takerAddress,
        LibFillResults.FillResults memory fillResults
    )
        private
    {
        bytes memory zrxAssetData = ZRX_ASSET_DATA;
        dispatchTransferFrom(
            order.makerAssetData,
            order.makerAddress,
            takerAddress,
            fillResults.makerAssetFilledAmount
        );
        dispatchTransferFrom(
            order.takerAssetData,
            takerAddress,
            order.makerAddress,
            fillResults.takerAssetFilledAmount
        );
        dispatchTransferFrom(
            zrxAssetData,
            order.makerAddress,
            order.feeRecipientAddress,
            fillResults.makerFeePaid
        );
        dispatchTransferFrom(
            zrxAssetData,
            takerAddress,
            order.feeRecipientAddress,
            fillResults.takerFeePaid
        );
    }
}
