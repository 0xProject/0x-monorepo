/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;

import "./errors/LibReentrancyGuardRichErrorsV06.sol";
import "./errors/LibRichErrorsV06.sol";


contract ReentrancyGuardV06 {

    // Locked state of mutex.
    bool private _locked = false;

    /// @dev Functions with this modifer cannot be reentered. The mutex will be locked
    ///      before function execution and unlocked after.
    modifier nonReentrant() {
        _lockMutexOrThrowIfAlreadyLocked();
        _;
        _unlockMutex();
    }

    function _lockMutexOrThrowIfAlreadyLocked()
        internal
    {
        // Ensure mutex is unlocked.
        if (_locked) {
            LibRichErrorsV06.rrevert(
                LibReentrancyGuardRichErrorsV06.IllegalReentrancyError()
            );
        }
        // Lock mutex.
        _locked = true;
    }

    function _unlockMutex()
        internal
    {
        // Unlock mutex.
        _locked = false;
    }
}
