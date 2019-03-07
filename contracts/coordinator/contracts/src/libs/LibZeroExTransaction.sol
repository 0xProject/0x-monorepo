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

pragma solidity ^0.5.3;

import "./LibEIP712Domain.sol";


contract LibZeroExTransaction is
    LibEIP712Domain
{
    // Hash for the EIP712 0x transaction schema
    // keccak256(abi.encodePacked(
    //    "ZeroExTransaction(",
    //    "uint256 salt,",
    //    "address signerAddress,",
    //    "bytes data",
    //    ")"
    // ));
    bytes32 constant internal EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH = 0x213c6f636f3ea94e701c0adf9b2624aa45a6c694f9a292c094f9a81c24b5df4c;

    struct ZeroExTransaction {
        uint256 salt;           // Arbitrary number to ensure uniqueness of transaction hash.
        address signerAddress;  // Address of transaction signer.
        bytes data;             // AbiV2 encoded calldata.
    }

    /// @dev Calculates the EIP712 hash of a 0x transaction using the domain separator of this contract.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @return EIP712 hash of the transaction with the domain separator of this contract.
    function getTransactionHash(ZeroExTransaction memory transaction)
        internal
        view
        returns (bytes32 transactionHash)
    {
        // Note: this transaction hash will differ from the hash produced by the Exchange contract because it utilizes a different domain hash.
        transactionHash = hashEIP712Message(hashZeroExTransaction(transaction));
        return transactionHash;
    }

    /// @dev Calculates EIP712 hash of the 0x transaction with no domain separator.
    /// @param transaction 0x transaction containing salt, signerAddress, and data.
    /// @return EIP712 hash of the transaction with no domain separator.
    function hashZeroExTransaction(ZeroExTransaction memory transaction)
        internal
        pure
        returns (bytes32 result)
    {
        bytes32 schemaHash = EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH;
        bytes memory data = transaction.data;
        uint256 salt = transaction.salt;
        address signerAddress = transaction.signerAddress;

        // Assembly for more efficiently computing:
        // keccak256(abi.encodePacked(
        //     EIP712_ZEROEX_TRANSACTION_SCHEMA_HASH,
        //     transaction.salt,
        //     uint256(transaction.signerAddress),
        //     keccak256(transaction.data)
        // ));

        assembly {
            // Compute hash of data
            let dataHash := keccak256(add(data, 32), mload(data))
    
            // Load free memory pointer
            let memPtr := mload(64)

            mstore(memPtr, schemaHash)                                                               // hash of schema
            mstore(add(memPtr, 32), salt)                                                            // salt
            mstore(add(memPtr, 64), and(signerAddress, 0xffffffffffffffffffffffffffffffffffffffff))  // signerAddress
            mstore(add(memPtr, 96), dataHash)                                                        // hash of data

            // Compute hash
            result := keccak256(memPtr, 128)
        }
        return result;
    }
}
