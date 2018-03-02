/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.19;
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
    struct OrderState {
        uint256 unavailable; // filled + cancelled
        uint256 cancelled;
    }
    
    // Mapping from orderHash to order state.
    mapping (bytes32 => OrderState) public orderStates;
    
    event LogFill(
        address indexed maker,
        address taker,
        address indexed feeRecipient,
        address makerToken,
        address takerToken,
        uint256 makerTokenFilledAmount,
        uint256 takerTokenFilledAmount,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash
    );

    event LogCancel(
        address indexed maker,
        address indexed feeRecipient,
        address makerToken,
        address takerToken,
        uint256 makerTokenCancelledAmount,
        uint256 takerTokenCancelledAmount,
        bytes32 indexed orderHash
    );

    /*
    * Core exchange functions
    */

    /// @dev Fills the input order.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Proof of signing order by maker.
    /// @return Total amount of takerToken filled in trade.
    function fillOrder(
        Order order,
        uint takerTokenFillAmount,
        bytes signature)
        public
        returns (uint256 takerTokenFilledAmount)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);
        
        // Compute a pointer to the orderState
        OrderState storage orderState = orderStates[orderHash];
        uint256 unavailable = orderState.unavailable;
        
        // Validate order and maker only if first time seen
        // TODO: Read filled and cancelled only once
        if (unavailable == 0) {
            require(order.makerTokenAmount > 0);
            require(order.takerTokenAmount > 0);
            require(isValidSignature(orderHash, order.maker, signature));
        }
        
        // Validate taker
        if (order.taker != address(0)) {
            require(order.taker == msg.sender);
        }
        require(takerTokenFillAmount > 0);

        // Validate order expiration
        if (block.timestamp >= order.expirationTimestampInSec) {
            LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return 0;
        }
        
        // Validate order availability
        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, unavailable);
        takerTokenFilledAmount = min256(takerTokenFillAmount, remainingTakerTokenAmount);
        if (takerTokenFilledAmount == 0) {
            LogError(uint8(Errors.ORDER_FULLY_FILLED_OR_CANCELLED), orderHash);
            return 0;
        }
        
        // Validate fill order rounding
        if (isRoundingError(takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount)) {
            LogError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), orderHash);
            return 0;
        }

        // Update state
        orderState.unavailable = safeAdd(unavailable, takerTokenFilledAmount);
        
        // Settle order
        var (makerTokenFilledAmount, makerFeePaid, takerFeePaid) =
            settleOrder(order, msg.sender, takerTokenFilledAmount);
        
        // Log order
        LogFill(
            order.maker,
            msg.sender,
            order.feeRecipient,
            order.makerToken,
            order.takerToken,
            makerTokenFilledAmount,
            takerTokenFilledAmount,
            makerFeePaid,
            takerFeePaid,
            orderHash
        );
        return takerTokenFilledAmount;
    }

    /// @dev Cancels the input order.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenCancelAmount Desired amount of takerToken to cancel in order.
    /// @return Amount of takerToken cancelled.
    function cancelOrder(
        Order order,
        uint256 takerTokenCancelAmount)
        public
        returns (uint256 takerTokenCancelledAmount)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);
        
        // Compute a pointer to the orderState
        OrderState storage orderState = orderStates[orderHash];
        uint256 unavailable = orderState.unavailable;
        
        // Validate the order
        require(order.makerTokenAmount > 0);
        require(order.takerTokenAmount > 0);
        require(takerTokenCancelAmount > 0);
        require(order.maker == msg.sender);
        
        if (block.timestamp >= order.expirationTimestampInSec) {
            LogError(uint8(Errors.ORDER_EXPIRED), orderHash);
            return 0;
        }
        
        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, unavailable);
        takerTokenCancelledAmount = min256(takerTokenCancelAmount, remainingTakerTokenAmount);
        if (takerTokenCancelledAmount == 0) {
            LogError(uint8(Errors.ORDER_FULLY_FILLED_OR_CANCELLED), orderHash);
            return 0;
        }
        
        orderState.unavailable = safeAdd(unavailable, takerTokenCancelledAmount);
        orderState.cancelled = safeAdd(orderState.cancelled, takerTokenCancelledAmount);
        
        LogCancel(
            order.maker,
            order.feeRecipient,
            order.makerToken,
            order.takerToken,
            getPartialAmount(takerTokenCancelledAmount, order.takerTokenAmount, order.makerTokenAmount),
            takerTokenCancelledAmount,
            orderHash
        );
        return takerTokenCancelledAmount;
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
        if (remainder == 0) return false; // No rounding error.

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        isError = errPercentageTimes1000000 > 1000;
        return isError;
    }
}
