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

pragma solidity 0.4.24;

import "@0x/contracts-utils/contracts/utils/LibBytes/LibBytes.sol";


library LibAddressArray {

    /// @dev Append a new address to an array of addresses.
    ///      The `addressArray` may need to be reallocated to make space
    ///      for the new address. Because of this we return the resulting
    ///      memory location of `addressArray`.
    /// @param addressToAppend  Address to append.
    /// @return Array of addresses: [... addressArray, addressToAppend]
    function append(address[] memory addressArray, address addressToAppend) 
        internal pure
        returns (address[])
    {
        // Get stats on address array and free memory
        uint256 freeMemPtr = 0;
        uint256 addressArrayBeginPtr = 0;
        uint256 addressArrayEndPtr = 0;
        uint256 addressArrayLength = addressArray.length;
        uint256 addressArrayMemSizeInBytes = 32 + (32 * addressArrayLength);
        assembly {
            freeMemPtr := mload(0x40)
            addressArrayBeginPtr := addressArray
            addressArrayEndPtr := add(addressArray, addressArrayMemSizeInBytes)
        }

        // If free memory begins at the end of `addressArray`
        // then we can append `addressToAppend` directly.
        // Otherwise, we must copy the array to free memory
        // before appending new values to it.
        if (freeMemPtr != addressArrayEndPtr) {
            LibBytes.memCopy(freeMemPtr, addressArrayBeginPtr, addressArrayMemSizeInBytes);
            assembly {
                addressArray := freeMemPtr
                addressArrayBeginPtr := addressArray
            }
        }

        // Append `addressToAppend`
        addressArrayLength += 1;
        addressArrayMemSizeInBytes += 32;
        addressArrayEndPtr = addressArrayBeginPtr + addressArrayMemSizeInBytes;
        freeMemPtr = addressArrayEndPtr;
        assembly {
            // Store new array length
            mstore(addressArray, addressArrayLength)

            // Update `freeMemPtr`
            mstore(0x40, freeMemPtr)
        }
        addressArray[addressArrayLength - 1] = addressToAppend;
        return addressArray;
    }
}
