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
    
    /// @dev Copies `length` bytes from memory location `source` to `dest`.
    /// @param dest memory address to copy bytes to
    /// @param source memory address to copy bytes from
    /// @param length number of bytes to copy
    function memcpy(
        uint256 dest,
        uint256 source,
        uint256 length
    )
        internal
        pure
    {
        if (length < 32) {
            // Handle a partial word by reading destination and masking
            // off the bits we are interested in.
            // This correctly handles overlap, zero lengths and source == dest
            assembly {
                let mask := sub(exp(256, sub(32, length)), 1)
                let s := and(mload(source), not(mask))
                let d := and(mload(dest), mask)
                mstore(dest, or(s, d))
            }
        } else {
            // Skip the O(length) loop when source == dest.
            if (source == dest) {
                return;
            }
            
            // For large copies we copy whole words at a time. The final
            // word is aligned to the end of the range (instead of after the
            // previous) to handle partial words. So a copy will look like this:
            //
            //  ####
            //      ####
            //          ####
            //            ####
            //
            // We handle overlap in the source and destination range by
            // changing the copying direction. This prevents us from
            // overwriting parts of source that we still need to copy.
            //
            // This correctly handles source == dest
            //
            if (source > dest) {
                assembly {
                    // We subtract 32 from `send` and `dend` because it
                    // is easier to compare with in the loop, and these
                    // are also the addresses we need for copying the
                    // last bytes.
                    length := sub(length, 32)
                    let send := add(source, length)
                    let dend := add(dest, length)
                    
                    // Remember the last 32 bytes of source
                    // This needs to be done here and not after the loop
                    // because we may have overwritten the last bytes in
                    // source already due to overlap.
                    let last := mload(send)
                    
                    // Copy whole words front to back
                    for {} lt(source, send) {} {
                        mstore(dest, mload(source))
                        source := add(source, 32)
                        dest := add(dest, 32)
                    }
                    
                    // Write the last 32 bytes
                    mstore(dend, last)
                }
            } else {
                assembly {
                    // We subtract 32 from `send` and `dend` because those
                    // are the starting points when copying a word at the end.
                    length := sub(length, 32)
                    let send := add(source, length)
                    let dend := add(dest, length)
                    
                    // Remember the first 32 bytes of source
                    // This needs to be done here and not after the loop
                    // because we may have overwritten the first bytes in
                    // source already due to overlap.
                    let first := mload(source)
                    
                    // Copy whole words back to front
                    for {} lt(source, send) {} {
                        mstore(dend, mload(send))
                        send := sub(send, 32)
                        dend := sub(dend, 32)
                    }
                    
                    // Write the first 32 bytes
                    mstore(dest, first)
                }
            }
        }
    }
}
