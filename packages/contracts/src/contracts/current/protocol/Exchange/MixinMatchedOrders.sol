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
import "./LibErrors.sol";
import "./LibPartialAmount.sol";
import "../../utils/SafeMath/SafeMath.sol";

contract MixinMatchedOrders is
    SafeMath,
    LibErrors,
    LibOrder,
    LibPartialAmount,
    MExchangeCore,
    MSettlement
{
    // Match two complementary orders that overlap.
    // The taker will end up with the maximum amount of left.makerToken
    // Any right.makerToken that taker would gain because of rounding are
    // transfered to right.
    function matchedOrders(
        Order memory left,
        Order memory right,
        bytes leftSignature,
        bytes rightSignature)
        public
        returns (
            uint256 leftTakerTokenFilledAmount,
            uint256 rightTakerTokenFilledAmount)
    {
        require(left.makerTokenAddress == right.takerTokenAmount);
        require(left.takerTokenAddress == right.makerTokenAmount);
        address taker = msg.sender;
        
        // Make sure there is a positive spread
        // TODO: Explain
        // TODO: SafeMath
        require(
            left.makerTokenAmount * right.makerTokenAmount >=
            left.takerTokenAmount * right.takerTokenAmount);
        
        // Get left status
        uint8 status;
        bytes32 leftOrderHash;
        uint256 leftFilledAmount;
        (   leftOrderHash,
            status,
            leftFilledAmount
        ) = orderStatus(left, leftSignature);
        if(status != uint8(Errors.SUCCESS)) {
            emit LogError(uint8(status), leftOrderHash);
            return 0;
        }
        
        // Get right status
        bytes32 rightOrderHash;
        uint256 rightFilledAmount;
        (   rightOrderHash,
            status,
            rightFilledAmount
        ) = orderStatus(left, leftSignature);
        if(status != uint8(Errors.SUCCESS)) {
            emit LogError(uint8(status), rightOrderHash);
            return 0;
        }
        
        // The goal is for taker to obtain the maximum number of left maker
        // token.
        
        // The constraint can be either on the left or on the right. We need to
        // determine where it is.
        
        uint256 leftRemaining = safeSub(
            left.takerTokenAmount, leftFilledAmount);
        uint256 rightRemaining = safeSub(
            right.takerTokenAmount, rightFilledAmount);
        
        uint256 leftMakerTokenFilledAmount;
        uint256 leftMakerFeeAmountPaid;
        uint256 leftTakerFeeAmountPaid;
        uint256 rightMakerTokenFilledAmount;
        uint256 rightMakerFeeAmountPaid;
        uint256 rightTakerFeeAmountPaid;
        
        // TODO: SafeMath
        if(right.makerTokenAmount * rightRemaining <
            right.takerTokenAmount * leftRemaining)
        {
            // leftRemaining is the constraint: maximally fill left
            (   status,
                leftMakerTokenFilledAmount,
                leftTakerTokenFilledAmount,
                leftMakerFeeAmountPaid,
                leftTakerFeeAmountPaid
            ) = getFillAmounts(
                left,
                leftFilledAmount,
                leftRemaining,
                msg.sender);
            if(status != uint8(Errors.SUCCESS)) {
                emit LogError(uint8(status), leftOrderHash);
                return 0;
            }
            
            // Compute how much we should fill right to satisfy
            // leftTakerTokenFilledAmount
            // TODO: Check if rounding is in the correct direction.
            uint256 rightFill = getPartialAmount(
                right.makerTokenAmount,
                right.takerTokenAmount,
                leftMakerTokenFilledAmount);
            
            // Compute right fill amounts
            (   status,
                rightMakerTokenFilledAmount,
                rightTakerTokenFilledAmount,
                rightMakerFeeAmountPaid,
                rightTakerFeeAmountPaid
            ) = getFillAmounts(
                right,
                rightFilledAmount,
                rightFill,
                msg.sender);
            if(status != uint8(Errors.SUCCESS)) {
                emit LogError(uint8(status), rightOrderHash);
                return 0;
            }
            
            // Unfortunately, this is no longer exact and taker may end up
            // with some left.takerTokens. This will be a rounding error amount.
            // We should probably not bother and just give them to the makers.
            assert(rightMakerTokenFilledAmount >= leftTakerTokenFilledAmount);
            
            // TODO: Make sure the difference is neglible
            
        } else {
            // rightRemaining is the constraint: maximally fill right
            (   status,
                rightMakerTokenFilledAmount,
                rightTakerTokenFilledAmount,
                rightMakerFeeAmountPaid,
                rightTakerFeeAmountPaid
            ) = getFillAmounts(
                right,
                rightFilledAmount,
                rightRemaining,
                msg.sender);
            if(status != uint8(Errors.SUCCESS)) {
                emit LogError(uint8(status), rightOrderHash);
                return 0;
            }
            
            // We now have rightMakerTokens to fill left with
            assert(rightMakerTokenFilledAmount <= leftRemaining);
            
            // Fill left with all the right.makerToken we received
            (   status,
                leftMakerTokenFilledAmount,
                leftTakerTokenFilledAmount,
                leftMakerFeeAmountPaid,
                leftTakerFeeAmountPaid
            ) = getFillAmounts(
                left,
                leftFilledAmount,
                rightMakerTokenFilledAmount,
                msg.sender);
            if(status != uint8(Errors.SUCCESS)) {
                emit LogError(uint8(status), leftOrderHash);
                return 0;
            }
            
            // Taker should not have leftTakerTokens left, this case is exact
            assert(rightMakerTokenFilledAmount == leftTakerTokenFilledAmount);
        }
        
        // Update state
        updateState(
            left,
            leftOrderHash,
            leftMakerTokenFilledAmount,
            leftTakerTokenFilledAmount,
            leftMakerFeeAmountPaid,
            leftTakerFeeAmountPaid
        );
        updateState(
            right,
            rightOrderHash,
            rightMakerTokenFilledAmount,
            rightTakerTokenFilledAmount,
            rightMakerFeeAmountPaid,
            rightTakerFeeAmountPaid
        );
        
        // Optimized for:
        // * left.feeRecipient =?= right.feeRecipient
        
        // Not optimized for:
        // * {left, right}.{makerToken, takerToken} == ZRX
        // * {left, right}.maker, taker == {left, right}.feeRecipient
        
        // left.makerToken == right.takerToken
        // Taker should be left with a positive balance (the spread)
        transfer(
            left.makerToken,
            left.makerAddress,
            taker,
            leftMakerTokenFilledAmount);
        transfer(
            left.makerToken,
            taker,
            right.makerAddress,
            rightTakerTokenFilledAmount);
        
        // right.makerToken == left.takerToken
        // leftTakerTokenFilledAmount ~ rightMakerTokenFilledAmount
        // The difference (a rounding error) goes to right, not to taker.
        assert(rightMakerTokenFilledAmount >= leftTakerTokenFilledAmount);
        transfer(
            right.makerToken,
            right.makerAddress,
            left.makerAddress,
            rightMakerTokenFilledAmount);
        
        // Maker fees
        transferFee(
            left.makerAddress,
            left.feeRecipientAddress,
            leftMakerFeeAmountPaid);
        transferFee(
            right.makerAddress,
            right.feeRecipientAddress,
            rightMakerFeeAmountPaid);
        
        // Taker fees
        // If we assume distinct(left, right, taker) and 
        // distinct(makerToken, takerToken, zrx) then the only remaining
        // opportunity for optimization is when both feeRecipientAddress' are
        // the same.
        if(left.feeRecipientAddress == right.feeRecipientAddress) {
            transferFee(
                taker,
                left.feeRecipientAddress,
                safeAdd(
                    leftTakerFeeAmountPaid,
                    rightTakerFeeAmountPaid)
                );
        } else {
            transferFee(
                taker,
                left.feeRecipientAddress,
                leftTakerFeeAmountPaid);
            transferFee(
                taker,
                right.feeRecipientAddress,
                rightTakerFeeAmountPaid);
        }
    }
}
