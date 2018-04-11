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
import "./LibPartialAmount.sol";
import "../../utils/SafeMath/SafeMath.sol";

/// @dev Consumes MExchangeCore
contract MixinWrapperFunctions is
    MExchangeCore,
    SafeMath,
    LibPartialAmount
{
    /// @dev Fills the input order. Reverts if exact takerTokenFillAmount not filled.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    function fillOrKillOrder(
        Order memory order,
        uint256 takerTokenFillAmount,
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        fillResults = fillOrder(
            order,
            takerTokenFillAmount,
            signature
        );
        require(fillResults.takerTokenFilledAmount == takerTokenFillAmount);
        return fillResults;
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderNoThrow(
        Order memory order,
        uint256 takerTokenFillAmount,
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        // We need to call MExchangeCore.fillOrder using a delegatecall in
        // assembly so that we can intercept a call that throws. For this, we
        // need the input encoded in memory in the Ethereum ABIv2 format [1].
        
        // | Offset | Length  | Contents                     |
        // |--------|---------|------------------------------|
        // | 0      | 4       | function selector            |
        // | 4      | 11 * 32 | Order order                  |
        // | 356    | 32      | uint256 takerTokenFillAmount |
        // | 388    | 32      | offset to signature (416)    |
        // | 420    | 32      | len(signature)               |
        // | 452    | (1)     | signature                    |
        // | (2)    | (3)     | padding (zero)               |
        // | (4)    |         | end of input                 |
        
        // (1): len(signature)
        // (2): 452 + len(signature)
        // (3): (32 - len(signature)) mod 32
        // (4): 452 + len(signature) + (32 - len(signature)) mod 32
        
        // [1]: https://solidity.readthedocs.io/en/develop/abi-spec.html

        bytes4 fillOrderSelector = this.fillOrder.selector;

        assembly {
            // Load free memory pointer
            let start := mload(0x40)

            // Write function signature
            mstore(start, fillOrderSelector)

            // Write order struct
            mstore(add(start, 4), mload(order))             // makerAddress
            mstore(add(start, 36), mload(add(order, 32)))   // takerAddress
            mstore(add(start, 68), mload(add(order, 64)))   // makerTokenAddress
            mstore(add(start, 100), mload(add(order, 96)))  // takerTokenAddress
            mstore(add(start, 132), mload(add(order, 128))) // feeRecipientAddress
            mstore(add(start, 164), mload(add(order, 160))) // makerTokenAmount
            mstore(add(start, 196), mload(add(order, 192))) // takerTokenAmount
            mstore(add(start, 228), mload(add(order, 224))) // makerFeeAmount
            mstore(add(start, 260), mload(add(order, 256))) // takerFeeAmount
            mstore(add(start, 292), mload(add(order, 288))) // expirationTimeSeconds
            mstore(add(start, 324), mload(add(order, 320))) // salt

            // Write takerTokenFillAmount
            mstore(add(start, 356), takerTokenFillAmount)

            // Write signature offset
            mstore(add(start, 388), 416)

            // Write signature length
            let sigLen := mload(signature)
            mstore(add(start, 420), sigLen)

            // Calculate signature length with padding
            let paddingLen := mod(sub(0, sigLen), 32)
            let sigLenWithPadding := add(sigLen, paddingLen)

            // Write signature
            let sigStart := add(signature, 32)
            for { let curr := 0 } 
            lt(curr, sigLenWithPadding)
            { curr := add(curr, 32) }
            { mstore(add(start, add(452, curr)), mload(add(sigStart, curr))) } // Note: we assume that padding consists of only 0's

            // Execute delegatecall
            let success := delegatecall(
                gas,                         // forward all gas, TODO: look into gas consumption of assert/throw 
                address,                     // call address of this contract
                start,                       // pointer to start of input
                add(452, sigLenWithPadding), // input length is 420 + signature length + padding length
                start,                       // write output over input
                128                          // output size is 128 bytes
            )
            switch success
            case 0 {
                mstore(fillResults, 0)
                mstore(add(fillResults, 32), 0)
                mstore(add(fillResults, 64), 0)
                mstore(add(fillResults, 96), 0)
            }
            case 1 {
                mstore(fillResults, mload(start))
                mstore(add(fillResults, 32), mload(add(start, 32)))
                mstore(add(fillResults, 64), mload(add(start, 64)))
                mstore(add(fillResults, 96), mload(add(start, 96)))
            }

        }
        return fillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrders(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrder(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrKill.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrKillOrders(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrKillOrder(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrdersNoThrow(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrderNoThrow(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerToken is sold by taker.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrders(
        Order[] memory orders,
        uint256 takerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being sold by taker must be the same for each order
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            
            // Calculate the remaining amount of takerToken to sell
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, totalFillResults.takerTokenFilledAmount);
            
            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerToken has been sold
            if (totalFillResults.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerToken is sold by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrdersNoThrow(
        Order[] memory orders,
        uint256 takerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being sold by taker must be the same for each order
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);

            // Calculate the remaining amount of takerToken to sell
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, totalFillResults.takerTokenFilledAmount);
            
            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerToken has been sold
            if (totalFillResults.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of makerToken is bought by taker.
    /// @param orders Array of order specifications.
    /// @param makerTokenFillAmount Desired amount of makerToken to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrders(
        Order[] memory orders,
        uint256 makerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being bought by taker must be the same for each order
            require(orders[i].makerTokenAddress == orders[0].makerTokenAddress);

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(makerTokenFillAmount, totalFillResults.makerTokenFilledAmount);
            
            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingMakerTokenFillAmount
            );

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param makerTokenFillAmount Desired amount of makerToken to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrdersNoThrow(
        Order[] memory orders,
        uint256 makerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being bought by taker must be the same for each order
            require(orders[i].makerTokenAddress == orders[0].makerTokenAddress);

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(makerTokenFillAmount, totalFillResults.makerTokenFilledAmount);

            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingMakerTokenFillAmount
            );

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orders Array of order specifications.
    function batchCancelOrders(Order[] memory orders)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(orders[i]);
        }
    }

    /// @dev Adds properties of both FillResults instances.
    ///      Modifies the first FillResults instance specified.
    /// @param totalFillResults Fill results instance that will be added onto.
    /// @param singleFillResults Fill results instance that will be added to totalFillResults.
    function addFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        internal
        pure
    {
        totalFillResults.makerTokenFilledAmount = safeAdd(totalFillResults.makerTokenFilledAmount, singleFillResults.makerTokenFilledAmount);
        totalFillResults.takerTokenFilledAmount = safeAdd(totalFillResults.takerTokenFilledAmount, singleFillResults.takerTokenFilledAmount);
        totalFillResults.makerFeePaid = safeAdd(totalFillResults.makerFeePaid, singleFillResults.makerFeePaid);
        totalFillResults.takerFeePaid = safeAdd(totalFillResults.takerFeePaid, singleFillResults.takerFeePaid);
    }
    
}
