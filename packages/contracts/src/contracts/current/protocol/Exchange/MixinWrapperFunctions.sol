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

import './mixins/MExchangeCore.sol';
import "../../utils/SafeMath/SafeMath.sol";

/// @dev Consumes MExchangeCore
contract MixinWrapperFunctions is
    MExchangeCore,
    SafeMath
{
    /// @param orders Array of orders.
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
    /// @param orders Array of orders.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (bool success, uint256 takerTokenFilledAmount)
    {
        // !!! TODO !!! Update to `Order order` parameter
        
        // We need to call MExchangeCore.fillOrder using a delegatecall in
        // assembly so that we can intercept a call that throws. For this, we
        // need the input encoded in memory in the Ethereum ABIv2 format [1].
        //
        // | Offset | Length | Contents                     |
        // |--------|--------|------------------------------|
        // | 0      | 4      | function selector            |
        // | 4      | 160    | address[5] orderAddresses    |
        // | 164    | 192    | uint256[6] orderValues       |
        // | 356    | 32     | uint256 takerTokenFillAmount |
        // | 388    | 32     | offset to signature (416)    |
        // | 420    | 32     | len(signature)               |
        // | 452    | (1)    | signature                    |
        // | (2)    | (3)    | padding (zero)               |
        // | (4)    |        | end of input                 |
        //
        // (1): len(signature)
        // (2): 452 + len(signature)
        // (3): (32 - len(signature)) mod 32
        // (4): 452 + len(signature) + (32 - len(signature)) mod 32
        //
        // [1]: https://solidity.readthedocs.io/en/develop/abi-spec.html
        
        // Allocate memory for input
        uint256 signatureLength = signature.length;
        uint256 paddingLength = (32 - signatureLength) % 32;
        uint256 inputSize = 452 + signatureLength + paddingLength;
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
        bytes4 FILL_ORDER_FUNCTION_SIGNATURE = bytes4(keccak256("fillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)"));
        assembly {
            mstore(start, FILL_ORDER_FUNCTION_SIGNATURE)
        }
        
        // Write orderAddresses, orderValues, takerTokenFillAmount,
        // offset to signature and len(signature)
        // It is done in assembly so we can write 32 bytes at a time. In
        // solidity we would have to copy one byte at a time.
        // Fixed size arrays do not have the `uint256 length` prefix that
        // dynamic arrays have [citation needed].
        assembly {
            mstore(add(start, 4), orderAddresses)              // maker
            mstore(add(start, 36), add(orderAddresses, 32))    // taker
            mstore(add(start, 68), add(orderAddresses, 64))    // makerToken
            mstore(add(start, 100), add(orderAddresses, 96))   // takerToken
            mstore(add(start, 132), add(orderAddresses, 128))  // feeRecipient
            mstore(add(start, 164), orderValues)            // makerTokenAmount
            mstore(add(start, 196), add(orderValues, 32))   // takerTokenAmount
            mstore(add(start, 228), add(orderValues, 64))   // makerFee
            mstore(add(start, 260), add(orderValues, 96))   // takerFee
            mstore(add(start, 292), add(orderValues, 128))  // expiration
            mstore(add(start, 356), takerTokenFillAmount)
            mstore(add(start, 388), 416)
            mstore(add(start, 420), signatureLength)
        }
        
        // Write signature contents and padding one byte at a time
        for (uint256 i = 0; i < signatureLength; i++) {
            input[452 + i] = signature[i];
        }
        for (i = 0; i < paddingLength; i++) {
            input[452 + signatureLength + i] = 0x00;
        }
        
        // Call the function
        assembly {
            success := delegatecall(
                gas,       // If fillOrder `revert()`s, we recover unused gas
                address,   // call this contract
                start,     // pointer to start of input
                inputSize, // length of input
                start,     // store output over input
                32         // output is 32 bytes
            )
            
            // Read output value (uint256 takerTokenFilledAmount)
            takerTokenFilledAmount := mload(start)
        }
        return (success, takerTokenFilledAmount);
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
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
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
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
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
            require(orders[i].takerToken == orders[0].takerToken);
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
            require(orders[i].takerToken == orders[0].takerToken);
            var (, takerTokenFilledAmount) = fillOrderNoThrow(
                orders[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                signatures[i]
            );
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, takerTokenFilledAmount);
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
        external
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(
                orders[i],
                takerTokenCancelAmounts[i]
            );
        }
    }
    
}
