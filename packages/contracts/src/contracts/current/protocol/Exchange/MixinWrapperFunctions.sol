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
        uint takerTokenFillAmount,
        bytes signature)
        public
    {
        require(fillOrder(
            order,
            takerTokenFillAmount,
            signature
        ) == takerTokenFillAmount);
    }

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (uint256 takerTokenFilledAmount)
    {
        // We need to call MExchangeCore.fillOrder using a delegatecall in
        // assembly so that we can intercept a call that throws. For this, we
        // need the input encoded in memory in the Ethereum ABIv2 format [1].
        //
        // | Offset | Length  | Contents                     |
        // |--------|---------|------------------------------|
        // | 0      | 4       | function selector            |
        // | 4      | 12 * 32 | Order order                  |
        // | 388    | 32      | uint256 takerTokenFillAmount |
        // | 420    | 32      | offset to signature (448)    |
        // | 452    | 32      | len(signature)               |
        // | 486    | (1)     | signature                    |
        // | (2)    | (3)     | padding (zero)               |
        // | (4)    |         | end of input                 |
        //
        // (1): len(signature)
        // (2): 486 + len(signature)
        // (3): 32 - (len(signature) mod 32)
        // (4): 486 + len(signature) + 32 - (len(signature) mod 32)
        //
        // [1]: https://solidity.readthedocs.io/en/develop/abi-spec.html
        
        // Allocate memory for input
        uint256 signatureLength = signature.length;
        uint256 paddingLength = 32 - (signatureLength % 32);
        uint256 inputSize = 486 + signatureLength + paddingLength;
        bytes memory input = new bytes(inputSize);
        
        // The in memory layout of `bytes memory input` starts with
        // `uint256 length`, the content of the byte array starts at
        // offset 32 from the pointer. We need assembly to access the
        // raw pointer value of `input`.
        // TODO: I can not find an official source for this.
        uint256 start;
        assembly {
            start := add(input, 32)
        }
        
        // Write function signature
        // We use assembly to write four bytes at a time (actually 32,
        // but we are only overwriting uninitialized data). A `bytes4`
        // is stored by value as 256-bit and right-padded with zeros.
        bytes4 FILL_ORDER_FUNCTION_SIGNATURE = this.fillOrder.selector;
        assembly {
            mstore(start, FILL_ORDER_FUNCTION_SIGNATURE)
        }
        
        // Use identity function precompile to cheaply copy Order struct over
        // We need assembly to access the precompile
        // Note that sizeof(Order) == 12 * 32 == 384
        assembly {
            let success := delegatecall(
                51,            // precompile takes 15 + 3 * numWords
                0x4,           // precompile for identity function
                order,         // pointer to start of input
                384,           // length of input
                add(start, 4), // store output at offset 4
                384            // output is 384 bytes
            )
            if iszero(success) {
                revert(0, 0)
            }
        }
        
        // Write takerTokenFillAmount
        assembly {
            mstore(add(start, 388), takerTokenFillAmount)
        }

        // Write offset to signature and len(signature)
        // It is done in assembly so we can write 32 bytes at a time. In
        // solidity we would have to copy one byte at a time.
        assembly {
            mstore(add(start, 420), 448)
        }
        
        // Copy over signature length contents
        assembly {
            let size := add(signatureLength, 32)
            let success := delegatecall(
                gas,             // precompile takes 15 + 3 * numWords
                0x4,             // precompile for identity function
                signature,       // pointer to start of input
                size,            // input is (signatureLength + 32) bytes
                add(start, 452), // store output at offset 4
                size             // output is (signatureLength + 32) bytes
            )
            if iszero(success) {
                revert(0, 0)
            }
        }
        
        // Write padding
        for (uint256 i = 0; i < paddingLength; i++) {
            input[486 + signatureLength + i] = 0x00;
        }
        
        // Call the function
        assembly {
            let success := delegatecall(
                gas,       // If fillOrder `revert()`s, we recover unused gas
                address,   // call this contract
                start,     // pointer to start of input
                inputSize, // length of input
                start,     // store output over input
                32         // output is 32 bytes
            )
            switch success
            case 0 {
                // No amount filled if delegatecall is unsuccessful
                takerTokenFilledAmount := 0
            }
            case 1 {
                // Read output value (uint256 takerTokenFilledAmount)
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
        uint[] takerTokenFillAmounts,
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
        uint[] takerTokenFillAmounts,
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
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, fillOrder(
                orders[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                signatures[i]
            ));
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
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
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, fillOrderNoThrow(
                orders[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                signatures[i]
            ));
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
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
