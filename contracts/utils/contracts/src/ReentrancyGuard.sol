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

pragma solidity ^0.5.9;


contract ReentrancyGuard {

    // Mutex counter.
    // Starts at 1 and increases whenever a nonReentrant function is called.
    uint256 private reentrancyGuardCounter = 1;

    /// @dev Functions with this modifer cannot be reentered.
    modifier nonReentrant() {
        // Increment and remember the current counter value.
        uint256 localCounter = ++reentrancyGuardCounter;
        // Call the function.
        _;
        // If the counter value is different from what we remember,
        // the function was called more than once.
        require(
            localCounter == reentrancyGuardCounter,
            "REENTRANCY_ILLEGAL"
        );
    }
}
