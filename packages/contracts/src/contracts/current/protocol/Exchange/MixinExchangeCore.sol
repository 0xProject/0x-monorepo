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
import "./mixins/MSettlement.sol";
import "./mixins/MSignatureValidator.sol";
import "./LibOrder.sol";
import "./LibErrors.sol";
import "./LibPartialAmount.sol";
import "../../utils/SafeMath/SafeMath.sol";

/// @dev Provides MExchangeCore
/// @dev Consumes MSettlement
/// @dev Consumes MSignatureValidator
contract MixinExchangeCore is
    LibOrder,
    MExchangeCore,
    MSettlement,
    MSignatureValidator,
    SafeMath,
    LibErrors,
    LibPartialAmount
{
    // Mapping of orderHash => amount of takerAsset already bought by maker
    mapping (bytes32 => uint256) public filled;

    // Mapping of orderHash => cancelled
    mapping (bytes32 => bool) public cancelled;

    // Mapping of makerAddress => lowest salt an order can have in order to be fillable
    // Orders with a salt less than their maker's epoch are considered cancelled
    mapping (address => uint256) public makerEpoch;

    // Mapping of id => default order params
    mapping (uint256 => Order) public defaultOrderParams;

    // Mapping of default order params orderHash => default order params id
    mapping (bytes32 => uint256) public defaultOrderParamsIds;

    // Last default order params id set
    uint256 currentOrderParamsId = 0;

    event Fill(
        address indexed makerAddress,
        address takerAddress,
        address indexed feeRecipientAddress,
        uint256 makerAssetFilledAmount,
        uint256 takerAssetFilledAmount,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash,
        bytes makerAssetData,
        bytes takerAssetData
    );

    event Cancel(
        address indexed makerAddress,
        address indexed feeRecipientAddress,
        bytes32 indexed orderHash,
        bytes makerAssetData,
        bytes takerAssetData
    );

    event CancelUpTo(
        address indexed makerAddress,
        uint256 makerEpoch
    );

    event DefaultOrderParamsRegistered(
        bytes32 indexed orderHash,
        uint256 defaultOrderParamsId
    );

    /*
    * Core exchange functions
    */

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param defaultParamsId Id of the default order parameters to use.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        uint256 defaultParamsId,
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        // Overwrite null order params with defaults
        applyDefaultOrderParams(order, defaultParamsId);

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
            require(order.makerAssetAmount > 0);
            require(order.takerAssetAmount > 0);
            require(isValidSignature(orderHash, order.makerAddress, signature));
        }

        // Validate taker
        if (order.takerAddress != address(0)) {
            require(order.takerAddress == msg.sender);
        }
        require(takerAssetFillAmount > 0);

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
            settleOrder(order, msg.sender, fillResults.takerAssetFilledAmount);

        // Log order
        emitFillEvent(order, msg.sender, orderHash, fillResults);
        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    /// @param order Order struct containing order specifications.
    /// @param defaultParamsId Id of the default order parameters to use.
    /// @return True if the order state changed to cancelled.
    ///         False if the transaction was already cancelled or expired.
    function cancelOrder(Order memory order, uint256 defaultParamsId)
        public
        returns (bool)
    {
        // Overwrite null order params with defaults
        applyDefaultOrderParams(order, defaultParamsId);

        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Validate the order
        require(order.makerAssetAmount > 0);
        require(order.takerAssetAmount > 0);
        require(order.makerAddress == msg.sender);

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

    /// @dev Cancels orders created with a salt that is less than or equal to specified salt.
    /// @param salt Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 salt)
        external
    {
        uint256 newMakerEpoch = salt + 1;                // makerEpoch is initialized to 0, so to cancelUpTo we need salt+1
        require(newMakerEpoch > makerEpoch[msg.sender]); // epoch must be monotonically increasing
        makerEpoch[msg.sender] = newMakerEpoch;
        emit CancelUpTo(msg.sender, newMakerEpoch);
    }

    /// @dev Stores a set of default order parameters in contract state.
    ///      The parameters can be looked up by id. The id can be looked up by hash of the entire order struct.
    /// @param order Order struct containing order specifications.
    /// @return The id that the order parameters are registered to in the defaultOrderParams mapping.
    function registerDefaultOrderParams(Order memory order)
        public
        returns (uint256)
    {
        bytes32 orderHash = getOrderHash(order);

        // Order params must not already be registered
        require(defaultOrderParamsIds[orderHash] == 0);

        // Increment id
        currentOrderParamsId++;

        // Map order params to id
        defaultOrderParams[currentOrderParamsId] = order;

        // Map id to orderHash
        defaultOrderParamsIds[orderHash] = currentOrderParamsId;

        // Log registration
        emit DefaultOrderParamsRegistered(orderHash, currentOrderParamsId);
        return currentOrderParamsId;
    }

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public
        pure
        returns (bool isError)
    {
        uint256 remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) {
            return false; // No rounding error.
        }

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        isError = errPercentageTimes1000000 > 1000;
        return isError;
    }

    /// @dev Overwrites all 0 values of order if default paramters for the specified id exist.
    /// @param order Order struct containing order specifications.
    /// @param defaultParamsId Id of the default order parameters to use.
    function applyDefaultOrderParams(Order memory order, uint256 defaultParamsId)
        internal
        view
    {
        // Do nothing if id not specified
        if (defaultParamsId != 0) {

            // Load default order params
            Order storage orderParams = defaultOrderParams[defaultParamsId];

            // Overwrite null makerAddress
            if (order.makerAddress == address(0)) {
                order.makerAddress = orderParams.makerAddress;
            }

            // Overwrite null takerAddress
            if (order.takerAddress == address(0)) {
                order.takerAddress = orderParams.takerAddress;
            }

            // Overwrite null feeRecipientAddress
            if (order.feeRecipientAddress == address(0)) {
                order.feeRecipientAddress = orderParams.feeRecipientAddress;
            }

            // Overwrite 0 makerAssetAmount
            if (order.makerAssetAmount == 0) {
                order.makerAssetAmount = orderParams.makerAssetAmount;
            }

            // Overwrite 0 takerAssetAmount
            if (order.takerAssetAmount == 0) {
                order.takerAssetAmount = orderParams.takerAssetAmount;
            }

            // Overwrite 0 makerFeeAmount
            if (order.makerFee == 0) {
                order.makerFee = orderParams.makerFee;
            }

            // Overwrite 0 takerFeeAmount
            if (order.takerFee == 0) {
                order.takerFee = orderParams.takerFee;
            }

            // Overwrtie 0 expirationTimeSeconds
            if (order.expirationTimeSeconds == 0) {
                order.expirationTimeSeconds = orderParams.expirationTimeSeconds;
            }

            // Overwrite 0 salt
            if (order.salt == 0) {
                order.salt = orderParams.salt;
            }

            // TODO: Add makerAssetData and takerAssetData
        }
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
