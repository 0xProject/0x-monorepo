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
pragma experimental ABIEncoderV2;

import "../../utils/LibBytes/LibBytes.sol";

contract TestLibBytes is
    LibBytes
{

    /// @dev Tests equality of two byte arrays.
    /// @param lhs First byte array to compare.
    /// @param rhs Second byte array to compare.
    /// @return True if arrays are the same. False otherwise.
    function publicAreBytesEqual(bytes memory lhs, bytes memory rhs)
        public
        pure
        returns (bool equal)
    {
        equal = areBytesEqual(lhs, rhs);
        return equal;
    }

    /// @dev Reads an address from a position in a byte array.
    /// @param b Byte array containing an address.
    /// @param index Index in byte array of address.
    /// @return address from byte array.
    function publicReadAddress(
        bytes memory b,
        uint256 index)
        public
        pure
        returns (address result)
    {
        result = readAddress(b, index);
        return result;
    }

    /// @dev Writes an address into a specific position in a byte array.
    /// @param b Byte array to insert address into.
    /// @param index Index in byte array of address.
    /// @param input Address to put into byte array.
    function publicWriteAddress(
        bytes memory b,
        uint256 index,
        address input)
        public
        pure
        returns (bytes memory)
    {
        writeAddress(b, index, input);
        return b;
    }

    /// @dev Reads a bytes32 value from a position in a byte array.
    /// @param b Byte array containing a bytes32 value.
    /// @param index Index in byte array of bytes32 value.
    /// @return bytes32 value from byte array.
    function publicReadBytes32(
        bytes memory b,
        uint256 index)
        public
        pure
        returns (bytes32 result)
    {
        result = readBytes32(b, index);
        return result;
    }

    /// @dev Writes a bytes32 into a specific position in a byte array.
    /// @param b Byte array to insert <input> into.
    /// @param index Index in byte array of <input>.
    /// @param input bytes32 to put into byte array.
    function publicWriteBytes32(
        bytes memory b,
        uint256 index,
        bytes32 input)
        public
        pure
        returns (bytes memory)
    {
        writeBytes32(b, index, input);
        return b;
    }

    /// @dev Reads a uint256 value from a position in a byte array.
    /// @param b Byte array containing a uint256 value.
    /// @param index Index in byte array of uint256 value.
    /// @return uint256 value from byte array.
    function publicReadUint256(
        bytes memory b,
        uint256 index)
        public
        pure
        returns (uint256 result)
    {
        result = readUint256(b, index);
        return result;
    }

    /// @dev Writes a uint256 into a specific position in a byte array.
    /// @param b Byte array to insert <input> into.
    /// @param index Index in byte array of <input>.
    /// @param input uint256 to put into byte array.
    function publicWriteUint256(
        bytes memory b,
        uint256 index,
        uint256 input)
        public
        pure
        returns (bytes memory)
    {
        writeUint256(b, index, input);
        return b;
    }
}
