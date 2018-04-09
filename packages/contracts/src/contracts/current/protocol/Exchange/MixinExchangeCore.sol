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
    // Mapping of orderHash => amount of takerToken already bought by maker
    mapping (bytes32 => uint256) public filled;

    // Mapping of orderHash => cancelled
    mapping (bytes32 => bool) public cancelled;

    // Mapping of makerAddress => lowest salt an order can have in order to be fillable
    // Orders with a salt less than their maker's epoch are considered cancelled
    mapping (address => uint256) public makerEpoch;

    event Fill(
        address indexed makerAddress,
        address takerAddress,
        address indexed feeRecipientAddress,
        address makerTokenAddress,
        address takerTokenAddress,
        uint256 makerTokenFilledAmount,
        uint256 takerTokenFilledAmount,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash
    );

    event Cancel(
        address indexed makerAddress,
        address indexed feeRecipientAddress,
        address makerTokenAddress,
        address takerTokenAddress,
        bytes32 indexed orderHash
    );

    event CancelUpTo(
        address indexed makerAddress,
        uint256 makerEpoch
    );

    /*
    * Core exchange functions
    */

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrder(
        Order memory order,
        uint256 takerTokenFillAmount,
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
            require(order.makerTokenAmount > 0);
            require(order.takerTokenAmount > 0);
            require(isValidSignature(orderHash, order.makerAddress, signature));
        }

        // Validate taker
        if (order.takerAddress != address(0)) {
            require(order.takerAddress == msg.sender);
        }
        require(takerTokenFillAmount > 0);

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            emit ExchangeError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return fillResults;
        }

        // Validate order availability
        uint256 remainingTakerTokenFillAmount = safeSub(order.takerTokenAmount, filled[orderHash]);
        if (remainingTakerTokenFillAmount == 0) {
            emit ExchangeError(uint8(Errors.ORDER_FULLY_FILLED), orderHash);
            return fillResults;
        }

        // Validate fill order rounding
        fillResults.takerTokenFilledAmount = min256(takerTokenFillAmount, remainingTakerTokenFillAmount);
        if (isRoundingError(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount)) {
            emit ExchangeError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), orderHash);
            fillResults.takerTokenFilledAmount = 0;
            return fillResults;
        }

        // Update state
        filled[orderHash] = safeAdd(filled[orderHash], fillResults.takerTokenFilledAmount);

        // Settle order
        (fillResults.makerTokenFilledAmount, fillResults.makerFeePaid, fillResults.takerFeePaid) =
            settleOrder(order, msg.sender, fillResults.takerTokenFilledAmount);

        // Log order
        emit Fill(
            order.makerAddress,
            msg.sender,
            order.feeRecipientAddress,
            order.makerTokenAddress,
            order.takerTokenAddress,
            fillResults.makerTokenFilledAmount,
            fillResults.takerTokenFilledAmount,
            fillResults.makerFeePaid,
            fillResults.takerFeePaid,
            orderHash
        );
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
        require(order.makerTokenAmount > 0);
        require(order.takerTokenAmount > 0);
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
            order.makerTokenAddress,
            order.takerTokenAddress,
            orderHash
        );
        return true;
    }

    /// @param salt Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 salt)
        external
    {
        uint256 newMakerEpoch = salt + 1;                // makerEpoch is initialized to 0, so to cancelUpTo we need salt+1
        require(newMakerEpoch > makerEpoch[msg.sender]); // epoch must be monotonically increasing
        makerEpoch[msg.sender] = newMakerEpoch;
        emit CancelUpTo(msg.sender, newMakerEpoch);
    }

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public pure
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
}
