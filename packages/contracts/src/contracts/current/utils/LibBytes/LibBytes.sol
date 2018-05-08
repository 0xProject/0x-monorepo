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

pragma solidity ^0.4.23;

contract LibBytes {

    // Revert reasons
    string constant GTE_20_LENGTH_REQUIRED = "Length must be greater than or equal to 20.";
    string constant GTE_32_LENGTH_REQUIRED = "Length must be greater than or equal to 32.";

    /// @dev Tests equality of two byte arrays.
    /// @param lhs First byte array to compare.
    /// @param rhs Second byte array to compare.
    /// @return True if arrays are the same. False otherwise.
    function areBytesEqual(bytes memory lhs, bytes memory rhs)
        internal
        pure
        returns (bool equal)
    {
        assembly {
            // Get the number of words occupied by <lhs>
            let lenFullWords := div(add(mload(lhs), 0x1F), 0x20)

            // Add 1 to the number of words, to account for the length field
            lenFullWords := add(lenFullWords, 0x1)

            // Test equality word-by-word.
            // Terminates early if there is a mismatch.
            for {let i := 0} lt(i, lenFullWords) {i := add(i, 1)} {
                let lhsWord := mload(add(lhs, mul(i, 0x20)))
                let rhsWord := mload(add(rhs, mul(i, 0x20)))
                equal := eq(lhsWord, rhsWord)
                if eq(equal, 0) {
                    // Break
                    i := lenFullWords
                }
            }
       }

       return equal;
    }

    /// @dev Reads an address from a position in a byte array.
    /// @param b Byte array containing an address.
    /// @param index Index in byte array of address.
    /// @return address from byte array.
    function readAddress(
        bytes memory b,
        uint256 index)
        internal
        pure
        returns (address result)
    {
        require(
            b.length >= index + 20,  // 20 is length of address
            GTE_20_LENGTH_REQUIRED
        ); 

        // Add offset to index:
        // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
        // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
        index += 20;

        // Read address from array memory
        assembly {
            // 1. Add index to address of bytes array
            // 2. Load 32-byte word from memory
            // 3. Apply 20-byte mask to obtain address
            result := and(mload(add(b, index)), 0xffffffffffffffffffffffffffffffffffffffff)
        }
        return result;
    }

    /// @dev Writes an address into a specific position in a byte array.
    /// @param b Byte array to insert address into.
    /// @param index Index in byte array of address.
    /// @param input Address to put into byte array.
    function writeAddress(
        bytes memory b,
        uint256 index,
        address input)
        internal
        pure
    {
        require(
            b.length >= index + 20,  // 20 is length of address
            GTE_20_LENGTH_REQUIRED
        ); 

        // Add offset to index:
        // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
        // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
        index += 20;

        // Store address into array memory
        assembly {
            // The address occupies 20 bytes and mstore stores 32 bytes.
            // First fetch the 32-byte word where we'll be storing the address, then
            // apply a mask so we have only the bytes in the word that the address will not occupy.
            // Then combine these bytes with the address and store the 32 bytes back to memory with mstore.

            // 1. Add index to address of bytes array
            // 2. Load 32-byte word from memory
            // 3. Apply 12-byte mask to obtain extra bytes occupying word of memory where we'll store the address
            let neighbors := and(mload(add(b, index)), 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)

            // Store the neighbors and address into memory
            mstore(add(b, index), xor(input, neighbors))
        }
    }

    /// @dev Reads a bytes32 value from a position in a byte array.
    /// @param b Byte array containing a bytes32 value.
    /// @param index Index in byte array of bytes32 value.
    /// @return bytes32 value from byte array.
    function readBytes32(
        bytes memory b,
        uint256 index)
        internal
        pure
        returns (bytes32 result)
    {
        require(
            b.length >= index + 32,
            GTE_32_LENGTH_REQUIRED
        );

        // Arrays are prefixed by a 256 bit length parameter
        index += 32;

        // Read the bytes32 from array memory
        assembly {
            result := mload(add(b, index))
        }
        return result;
    }

    /// @dev Writes a bytes32 into a specific position in a byte array.
    /// @param b Byte array to insert <input> into.
    /// @param index Index in byte array of <input>.
    /// @param input bytes32 to put into byte array.
    function writeBytes32(
        bytes memory b,
        uint256 index,
        bytes32 input)
        internal
        pure
    {
        require(
            b.length >= index + 32,
            GTE_32_LENGTH_REQUIRED
        );

        // Arrays are prefixed by a 256 bit length parameter
        index += 32;

        // Read the bytes32 from array memory
        assembly {
            mstore(add(b, index), input)
        }
    }

    /// @dev Reads a uint256 value from a position in a byte array.
    /// @param b Byte array containing a uint256 value.
    /// @param index Index in byte array of uint256 value.
    /// @return uint256 value from byte array.
    function readUint256(
        bytes memory b,
        uint256 index)
        internal
        pure
        returns (uint256 result)
    {
        return uint256(readBytes32(b, index));
    }

    /// @dev Writes a uint256 into a specific position in a byte array.
    /// @param b Byte array to insert <input> into.
    /// @param index Index in byte array of <input>.
    /// @param input uint256 to put into byte array.
    function writeUint256(
        bytes memory b,
        uint256 index,
        uint256 input)
        internal
        pure
    {
        writeBytes32(b, index, bytes32(input));
    }
}
