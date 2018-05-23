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

contract LibMem {

    function getMemAddress(bytes memory input)
        internal
        pure
        returns (uint256 address_)
    {
        assembly {
            address_ := input
        }
        return address_;
    }

    /// @dev Writes a uint256 into a specific position in a byte array.
    /// @param dest memory adress to copy bytes to
    function memcpy(
        uint256 dest,
        uint256 source,
        uint256 length
    )
        internal
        pure
    {
        // Base cases
        if(length == 0) return;
        if(source == dest) return;

        // Copy bytes from source to dest
        assembly {
            // Compute number of complete words to copy + remaining bytes
            let lenFullWords := div(add(length, 0x1F), 0x20)
            let remainder := mod(length, 0x20)
            if gt(remainder, 0) {
                lenFullWords := sub(lenFullWords, 1)
            }

            // Copy full words from source to dest
            let offset := 0
            let maxOffset := mul(0x20, lenFullWords)
            for {offset := 0} lt(offset, maxOffset) {offset := add(offset, 0x20)} {
                mstore(add(dest, offset),  mload(add(source, offset)))
            }

            // Copy remaining bytes
            if gt(remainder, 0) {
                // Read a full word from source, containing X bytes to copy to dest.
                // We only want to keep the X bytes, zeroing out the remaining bytes.
                // We accomplish this by a right shift followed by a left shift.
                // Example:
                //   Suppose a word of 8 bits has all 1's: [11111111]
                //   Let X = 7 (we want to copy the first 7 bits)
                //   Apply a right shift of 1: [01111111]
                //   Apply a left shift of 1: [11111110]
                let sourceShiftFactor := exp(2, mul(8, sub(0x20, remainder)))
                let sourceWord := mload(add(source, offset))
                let sourceBytes := mul(div(sourceWord, sourceShiftFactor), sourceShiftFactor)

                // Read a full word from dest, containing (32-X) bytes to retain.
                // We need to zero out the remaining bytes to be overwritten by source,
                // while retaining the (32-X) bytes we don't want to overwrite.
                // We accomplish this by a left shift followed by a right shift.
                // Example:
                //   Suppose a word of 8 bits has all 1's: [11111111]
                //   Let X = 7 (we want to free the first 7 bits, and retain the last bit)
                //   Apply a left shift of 1: [11111110]
                //   Apply a right shift of 1: [01111111]
                let destShiftFactor := exp(2, mul(8, remainder))
                let destWord := mload(add(dest, offset))
                let destBytes := div(mul(destWord, destShiftFactor), destShiftFactor)

                // Combine the source and dest bytes. There should be no overlap:
                // The source bytes run from [0..X-1] and the dest bytes from [X..31].
                // Example:
                //   Following the example from above, we have [11111110]
                //   from the source word and [01111111] from the dest word.
                //   Combine these words using <or> to get [11111111].
                let combinedDestWord := or(sourceBytes, destBytes)

                // Store the combined word into dest
                mstore(add(dest, offset), combinedDestWord)
            }
        }
    }
}
