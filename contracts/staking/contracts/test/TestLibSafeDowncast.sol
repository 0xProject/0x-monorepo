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

pragma solidity ^0.5.9;

import "../src/libs/LibSafeDowncast.sol";


contract TestLibSafeDowncast {

    function downcastToUint96(uint256 a) external pure returns (uint96 b) {
        return LibSafeDowncast.downcastToUint96(a);
    }

    function downcastToUint64(uint256 a) external pure returns (uint64 b) {
        return LibSafeDowncast.downcastToUint64(a);
    }
}
