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
    // Mappings of orderHash => amounts of takerTokenAmount filled or cancelled.
    mapping (bytes32 => uint256) public filled;
    mapping (bytes32 => uint256) public cancelled;
    
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
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Total amount of takerToken filled in trade.
    function fillOrder(
          address[5] orderAddresses,
          uint256[6] orderValues,
          uint256 takerTokenFillAmount,
          uint8 v,
          bytes32 r,
          bytes32 s)
          public
          returns (uint256 takerTokenFilledAmount)
    {
        Order memory order = Order({
            maker: orderAddresses[0],
            taker: orderAddresses[1],
            makerToken: orderAddresses[2],
            takerToken: orderAddresses[3],
            feeRecipient: orderAddresses[4],
            makerTokenAmount: orderValues[0],
            takerTokenAmount: orderValues[1],
            makerFee: orderValues[2],
            takerFee: orderValues[3],
            expirationTimestampInSec: orderValues[4],
            orderHash: getOrderHash(orderAddresses, orderValues)
        });

        require(order.taker == address(0) || order.taker == msg.sender);
        require(order.makerTokenAmount > 0 && order.takerTokenAmount > 0 && takerTokenFillAmount > 0);
        require(isValidSignature(
            order.maker,
            order.orderHash,
            v,
            r,
            s
        ));

        if (block.timestamp >= order.expirationTimestampInSec) {
            LogError(uint8(Errors.ORDER_EXPIRED), order.orderHash);
            return 0;
        }

        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, getUnavailableTakerTokenAmount(order.orderHash));
        takerTokenFilledAmount = min256(takerTokenFillAmount, remainingTakerTokenAmount);
        if (takerTokenFilledAmount == 0) {
            LogError(uint8(Errors.ORDER_FULLY_FILLED_OR_CANCELLED), order.orderHash);
            return 0;
        }

        if (isRoundingError(takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount)) {
            LogError(uint8(Errors.ROUNDING_ERROR_TOO_LARGE), order.orderHash);
            return 0;
        }

        // Update state
        filled[order.orderHash] = safeAdd(filled[order.orderHash], takerTokenFilledAmount);
        
        // Settle order
        uint256 filledMakerTokenAmount;
        uint256 makerFeePaid;
        uint256 takerFeePaid;
        (filledMakerTokenAmount, makerFeePaid, takerFeePaid) =
            settleOrder(order, msg.sender, takerTokenFilledAmount);
        
        // Log order
        LogFill(
            order.maker,
            msg.sender,
            order.feeRecipient,
            order.makerToken,
            order.takerToken,
            filledMakerTokenAmount,
            takerTokenFilledAmount,
            makerFeePaid,
            takerFeePaid,
            order.orderHash
        );
        return takerTokenFilledAmount;
    }

    /// @dev Cancels the input order.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenCancelAmount Desired amount of takerToken to cancel in order.
    /// @return Amount of takerToken cancelled.
    function cancelOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenCancelAmount)
        public
        returns (uint256 takerTokenCancelledAmount)
    {
        Order memory order = Order({
            maker: orderAddresses[0],
            taker: orderAddresses[1],
            makerToken: orderAddresses[2],
            takerToken: orderAddresses[3],
            feeRecipient: orderAddresses[4],
            makerTokenAmount: orderValues[0],
            takerTokenAmount: orderValues[1],
            makerFee: orderValues[2],
            takerFee: orderValues[3],
            expirationTimestampInSec: orderValues[4],
            orderHash: getOrderHash(orderAddresses, orderValues)
        });

        require(order.maker == msg.sender);
        require(order.makerTokenAmount > 0 && order.takerTokenAmount > 0 && takerTokenCancelAmount > 0);

        if (block.timestamp >= order.expirationTimestampInSec) {
            LogError(uint8(Errors.ORDER_EXPIRED), order.orderHash);
            return 0;
        }

        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, getUnavailableTakerTokenAmount(order.orderHash));
        takerTokenCancelledAmount = min256(takerTokenCancelAmount, remainingTakerTokenAmount);
        if (takerTokenCancelledAmount == 0) {
            LogError(uint8(Errors.ORDER_FULLY_FILLED_OR_CANCELLED), order.orderHash);
            return 0;
        }

        cancelled[order.orderHash] = safeAdd(cancelled[order.orderHash], takerTokenCancelledAmount);

        LogCancel(
            order.maker,
            order.feeRecipient,
            order.makerToken,
            order.takerToken,
            getPartialAmount(takerTokenCancelledAmount, order.takerTokenAmount, order.makerTokenAmount),
            takerTokenCancelledAmount,
            order.orderHash
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

    /// @dev Calculates the sum of values already filled and cancelled for a given order.
    /// @param orderHash The Keccak-256 hash of the given order.
    /// @return Sum of values already filled and cancelled.
    function getUnavailableTakerTokenAmount(bytes32 orderHash)
        public view
        returns (uint256 unavailableTakerTokenAmount)
    {
        unavailableTakerTokenAmount = safeAdd(filled[orderHash], cancelled[orderHash]);
        return unavailableTakerTokenAmount;
    }
}
