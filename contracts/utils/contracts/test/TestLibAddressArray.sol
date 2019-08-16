/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.5;

import "../src/LibAddressArray.sol";


contract TestLibAddressArray {

    using LibAddressArray for address[];

    /// @dev Append a new address to an array of addresses.
    ///      The `addressArray` may need to be reallocated to make space
    ///      for the new address. Because of this we return the resulting
    ///      memory location of `addressArray`.
    /// @param addressArray Array of addresses.
    /// @param addressToAppend  Address to append.
    /// @return Array of addresses: [... addressArray, addressToAppend]
    function publicAppend(address[] memory addressArray, address addressToAppend)
        public
        pure
        returns (address[] memory)
    {
        return addressArray.append(addressToAppend);
    }

    /// @dev Moves the free memory pointer by `freeMemOffset` bytes,
    ///      then performs the append.
    ///      This tests the behavior of the address array being reallocated if
    ///      the memory immediately after the old array is claimed.
    /// @param addressArray Array of addresses.
    /// @param freeMemOffset Number of (signed) bytes to offset the free memory pointer (0x40).
    /// @param addressToAppend Address to append.
    /// @return The new address array.
    /// @return The memory address of the old address array.
    /// @return The memory address of the new address array.
    function testAppendRealloc(
        address[] memory addressArray,
        int256 freeMemOffset,
        address addressToAppend
    )
        public
        pure
        returns (
            address[] memory result,
            uint256 oldArrayMemStart,
            uint256 newArrayMemStart
        )
    {
        assembly {
            // Remember the original memory address of the array.
            oldArrayMemStart := addressArray
            // Move the free memory pointer.
            mstore(0x40, add(mload(0x40), freeMemOffset))
        }

        // Call append.
        result = addressArray.append(addressToAppend);

        // Get the new array memory address.
        assembly {
            newArrayMemStart := result
        }
    }

    /// @dev Checks if an address array contains the target address.
    /// @param addressArray Array of addresses.
    /// @param target Address to search for in array.
    /// @return True if the addressArray contains the target.
    function publicContains(address[] memory addressArray, address target)
        public
        pure
        returns (bool success)
    {
        return addressArray.contains(target);
    }

    /// @dev Finds the index of an address within an array.
    /// @param addressArray Array of addresses.
    /// @param target Address to search for in array.
    /// @return Existence and index of the target in the array.
    function publicIndexOf(address[] memory addressArray, address target)
        public
        pure
        returns (bool success, uint256 index)
    {
        (success, index) = addressArray.indexOf(target);
    }

}
