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
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    function fillOrKillOrder(
        address[5] orderAddresses,
        uint[6] orderValues,
        uint takerTokenFillAmount,
        bytes signature)
        public
    {
        require(fillOrder(
            orderAddresses,
            orderValues,
            takerTokenFillAmount,
            signature
        ) == takerTokenFillAmount);
    }

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signature Maker's signature of the order.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (bool success, uint256 takerTokenFilledAmount)
    {
        bytes4 FILL_ORDER_FUNCTION_SIGNATURE = bytes4(keccak256("fillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)"));
        
        // Input size is padded to a 4 + n * 32 byte boundary
        uint256 mask = 0x1F;
        uint256 inputSize = 388 + (signature.length + mask) & ~mask;
        
        assembly {
            let x := mload(0x40)  // free memory pointer
            mstore(x, FILL_ORDER_FUNCTION_SIGNATURE)

            // first 32 bytes of a dynamic in-memory array contains length
            mstore(add(x, 4), add(orderAddresses, 32))     // maker
            mstore(add(x, 36), add(orderAddresses, 64))    // taker
            mstore(add(x, 68), add(orderAddresses, 96))    // makerToken
            mstore(add(x, 100), add(orderAddresses, 128))  // takerToken
            mstore(add(x, 132), add(orderAddresses, 160))  // feeRecipient
            mstore(add(x, 164), add(orderValues, 32))      // makerTokenAmount
            mstore(add(x, 196), add(orderValues, 64))      // takerTokenAmount
            mstore(add(x, 228), add(orderValues, 96))      // makerFee
            mstore(add(x, 260), add(orderValues, 128))     // takerFee
            mstore(add(x, 292), add(orderValues, 160))     // expirationTimestampInSec
            mstore(add(x, 324), add(orderValues, 192))     // salt
            mstore(add(x, 356), takerTokenFillAmount)
            for {
                let src := signature
                let dst := add(x, 388)
                let end := add(add(src, mload(signature)), 32)
            } lt(src, end) { 
                src := add(src, 32)
                dst := add(dst, 32)
            } {
                mstore(dst, mload(src))
                // TODO: zero the padding
            }

            success := delegatecall(
                gas,       // TODO: don't send all gas, save some for returning in case of throw
                address,   // call this contract
                x,         // inputs start at x
                inputSize, // input are size
                x,         // store output over input
                32         // output is 32 bytes
            )

            takerTokenFilledAmount := mload(x)
        }
        return (success, takerTokenFilledAmount);
    }

    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenFillAmounts,
        bytes[] signatures)
        external
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrKill in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    function batchFillOrKillOrders(
        address[5][] orderAddresses,
        uint[6][] orderValues,
        uint[] takerTokenFillAmounts,
        bytes[] signatures)
        external
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrKillOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param signatures Maker's signatures of the orders.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerToken filled in trade. 
    function batchFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint[6][] orderValues,
        uint[] takerTokenFillAmounts,
        bytes[] signatures)
        external
        returns (uint)
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrderNoThrow(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total takerTokenFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        external
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            require(orderAddresses[i][3] == orderAddresses[0][3]); // takerToken must be the same for each order
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, fillOrder(
                orderAddresses[i],
                orderValues[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                signatures[i]
            ));
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
        }
        return totalTakerTokenFilledAmount;
    }

    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction until total takerTokenFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
    /// @param signatures Maker's signatures of the orders.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        external
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            require(orderAddresses[i][3] == orderAddresses[0][3]); // takerToken must be the same for each order
            var (, takerTokenFilledAmount) = fillOrderNoThrow(
                orderAddresses[i],
                orderValues[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                signatures[i]
            );
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, takerTokenFilledAmount);
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
        }
        return totalTakerTokenFilledAmount;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenCancelAmounts Array of desired amounts of takerToken to cancel in orders.
    function batchCancelOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenCancelAmounts)
        external
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            cancelOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenCancelAmounts[i]
            );
        }
    }
    
}
