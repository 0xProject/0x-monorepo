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

pragma solidity ^0.4.21;

contract Memory {
  // Get address from a bytes array
  function getAddress(bytes b, uint256 index)
      public pure
      returns (address result)
  {
      require(b.length >= index + 20); // 20 is length of address

      // Add offset to index:
      // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
      // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
      index += 20;

      // Read address from array memory
      assembly {
          // 1. Add index to to address of bytes array
          // 2. Load 32-byte word from memory
          // 3. Apply 20-byte mask to obtain address
          result := and(mload(add(b, index)), 0xffffffffffffffffffffffffffffffffffffffff)
      }
      return result;
  }

  // Put address into a bytes array
  function putAddress(address input, bytes b, uint256 index)
      public pure
  {
      require(b.length >= index + 20); // 20 is length of address

      // Add offset to index:
      // 1. Arrays are prefixed by 32-byte length parameter (add 32 to index)
      // 2. Account for size difference between address length and 32-byte storage word (subtract 12 from index)
      index += 20;

      // stores additional bytes that occupy the 32-byte word where we'll be storing the address
      bytes32 neighbors;

      // Store address into array memory
      assembly {
          // The address occupies 20 bytes and mstore stores 32 bytes.
          // First fetch the 32-byte word where we'll be storing the address, then
          // apply a mask so we have only the bytes in the word that the address will not occupy.
          // Then combine these bytes with the address and store the 32 bytes back to memory with mstore.

          // 1. Add index to address of bytes array
          // 2. Load 32-byte word from memory
          // 3. Apply 12-byte mask to obtain extra bytes occupying word of memory where we'll store the address
          neighbors := and(mload(add(b, index)), 0xffffffffffffffffffffffff0000000000000000000000000000000000000000)

          // Store the neighbors and address into memory
          mstore(add(b, index), xor(input, neighbors))
      }
  }
}
