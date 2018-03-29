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

    event LogFill(
        address indexed makerAddress,
        address takerAddress,
        address indexed feeRecipientAddress,
        address makerTokenAddress,
        address takerTokenAddress,
        uint256 makerAmountSold,
        uint256 makerAmountBought,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash
    );

    event LogCancel(
        address indexed makerAddress,
        address indexed feeRecipientAddress,
        address makerTokenAddress,
        address takerTokenAddress,
        bytes32 indexed orderHash
    );

    event LogCancelUpTo(
        address indexed makerAddress,
        uint256 makerEpoch
    );

    /*
    * Core exchange functions
    */

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerSellAmount Desired amount of takerToken to sell.
    /// @param signature Proof of signing order by maker.
    /// @return Total amount of takerToken filled in trade.
    function fillOrder(
        Order memory order,
        uint256 takerSellAmount,
        bytes memory signature)
        public
        returns (uint256 takerAmountSold)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Check if order has been cancelled
        if (cancelled[orderHash]) {
            LogError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return 0;
        }

        // Validate order and maker only if first time seen
        // TODO: Read filled and cancelled only once
        if (filled[orderHash] == 0) {
            require(isValidSignature(orderHash, order.makerAddress, signature));
        }

        // Validate taker
        if (order.takerAddress != address(0)) {
            require(order.takerAddress == msg.sender);
        }

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return 0;
        }

        // Validate order availability
        uint256 remainingMakerBuyAmount = safeSub(order.makerBuyAmount, filled[orderHash]);
        if (remainingMakerBuyAmount == 0) {
            LogError(uint8(Errors.ORDER_FULLY_FILLED), orderHash);
            return 0;
        }

        // Validate fill order rounding
        takerAmountSold = min256(takerSellAmount, remainingMakerBuyAmount);
        if (isRoundingError(takerAmountSold, order.makerBuyAmount, order.makerSellAmount)) {
            LogError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), orderHash);
            return 0;
        }

        // Validate order is not cancelled
        if (order.salt < makerEpoch[order.makerAddress]) {
            LogError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return 0;
        }

        // Update state
        filled[orderHash] = safeAdd(filled[orderHash], takerAmountSold);

        // Settle order
        var (makerAmountSold, makerFeePaid, takerFeePaid) =
            settleOrder(order, msg.sender, takerAmountSold);

        // Log order
        LogFill(
            order.makerAddress,
            msg.sender,
            order.feeRecipientAddress,
            order.makerTokenAddress,
            order.takerTokenAddress,
            makerAmountSold,
            takerAmountSold,
            makerFeePaid,
            takerFeePaid,
            orderHash
        );
        return takerAmountSold;
    }

    /// @dev After calling, the order can not be filled anymore.
    /// @param order Order struct containing order specifications.
    /// @return True if the order state changed to cancelled. False if the transaction was already cancelled or expired.
    function cancelOrder(Order memory order)
        public
        returns (bool)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Validate the order
        require(order.makerAddress == msg.sender);

        if (block.timestamp >= order.expirationTimeSeconds) {
            LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return false;
        }

        if (cancelled[orderHash]) {
            LogError(uint8(Errors.ORDER_CANCELLED), orderHash);
            return false;
        }

        cancelled[orderHash] = true;

        LogCancel(
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
        LogCancelUpTo(msg.sender, newMakerEpoch);
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
