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

/// @dev Provides MExchangeQUote
/// @dev Consumes MSignatureValidator
contract MixinExchangeQuote is
    LibOrder,
    MExchangeCore,
    MSignatureValidator,
    SafeMath,
    LibErrors,
    LibPartialAmount
{

    // Mappings of orderHash => amounts of takerTokenAmount filled or cancelled.
    mapping (bytes32 => uint256) public filled;
    mapping (bytes32 => uint256) public cancelled;

    // Mapping of makerAddress => lowest salt an order can have in order to be fillable
    // Orders with a salt less than their maker's epoch are considered cancelled
    mapping (address => uint256) public makerEpoch;

    struct FillResults {
        uint256 makerAmountSold;
        uint256 takerAmountSold;
        uint256 makerFeePaid;
        uint256 takerFeePaid;
    }

    /// @dev Calculates the outcome of a fillOrder without performing any state changes
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Proof of signing order by maker.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderQuote(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);

        // Validate order and maker only if first time seen
        // TODO: Read filled and cancelled only once
        if (filled[orderHash] == 0 && cancelled[orderHash] == 0) {
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
            return fillResults;
        }

        // Validate order availability
        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, getUnavailableTakerTokenAmount(orderHash));
        fillResults.takerAmountSold = min256(takerTokenFillAmount, remainingTakerTokenAmount);
        if (fillResults.takerAmountSold == 0) {
            return fillResults;
        }

        // Validate fill order rounding
        if (isRoundingError(fillResults.takerAmountSold, order.takerTokenAmount, order.makerTokenAmount)) {
            return fillResults;
        }

        // Validate order is not cancelled
        if (order.salt < makerEpoch[order.makerAddress]) {
            return fillResults;
        }

        fillResults.makerAmountSold = getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFeeAmount > 0) {
                fillResults.makerFeePaid = getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerFeeAmount);
            }
            if (order.takerFeeAmount > 0) {
                fillResults.takerFeePaid = getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.takerFeeAmount);
            }
        }

        return fillResults;
    }
    function marketSellOrdersQuote(
        Order[] orders,
        uint256 takerSellAmount,
        bytes[] signatures)
        public
        returns (
            uint256 makerTokenFilledAmount,
            uint256 takerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        )
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerTokenFillAmount = safeSub(takerSellAmount, takerTokenFilledAmount);
            FillResults memory quoteFillResult = 
            fillOrderQuote(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]);

            makerTokenFilledAmount = safeAdd(makerTokenFilledAmount, quoteFillResult.makerAmountSold);
            takerTokenFilledAmount = safeAdd(takerTokenFilledAmount, quoteFillResult.takerAmountSold);
            makerFeeAmountPaid = safeAdd(makerFeeAmountPaid, quoteFillResult.makerFeePaid);
            takerFeeAmountPaid = safeAdd(takerFeeAmountPaid, quoteFillResult.takerFeePaid);

            if (takerTokenFilledAmount == takerSellAmount) {
                break;
            }
        }
        return (makerTokenFilledAmount, takerTokenFilledAmount, makerFeeAmountPaid, takerFeeAmountPaid);
    }


    function marketBuyOrdersQuote(
        Order[] orders,
        uint256 takerBuyAmount,
        bytes[] signatures)
        public
        returns (
            uint256 makerTokenFilledAmount,
            uint256 takerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        )
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(takerBuyAmount, takerTokenFilledAmount);
            uint256 remainingTakerSellAmount = getPartialAmount(
                remainingTakerBuyAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount
            );
            FillResults memory quoteFillResult = 
                fillOrderQuote(
                    orders[i],
                    remainingTakerSellAmount,
                    signatures[i]
                );

            makerTokenFilledAmount = safeAdd(makerTokenFilledAmount, quoteFillResult.makerAmountSold);
            takerTokenFilledAmount = safeAdd(takerTokenFilledAmount, quoteFillResult.takerAmountSold);
            makerFeeAmountPaid = safeAdd(makerFeeAmountPaid, quoteFillResult.makerFeePaid);
            takerFeeAmountPaid = safeAdd(takerFeeAmountPaid, quoteFillResult.takerFeePaid);
            if (takerTokenFilledAmount == takerBuyAmount) {
                break;
            }
        }
        return (makerTokenFilledAmount, takerTokenFilledAmount, makerFeeAmountPaid, takerFeeAmountPaid);
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
