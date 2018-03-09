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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./mixins/MExchangeCore.sol";
import "../../utils/SafeMath/SafeMath.sol";

/// @dev Consumes MExchangeCore
contract MixinWrapperFunctions is
    MExchangeCore,
    SafeMath
{
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    function fillOrKillOrder(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
    {
        require(
            fillOrder(
                order,
                takerTokenFillAmount,
                signature
            ) == takerTokenFillAmount
        );
    }

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (uint256 takerTokenFilledAmount)
    {
        // bool success = address(this).delegatecall(
        //     this.fillOrder.selector,
        //     order,
        //     takerTokenFillAmount,
        //     signature
        // );
        // if (success) {
        //     assembly {
        //         returndatacopy(0, 0, 32)
        //         return (0, 32)
        //     }
        // }
        // return 0;

        // We need to call MExchangeCore.fillOrder using a delegatecall in
        // assembly so that we can intercept a call that throws. For this, we
        // need the input encoded in memory in the Ethereum ABIv2 format [1].
        //
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
        //
        // (1): len(signature)
        // (2): 452 + len(signature)
        // (3): 32 - (len(signature) mod 32)
        // (4): 452 + len(signature) + 32 - (len(signature) mod 32)
        //
        // [1]: https://solidity.readthedocs.io/en/develop/abi-spec.html
        
        bytes4 fillOrderSelector = this.fillOrder.selector;

        assembly {
            // Load free memory pointer
            let start := mload(0x40)

            // Write function signature
            mstore(start, fillOrderSelector)

            // Write order struct
            mstore(add(start, 4), order)             // makerAddress
            mstore(add(start, 36), add(order, 32))   // takerAddress
            mstore(add(start, 68), add(order, 64))   // makerTokenAddress
            mstore(add(start, 100), add(order, 96))  // takerTokenAddress
            mstore(add(start, 132), add(order, 128)) // feeRecipientAddress
            mstore(add(start, 164), add(order, 160)) // makerTokenAmount
            mstore(add(start, 196), add(order, 192)) // takerTokenAmount
            mstore(add(start, 228), add(order, 224)) // makerFeeAmount
            mstore(add(start, 260), add(order, 256)) // takerFeeAmount
            mstore(add(start, 292), add(order, 288)) // expirationTimeSeconds
            mstore(add(start, 324), add(order, 320)) // salt

            // Write takerTokenFillAmount
            mstore(add(start, 356), takerTokenFillAmount)

            // Write signature offset
            mstore(add(start, 388), 416)

            // Write signature length
            let sigLen := mload(signature)
            mstore(add(start, 420), sigLen)

            // Calculate signature length with padding
            let paddingLen := sub(32, mod(sigLen, 32))
            let sigLenWithPadding := add(sigLen, paddingLen)

            // Write signature
            let sigStart := add(signature, 32)
            for { let curr := 0 } 
            lt(curr, sigLenWithPadding)
            { curr := add(curr, 32) }
            { mstore(add(start, add(452, curr)), add(sigStart, curr)) }

            // Execute delegatecall
            let success := delegatecall(
                gas,                         // forward all gas 
                address,                     // call address of this contract
                start,                       // pointer to start of input
                add(452, sigLenWithPadding), // input length is 420 + signature length + padding length
                start,                       // write output over input
                32                           // output size is 32 bytes
            )
            switch success
            case 0 {
                takerTokenFilledAmount := 0
            }
            case 1 {
                takerTokenFilledAmount := mload(start)
            }

        }
        return takerTokenFilledAmount;
    }

    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction.
    /// @param orders Array of orders.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrders(
        Order[] orders,
        uint256[] takerTokenFillAmounts,
        bytes[] signatures)
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

    /// @dev Synchronously executes multiple calls of fillOrKill in a single transaction.
    /// @param orders Array of orders.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrKillOrders(
        Order[] orders,
        uint256[] takerTokenFillAmounts,
        bytes[] signatures)
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

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orders Array of orders.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrdersNoThrow(
        Order[] orders,
        uint256[] takerTokenFillAmounts,
        bytes[] signatures)
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

    /// @dev Synchronously executes multiple fill orders in a single transaction until total takerTokenFillAmount filled.
    /// @param orders Array of orders.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrders(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        public
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            totalTakerTokenFilledAmount = safeAdd(
                totalTakerTokenFilledAmount,
                fillOrder(
                    orders[i],
                    safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                    signatures[i]
                )
            );
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalTakerTokenFilledAmount;
    }

    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction until total takerTokenFillAmount filled.
    /// @param orders Array of orders.
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrdersNoThrow(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        public
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            totalTakerTokenFilledAmount = safeAdd(
                totalTakerTokenFilledAmount,
                fillOrderNoThrow(
                    orders[i],
                    safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                    signatures[i]
                )
            );
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalTakerTokenFilledAmount;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orders Array of orders.
    /// @param takerTokenCancelAmounts Array of desired amounts of takerToken to cancel in orders.
    function batchCancelOrders(
        Order[] orders,
        uint256[] takerTokenCancelAmounts)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(
                orders[i],
                takerTokenCancelAmounts[i]
            );
        }
    }
    
}
