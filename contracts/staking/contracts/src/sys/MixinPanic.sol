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

import "../immutable/MixinStorage.sol";


contract MixinPanic is
    MixinStorage
{
    /// @dev Set the contract in catastrophic failure mode.
    ///      TODO: Actually have this do something instead of
    ///      reverting.
    function _panic() internal {
        revert("CATASTROPHIC_FAILURE");
    }

    /// @dev Calls `panic()` if `condition` is `false`.
    /// @param invariant A boolean that should be true.
    function _assert(bool invariant) internal {
        if (!invariant) {
            _panic();
        }
    }
}
