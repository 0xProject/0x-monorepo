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

pragma solidity ^0.4.18;

import { TokenTransferProxy } from "../TokenTransferProxy/TokenTransferProxy.sol";
import { Token_v1 as Token } from "../../../previous/Token/Token_v1.sol";
import { SafeMath_v1 as SafeMath } from "../../../previous/SafeMath/SafeMath_v1.sol";

/// @title Exchange - Facilitates exchange of ERC20 tokens.
/// @author Amir Bandeali - <amir@0xProject.com>, Will Warren - <will@0xProject.com>
contract Exchange is SafeMath {

    // Error Codes
    enum Errors {
        ORDER_EXPIRED,                    // Order has already expired
        ORDER_FULLY_FILLED_OR_CANCELLED,  // Order has already been fully filled or cancelled
        ROUNDING_ERROR_TOO_LARGE,         // Rounding error too large
        INSUFFICIENT_BALANCE_OR_ALLOWANCE // Insufficient balance or allowance for token transfer
    }

    string constant public VERSION = "1.0.0";

    address public ZRX_TOKEN_CONTRACT;
    address public TOKEN_TRANSFER_PROXY_CONTRACT;

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
        uint256 paidMakerFee,
        uint256 paidTakerFee,
        bytes32 indexed tokens, // keccak256(makerToken, takerToken), allows subscribing to a token pair
        bytes32 orderHash
    );

    event LogCancel(
        address indexed maker,
        address indexed feeRecipient,
        address makerToken,
        address takerToken,
        uint256 cancelledMakerTokenAmount,
        uint256 takerTokenCancelledAmount,
        bytes32 indexed tokens,
        bytes32 orderHash
    );

    event LogError(uint8 indexed errorId, bytes32 indexed orderHash);

    struct Order {
        address maker;
        address taker;
        address makerToken;
        address takerToken;
        address feeRecipient;
        uint256 makerTokenAmount;
        uint256 takerTokenAmount;
        uint256 makerFee;
        uint256 takerFee;
        uint256 expirationTimestampInSec;
        bytes32 orderHash;
    }

    function Exchange(address _zrxToken, address _tokenTransferProxy) {
        ZRX_TOKEN_CONTRACT = _zrxToken;
        TOKEN_TRANSFER_PROXY_CONTRACT = _tokenTransferProxy;
    }
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

        uint256 makerTokenFilledAmount = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);
        uint256 paidMakerFee;
        uint256 paidTakerFee;
        filled[order.orderHash] = safeAdd(filled[order.orderHash], takerTokenFilledAmount);
        require(transferViaTokenTransferProxy(
            order.makerToken,
            order.maker,
            msg.sender,
            makerTokenFilledAmount
        ));
        require(transferViaTokenTransferProxy(
            order.takerToken,
            msg.sender,
            order.maker,
            takerTokenFilledAmount
        ));
        if (order.feeRecipient != address(0)) {
            if (order.makerFee > 0) {
                paidMakerFee = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
                require(transferViaTokenTransferProxy(
                    ZRX_TOKEN_CONTRACT,
                    order.maker,
                    order.feeRecipient,
                    paidMakerFee
                ));
            }
            if (order.takerFee > 0) {
                paidTakerFee = getPartialAmount(takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
                require(transferViaTokenTransferProxy(
                    ZRX_TOKEN_CONTRACT,
                    msg.sender,
                    order.feeRecipient,
                    paidTakerFee
                ));
            }
        }

        LogFill(
            order.maker,
            msg.sender,
            order.feeRecipient,
            order.makerToken,
            order.takerToken,
            makerTokenFilledAmount,
            takerTokenFilledAmount,
            paidMakerFee,
            paidTakerFee,
            keccak256(order.makerToken, order.takerToken),
            order.orderHash
        );
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
            keccak256(order.makerToken, order.takerToken),
            order.orderHash
        );
    }
    /*
    * Wrapper functions
    */

    /// @dev Fills an order with specified parameters and ECDSA signature. Throws if specified amount not filled entirely.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    function fillOrKillOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
    {
        require(fillOrder(
            orderAddresses,
            orderValues,
            takerTokenFillAmount,
            v,
            r,
            s
        ) == takerTokenFillAmount);
    }
    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerTokenFillAmount Desired amount of takerToken to fill.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerToken filled in trade.
    function fillOrderNoThrow(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
        returns (bool success, uint256 takerTokenFilledAmount)
    {
        bytes4 FILL_ORDER_FUNCTION_SIGNATURE = bytes4(keccak256("fillOrder(address[5],uint256[6],uint256,uint8,bytes32,bytes32)"));
        
        assembly {
            let x := mload(0x40)
            mstore(x, FILL_ORDER_FUNCTION_SIGNATURE)
            mstore(add(x, 4), add(orderAddresses, 32))
            mstore(add(x, 36), add(orderAddresses, 64))
            mstore(add(x, 68), add(orderAddresses, 96))
            mstore(add(x, 100), add(orderAddresses, 128))
            mstore(add(x, 132), add(orderAddresses, 160))
            mstore(add(x, 164), add(orderValues, 32))
            mstore(add(x, 196), add(orderValues, 64))
            mstore(add(x, 228), add(orderValues, 96))
            mstore(add(x, 260), add(orderValues, 128))
            mstore(add(x, 292), add(orderValues, 160))
            mstore(add(x, 324), add(orderValues, 192))
            mstore(add(x, 356), takerTokenFillAmount)
            mstore(add(x, 388), v)
            mstore(add(x, 420), r)
            mstore(add(x, 452), s)

            success := delegatecall(
                gas,
                address,
                x,
                484,
                x,
                32
            )

            takerTokenFilledAmount := mload(x)
        }
    }
    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        public
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                v[i],
                r[i],
                s[i]
            );
        }
    }
    /// @dev Synchronously executes multiple calls of fillOrKill in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrKillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        public
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrKillOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                v[i],
                r[i],
                s[i]
            );
        }
    }
    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        public
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            fillOrderNoThrow(
                orderAddresses[i],
                orderValues[i],
                takerTokenFillAmounts[i],
                v[i],
                r[i],
                s[i]
            );
        }
    }
    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction until total takerTokenFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerTokenFillAmount,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        public
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            require(orderAddresses[i][3] == orderAddresses[0][3]); // takerToken must be the same for each order
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, fillOrder(
                orderAddresses[i],
                orderValues[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                v[i],
                r[i],
                s[i]
            ));
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
        }
    }
    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction until total takerTokenFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenFillAmount Desired total amount of takerToken to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    /// @return Total amount of takerTokenFillAmount filled in orders.
    function marketFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerTokenFillAmount,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        public
        returns (uint256 totalTakerTokenFilledAmount)
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            require(orderAddresses[i][3] == orderAddresses[0][3]); // takerToken must be the same for each order
            var (success, takerTokenFilledAmount) = fillOrderNoThrow(
                orderAddresses[i],
                orderValues[i],
                safeSub(takerTokenFillAmount, totalTakerTokenFilledAmount),
                v[i],
                r[i],
                s[i]
            );
            totalTakerTokenFilledAmount = safeAdd(totalTakerTokenFilledAmount, takerTokenFilledAmount);
            if (totalTakerTokenFilledAmount == takerTokenFillAmount) break;
        }
    }
    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerTokenCancelAmounts Array of desired amounts of takerToken to cancel in orders.
    function batchCancelOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerTokenCancelAmounts)
        public
    {
        for (uint256 i = 0; i < orderAddresses.length; i++) {
            cancelOrder(
                orderAddresses[i],
                orderValues[i],
                takerTokenCancelAmounts[i]
            );
        }
    }

    /*
    * Constant public functions
    */

    /// @dev Calculates Keccak-256 hash of order with specified parameters.
    /// @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
    /// @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @return Keccak-256 hash of order.
    function getOrderHash(address[5] orderAddresses, uint256[6] orderValues)
        public
        constant
        returns (bytes32)
    {
        return keccak256(
            address(this),
            orderAddresses[0], // maker
            orderAddresses[1], // taker
            orderAddresses[2], // makerToken
            orderAddresses[3], // takerToken
            orderAddresses[4], // feeRecipient
            orderValues[0],    // makerTokenAmount
            orderValues[1],    // takerTokenAmount
            orderValues[2],    // makerFee
            orderValues[3],    // takerFee
            orderValues[4],    // expirationTimestampInSec
            orderValues[5]     // salt
        );
    }

    /// @dev Verifies that an order signature is valid.
    /// @param signer address of signer.
    /// @param hash Signed Keccak-256 hash.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Validity of order signature.
    function isValidSignature(
        address signer,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
        constant
        returns (bool)
    {
        return signer == ecrecover(
            keccak256("\x19Ethereum Signed Message:\n32", hash),
            v,
            r,
            s
        );
    }

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public
        constant
        returns (bool)
    {
        uint256 remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) return false; // No rounding error.

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        return errPercentageTimes1000000 > 1000;
    }

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        public
        constant
        returns (uint256)
    {
        return safeDiv(safeMul(numerator, target), denominator);
    }

    /// @dev Calculates the sum of values already filled and cancelled for a given order.
    /// @param orderHash The Keccak-256 hash of the given order.
    /// @return Sum of values already filled and cancelled.
    function getUnavailableTakerTokenAmount(bytes32 orderHash)
        public
        constant
        returns (uint256)
    {
        return safeAdd(filled[orderHash], cancelled[orderHash]);
    }


    /*
    * Internal functions
    */

    /// @dev Transfers a token using TokenTransferProxy transferFrom function.
    /// @param token Address of token to transferFrom.
    /// @param from Address transfering token.
    /// @param to Address receiving token.
    /// @param value Amount of token to transfer.
    /// @return Success of token transfer.
    function transferViaTokenTransferProxy(
        address token,
        address from,
        address to,
        uint256 value)
        internal
        returns (bool)
    {
        return TokenTransferProxy(TOKEN_TRANSFER_PROXY_CONTRACT).transferFrom(token, from, to, value);
    }
}
