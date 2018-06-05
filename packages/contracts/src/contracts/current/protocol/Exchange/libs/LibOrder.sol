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

pragma solidity ^0.4.24;

import "./LibEIP712.sol";

contract LibOrder is
    LibEIP712
{

    bytes32 constant EIP712_ORDER_SCHEMA_HASH = keccak256(
        abi.encodePacked(
            "Order(",
            "address makerAddress,",
            "address takerAddress,",
            "address feeRecipientAddress,",
            "address senderAddress,",
            "uint256 makerAssetAmount,",
            "uint256 takerAssetAmount,",
            "uint256 makerFee,",
            "uint256 takerFee,",
            "uint256 expirationTimeSeconds,",
            "uint256 salt,",
            "bytes makerAssetData,",
            "bytes takerAssetData",
            ")"
    ));

    // A valid order remains fillable until it is expired, fully filled, or cancelled.
    // An order's state is unaffected by external factors, like account balances.
    enum OrderStatus {
        INVALID,                     // Default value
        INVALID_MAKER_ASSET_AMOUNT,  // Order does not have a valid maker asset amount
        INVALID_TAKER_ASSET_AMOUNT,  // Order does not have a valid taker asset amount
        FILLABLE,                    // Order is fillable
        EXPIRED,                     // Order has already expired
        FULLY_FILLED,                // Order is fully filled
        CANCELLED                    // Order has been cancelled
    }

    struct Order {
        address makerAddress;
        address takerAddress;
        address feeRecipientAddress;
        address senderAddress;
        uint256 makerAssetAmount;
        uint256 takerAssetAmount;
        uint256 makerFee;
        uint256 takerFee;
        uint256 expirationTimeSeconds;
        uint256 salt;
        bytes makerAssetData;
        bytes takerAssetData;
    }

    struct OrderInfo {
        // See LibStatus for a complete description of order statuses
        uint8 orderStatus;
        // Keccak-256 EIP712 hash of the order
        bytes32 orderHash;
        // Amount of order that has been filled
        uint256 orderTakerAssetFilledAmount;
    }

    /// @dev Calculates Keccak-256 hash of the order.
    /// @param order The order structure.
    /// @return Keccak-256 EIP712 hash of the order.
    function getOrderHash(Order memory order)
        internal
        view
        returns (bytes32 orderHash)
    {
        orderHash = createEIP712Message(
            keccak256(
                abi.encodePacked(
                    EIP712_ORDER_SCHEMA_HASH,
                    bytes32(order.makerAddress),
                    bytes32(order.takerAddress),
                    bytes32(order.feeRecipientAddress),
                    bytes32(order.senderAddress),
                    order.makerAssetAmount,
                    order.takerAssetAmount,
                    order.makerFee,
                    order.takerFee,
                    order.expirationTimeSeconds,
                    order.salt,
                    keccak256(abi.encodePacked(order.makerAssetData)),
                    keccak256(abi.encodePacked(order.takerAssetData))
                )
            )
        );
        return orderHash;
    }
}
