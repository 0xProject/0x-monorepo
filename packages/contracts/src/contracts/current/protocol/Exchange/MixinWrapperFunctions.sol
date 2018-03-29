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
    /// @dev Fills the input order. Reverts if exact takerSellAmount not filled.
    /// @param order Order struct containing order specifications.
    /// @param takerSellAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    function fillOrKillOrder(
        Order memory order,
        uint256 takerSellAmount,
        bytes memory signature)
        public
    {
        require(
            fillOrder(
                order,
                takerSellAmount,
                signature
            ) == takerSellAmount
        );
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerSellAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        Order memory order,
        uint256 takerSellAmount,
        bytes memory signature)
        public
        returns (uint256 takerAmountSold)
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

            // Write takerSellAmount
            mstore(add(start, 356), takerSellAmount)

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
                32                           // output size is 32 bytes
            )
            switch success
            case 0 {
                takerAmountSold := 0
            }
            case 1 {
                takerAmountSold := mload(start)
            }

        }
        return takerAmountSold;
    }

    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction.
    /// @param orders Array of orders.
    /// @param takerSellAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrders(
        Order[] memory orders,
        uint256[] memory takerSellAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrder(
                orders[i],
                takerSellAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrKill in a single transaction.
    /// @param orders Array of orders.
    /// @param takerSellAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrKillOrders(
        Order[] memory orders,
        uint256[] memory takerSellAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrKillOrder(
                orders[i],
                takerSellAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orders Array of orders.
    /// @param takerSellAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrdersNoThrow(
        Order[] memory orders,
        uint256[] memory takerSellAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrderNoThrow(
                orders[i],
                takerSellAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is sold by taker.
    /// @param orders Array of orders.
    /// @param takerSellAmount Desired amount of takerToken to sell.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of tokens sold by taker in orders.
    function marketSellOrders(
        Order[] memory orders,
        uint256 takerSellAmount,
        bytes[] memory signatures)
        public
        returns (uint256 takerAmountSold)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerSellAmount = safeSub(takerSellAmount, takerAmountSold);
            takerAmountSold = safeAdd(
                takerAmountSold,
                fillOrder(
                    orders[i],
                    remainingTakerSellAmount,
                    signatures[i]
                )
            );
            if (takerAmountSold == takerSellAmount) {
                break;
            }
        }
        return takerAmountSold;
    }

    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction until total amount is sold by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of orders.
    /// @param takerSellAmount Desired amount of takerToken to sell.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of tokens sold by taker in orders.
    function marketSellOrdersNoThrow(
        Order[] memory orders,
        uint256 takerSellAmount,
        bytes[] memory signatures)
        public
        returns (uint256 takerAmountSold)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerSellAmount = safeSub(takerSellAmount, takerAmountSold);
            takerAmountSold = safeAdd(
                takerAmountSold,
                fillOrderNoThrow(
                    orders[i],
                    remainingTakerSellAmount,
                    signatures[i]
                )
            );
            if (takerAmountSold == takerSellAmount) {
                break;
            }
        }
        return takerAmountSold;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    /// @param orders Array of orders.
    /// @param takerBuyAmount Desired amount of makerToken to buy.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketBuyOrders(
        Order[] memory orders,
        uint256 takerBuyAmount,
        bytes[] memory signatures)
        public
        returns (uint256 takerAmountBought)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(takerBuyAmount, takerAmountBought);
            uint256 takerSellAmount = getPartialAmount(
                orders[i].makerBuyAmount,
                orders[i].makerSellAmount,
                remainingTakerBuyAmount
            );
            uint256 takerAmountSold = fillOrder(
                    orders[i],
                    takerSellAmount,
                    signatures[i]
            );
            takerAmountBought = safeAdd(
                takerAmountBought,
                getPartialAmount(
                    orders[i].makerSellAmount,
                    orders[i].makerBuyAmount,
                    takerAmountSold
                )
            );
            if (takerAmountBought == takerBuyAmount) {
                break;
            }
        }
        return takerAmountBought;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of orders.
    /// @param takerBuyAmount Desired amount of makerToken to fill.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketBuyOrdersNoThrow(
        Order[] memory orders,
        uint256 takerBuyAmount,
        bytes[] memory signatures)
        public
        returns (uint256 takerAmountBought)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(takerBuyAmount, takerAmountBought);
            uint256 takerSellAmount = getPartialAmount(
                orders[i].makerBuyAmount,
                orders[i].makerSellAmount,
                remainingTakerBuyAmount
            );
            uint256 takerAmountSold = fillOrderNoThrow(
                    orders[i],
                    takerSellAmount,
                    signatures[i]
            );
            takerAmountBought = safeAdd(
                takerAmountBought,
                getPartialAmount(
                    orders[i].makerSellAmount,
                    orders[i].makerBuyAmount,
                    takerAmountSold
                )
            );
            if (takerAmountBought == takerBuyAmount) {
                break;
            }
        }
        return takerAmountBought;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orders Array of orders.
    function batchCancelOrders(Order[] memory orders)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(orders[i]);
        }
    }
    
}
