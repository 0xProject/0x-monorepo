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
pragma experimental ABIEncoderV2;

import "./TestStaking.sol";


contract TestMixinScheduler is
    TestStaking
{
    uint256 public testDeployedTimestamp;

    event GoToNextEpochTestInfo(
        uint256 oldEpoch,
        uint256 blockTimestamp
    );

    constructor(
        address wethAddress,
        address zrxVaultAddress
    )
        public
        TestStaking(
            wethAddress,
            zrxVaultAddress
        )
    {
        _addAuthorizedAddress(msg.sender);
        init();
        _removeAuthorizedAddressAtIndex(msg.sender, 0);

        // Record time of deployment
        // solhint-disable-next-line not-rely-on-time
        testDeployedTimestamp = block.timestamp;
    }

    /// @dev Tests `_goToNextEpoch`.
    ///      Configures internal variables such taht `epochEndTime` will be
    ///      less-than, equal-to, or greater-than the block timestamp.
    /// @param epochEndTimeDelta Set to desired `epochEndTime - block.timestamp`
    function goToNextEpochTest(int256 epochEndTimeDelta)
        public
    {
        // solhint-disable-next-line not-rely-on-time
        uint256 blockTimestamp = block.timestamp;

        // Emit info used by client-side test code
        emit GoToNextEpochTestInfo(
            currentEpoch,
            blockTimestamp
        );

        // (i) In `_goToNextEpoch` we compute:
        //     `epochEndTime = currentEpochStartTimeInSeconds + epochDurationInSeconds`
        // (ii) We want adjust internal state such that:
        //      `epochEndTime - block.timestamp = epochEndTimeDelta`, or
        //      `currentEpochStartTimeInSeconds + epochDurationInSeconds - block.timestamp = epochEndTimeDelta`
        //
        // To do this, we:
        //  (i) Set `epochDurationInSeconds` to a constant value of 1, and
        //  (ii) Rearrange the eqn above to get:
        //      `currentEpochStartTimeInSeconds = epochEndTimeDelta + block.timestamp - epochDurationInSeconds`
        epochDurationInSeconds = 1;
        currentEpochStartTimeInSeconds =
            uint256(epochEndTimeDelta + int256(blockTimestamp) - int256(epochDurationInSeconds));

        // Test internal function
        _goToNextEpoch();
    }

    /// @dev Tests `_initMixinScheduler`
    /// @param _currentEpochStartTimeInSeconds Sets `currentEpochStartTimeInSeconds` to this value before test.
    function initMixinSchedulerTest(uint256 _currentEpochStartTimeInSeconds)
        public
    {
        currentEpochStartTimeInSeconds = _currentEpochStartTimeInSeconds;
        _initMixinScheduler();
    }
}