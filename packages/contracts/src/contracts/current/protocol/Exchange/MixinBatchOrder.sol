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
import "../../utils/SafeMath/SafeMath.sol";

contract MixinWrapperFunctions {
    
    using LibBalances for LibBalances.Balance[256];
    
    function batchedOrders(
        Order[] memory orders,
        bytes[] memory signatures,
        uint256[] fillAmounts,
        uint8[] balanceIndices)
        returns ()
    {
        Balance[256] balances;
        for(uint i = 0; i < balanceIndices.length; ++i) {
            require(balanceIndices[i] < balances.length);
        }
        
        // Update internal balances
        while() {
            Order memory order = order[oi];
            
            // TODO
            uint256 makerTokenFilledAmount;
            uint256 takerTokenFilledAmount;
            uint256 makerFeeAmountPaid;
            uint256 takerFeeAmountPaid;
            
            // Make sure none of the balance additions will overflow.
            // NOTE: We realy need only 2**256 / orders.length for this.
            //       (and half that for the ZRX token)
            require(makerTokenFilledAmount < 2**128);
            require(takerTokenFilledAmount < 2**128);
            require(makerFeePaid < 2**128);
            require(takerFeePaid < 2**128);
            
            // transfer(makerToken, maker, taker, makerTokenFilledAmount)
            // 0 -> 1
            balances.add(
                balanceIndices[bi + 0],
                order.makerToken,
                order.makerAddress,
                - makerTokenFilledAmount);
            balances.add(
                balanceIndices[bi + 1],
                order.makerToken,
                order.takerAddress,
                + makerTokenFilledAmount);
            
            // transfer(takerToken, taker, maker, takerTokenFilledAmount)
            // 2 -> 3
            balances.add(
                balanceIndices[bi + 2],
                order.takerToken,
                order.takerAddress,
                - takerTokenFilledAmount);
            balances.add(
                balanceIndices[bi + 3],
                order.takerToken,
                order.makerAddress,
                + takerTokenFilledAmount);
            
            // transfer(ZRX, maker, feeRecipient, makerFeeAmountPaid)
            // transfer(ZRX, taker, feeRecipient, takerFeeAmountPaid)
            // 4 -> 6 <- 5
            balances.add(
                balanceIndices[bi + 4],
                ZRX_TOKEN,
                order.makerAddress,
                - makerFeeAmountPaid);
            balances.add(
                balanceIndices[bi + 5],
                ZRX_TOKEN,
                order.makerAddress,
                - takerFeeAmountPaid);
            balances.add(
                balanceIndices[bi + 6],
                ZRX_TOKEN,
                order.takerAddress,
                makerFeeAmountPaid + takerFeeAmountPaid);
            
            bi += 7;
        }
        
        // Settle balances
        balances.settle(
            
        );
    }
    
    // Same as batchfill, but all orders are scaled according to the smallest
    // fillable amount.
    function proportionalFill() {
        
    }
    
    // Same as batchfill, but all orders are scaled according to the smallest
    // fillable amount.
    
    
    function matchedOrders(
        Order memory left,
        Order memory right,
        uint256 leftFillAmount,
        uint256 rightFillAmount,
        bytes leftSignature,
        bytes rightSignature)
        public
        returns (
            uint256 leftFilledAmount,
            uint256 rightFilledAmount)
    {
        // TODO: Instead of let and right fill amount, do we want to compute
        // max fillable amount?
        require(left.makerTokenAddress == right.takerTokenAmount);
        require(left.takerTokenAddress == right.makerTokenAmount);
        // Note: we do not check if there is actually a favorable position for
        // the taker.
        
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
        (   leftOrderHash,
            status,
            rightFilledAmount
        ) = orderStatus(left, leftSignature);
        if(status != uint8(Errors.SUCCESS)) {
            emit LogError(uint8(status), leftOrderHash);
            return 0;
        }
        
        // Compute max fill amount
        uint256 leftMakerTokenFilledAmount;
        uint256 leftMakerFeeAmountPaid;
        uint256 leftTakerFeeAmountPaid;
        (   status,
            leftMakerTokenFilledAmount,
            leftFilledAmount,
            leftMakerFeeAmountPaid,
            leftTakerFeeAmountPaid
        ) = getFillAmounts(
            order,
            filledAmount,
            takerTokenFillAmount,
            msg.sender);
        if(status != uint8(Errors.SUCCESS)) {
            emit LogError(uint8(status), orderHash);
            return 0;
        }
        
        // Compute max fill amount
        uint256 rightMakerTokenFilledAmount;
        uint256 rightMakerFeeAmountPaid;
        uint256 rightTakerFeeAmountPaid;
        (   status,
            rightMakerTokenFilledAmount,
            rightFilledAmount,
            rightMakerFeeAmountPaid,
            rightTakerFeeAmountPaid
        ) = getFillAmounts(
            order,
            filledAmount,
            takerTokenFillAmount,
            msg.sender);
        if(status != uint8(Errors.SUCCESS)) {
            emit LogError(uint8(status), orderHash);
            return 0;
        }
        
        transfer(
            order.makerTokenAddress,
            order.makerAddress,
            msg.sender,
            makerTokenFilledAmount);
        transfer(
            order.takerTokenAddress,
            msg.sender,
            order.makerAddress,
            takerTokenFilledAmount);
        transferFee(
            order.makerAddress,
            order.feeRecipientAddress,
            makerFeeAmountPaid);
        transferFee(
            msg.sender,
            order.feeRecipientAddress,
            takerFeeAmountPaid);
        
        address taker = msg.sender;
        
        // TODO: Optimize for left.makerToken == ZRX xor right.takerToken == ZRX
        // TODO: What if left, right and taker overlap with the feeRecipients?
        
        // left.makerToken == right.takerToken
        transfer(
            left.makerToken
            left.makerAddress,
            taker,
            leftMakerTokenFilledAmount);
        transfer(
            left.makerToken
            taker,
            right.makerAddress,
            rightTakerTokenFilledAmount);
        
        // right.makerToken == left.takerToken
        transfer(
            right.makerToken
            right.makerAddress,
            taker,
            rightMakerTokenFilledAmount);
        transfer(
            right.makerToken
            taker,
            left.makerAddress,
            leftTakerTokenFilledAmount);
        
        // Maker fees
        transferFee(
            left.makerAddress,
            left.feeRecipientAddress,
            leftMakerFeeAmountPaid);
        transferFee(
            right.makerAddress,
            right.feeRecipientAddress,
            rightMakerFeeAmountPaid);
        
        // If we assume distinct(left, right, taker) and 
        // distinct(makerToken, takerToken, zrx) then the only remaining
        // opportunity for optimization is when both feeRecipientAddress' are
        // the same.
        // TODO: What if left == left.feeRecipientAddress, left == right.feeRecipientAddress. etc.
        if(left.feeRecipientAddress == right.feeRecipientAddress) {
            transferFee(
                taker,
                left.feeRecipientAddress,
                safeAdd(
                    leftTakerFeeAmountPaid,
                    rightTakerFeeAmountPaid,
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
