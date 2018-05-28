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

import "../../utils/LibMem/LibMem.sol";

contract TestLibMem is
    LibMem
{
    function testMemcpy(
        bytes mem,       ///< Memory contents we want to apply memcpy to
        uint256 dest,
        uint256 source,
        uint256 length
    )
        public // not external, we need input in memory
        pure
        returns (bytes)
    {
        // Sanity check. Overflows are not checked.
        require(source + length <= mem.length);
        require(dest + length <= mem.length);
        
        // Get pointer to memory contents
        uint256 offset = getMemAddress(mem) + 32;
        
        // Execute memcpy adjusted for memory array location
        memcpy(offset + dest, offset + source, length);
        
        // Return modified memory contents
        return mem;
    }
}
