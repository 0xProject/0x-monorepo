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

import "../src/ReentrancyGuard.sol";


contract TestReentrancyGuard is
    ReentrancyGuard
{
    uint256 internal counter = 2;

    function guarded(bool shouldBeAttacked)
        external
        nonReentrant
    {
        if (shouldBeAttacked) {
            this.exploitive();
        } else {
            this.nonExploitive();
        }
    }

    function exploitive()
        external
    {
        if (counter > 0) {
            counter--;
            this.guarded(true);
        } else {
            counter = 2;
        }
    }

    function nonExploitive()
        external
    {} // solhint-disable-line no-empty-blocks
}
