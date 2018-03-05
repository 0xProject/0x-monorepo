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

contract LibOrder {
    
    bytes32 constant orderSchemaHash = keccak256(
        "address exchangeAddress",
        "address makerAddress",
        "address takerAddress",
        "address makerTokenAddress",
        "address takerTokenAddress",
        "address feeRecipientAddress",
        "uint256 makerTokenAmount",
        "uint256 takerTokenAmount",
        "uint256 makerFeeAmount",
        "uint256 takerFeeAmount",
        "uint256 expirationTimeSeconds",
        "uint256 salt"
    );
    
    //  TODO: Append `Address` to all address fields and `Amount` to all value fields?
    struct Order {
        address makerAddress;
        address takerAddress;
        address makerTokenAddress;
        address takerTokenAddress;
        address feeRecipientAddress;
        uint256 makerTokenAmount;
        uint256 takerTokenAmount;
        uint256 makerFeeAmount;
        uint256 takerFeeAmount;
        uint256 expirationTimeSeconds;
        uint256 salt;
    }
    
    /// @dev Calculates Keccak-256 hash of the order.
    /// @param order The order structure.
    /// @return Keccak-256 EIP712 hash of the order.
    function getOrderHash(Order order)
        public view
        returns (bytes32 orderHash)
    {
        // TODO: EIP712 is not finalized yet
        orderHash = keccak256(
            orderSchemaHash,
            keccak256(
                address(this),
                order.makerAddress,
                order.takerAddress,
                order.makerTokenAddress,
                order.takerTokenAddress,
                order.feeRecipientAddress,
                order.makerTokenAmount,
                order.takerTokenAmount,
                order.makerFeeAmount,
                order.takerFeeAmount,
                order.expirationTimeSeconds,
                order.salt
            )
        );
        return orderHash;
    }
}
