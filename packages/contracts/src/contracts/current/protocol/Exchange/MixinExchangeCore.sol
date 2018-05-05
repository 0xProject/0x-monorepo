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

import "./lib/LibFillResults.sol";
import "./lib/LibOrder.sol";
import "./lib/LibMath.sol";
import "./lib/LibExchangeErrors.sol";
import "./mixins/MExchangeCore.sol";
import "./mixins/MSettlement.sol";
import "./mixins/MSignatureValidator.sol";
import "./mixins/MTransactions.sol";

contract MixinExchangeCore is
    LibOrder,
    LibFillResults,
    LibMath,
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
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Check if order has been cancelled by salt value
        if (order.salt < makerEpoch[order.makerAddress]) {
            emit ExchangeError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return fillResults;
        }

        // Check if order has been cancelled by orderHash
        if (cancelled[orderHash]) {
            emit ExchangeError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return fillResults;
        }

        // Validate order and maker only if first time seen
        // TODO: Read filled and cancelled only once
        if (filled[orderHash] == 0) {
            require(
                order.makerAssetAmount > 0,
                GREATER_THAN_ZERO_AMOUNT_REQUIRED
            );
            require(
                order.takerAssetAmount > 0,
                GREATER_THAN_ZERO_AMOUNT_REQUIRED
            );
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
        address takerAddress = getCurrentContextAddress();
        if (order.takerAddress != address(0)) {
            require(
                order.takerAddress == takerAddress,
                INVALID_CONTEXT
            );
        }
        require(
            takerAssetFillAmount > 0,
            GREATER_THAN_ZERO_AMOUNT_REQUIRED
        );

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            emit ExchangeError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return fillResults;
        }

        // Validate order availability
        uint256 remainingTakerAssetFillAmount = safeSub(order.takerAssetAmount, filled[orderHash]);
        if (remainingTakerAssetFillAmount == 0) {
            emit ExchangeError(uint8(Errors.ORDER_FULLY_FILLED), orderHash);
            return fillResults;
        }

        // Validate fill order rounding
        fillResults.takerAssetFilledAmount = min256(takerAssetFillAmount, remainingTakerAssetFillAmount);
        if (isRoundingError(fillResults.takerAssetFilledAmount, order.takerAssetAmount, order.makerAssetAmount)) {
            emit ExchangeError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), orderHash);
            fillResults.takerAssetFilledAmount = 0;
            return fillResults;
        }

        // Update state
        filled[orderHash] = safeAdd(filled[orderHash], fillResults.takerAssetFilledAmount);

        // Settle order
        (fillResults.makerAssetFilledAmount, fillResults.makerFeePaid, fillResults.takerFeePaid) =
            settleOrder(order, takerAddress, fillResults.takerAssetFilledAmount);

        // Log order
        emitFillEvent(order, takerAddress, orderHash, fillResults);
        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    /// @param order Order struct containing order specifications.
    /// @return True if the order state changed to cancelled.
    ///         False if the transaction was already cancelled or expired.
    function cancelOrder(Order memory order)
        public
        returns (bool)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Validate the order
        require(
            order.makerAssetAmount > 0,
            GREATER_THAN_ZERO_AMOUNT_REQUIRED
        );
        require(
            order.takerAssetAmount > 0,
            GREATER_THAN_ZERO_AMOUNT_REQUIRED
        );

        // Validate sender is allowed to cancel this order
        if (order.senderAddress != address(0)) {
            require(
                order.senderAddress == msg.sender,
                INVALID_SENDER
            );
        }
        
        // Validate transaction signed by maker
        address makerAddress = getCurrentContextAddress();
        require(
            order.makerAddress == makerAddress,
            INVALID_CONTEXT
        );
        
        if (block.timestamp >= order.expirationTimeSeconds) {
            emit ExchangeError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return false;
        }

        if (cancelled[orderHash]) {
            emit ExchangeError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return false;
        }

        cancelled[orderHash] = true;

        emit Cancel(
            order.makerAddress,
            order.feeRecipientAddress,
            orderHash,
            order.makerAssetData,
            order.takerAssetData
        );
        return true;
    }

    /// @dev Logs a Fill event with the given arguments.
    ///      The sole purpose of this function is to get around the stack variable limit.
    function emitFillEvent(
        Order memory order,
        address takerAddress,
        bytes32 orderHash,
        FillResults memory fillResults)
        internal
    {
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
}
