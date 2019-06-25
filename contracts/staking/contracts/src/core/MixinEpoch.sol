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

pragma solidity ^0.5.5;

import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStructs.sol";

contract MixinEpoch is
    MixinConstants,
    MixinStorage
{

    /// @dev returns the current epoch in seconds
    function getEpochPeriodInSeconds()
        public
        view
        returns (uint64)
    {
        return EPOCH_PERIOD_IN_SECONDS;
    }

    function getTimelockPeriodInEpochs()
        public
        view
        returns (uint64)
    {
        return TIMELOCK_PERIOD_IN_EPOCHS;
    }

    function getCurrentEpochStartTimeInSeconds()
        public
        view
        returns (uint64)
    {
        return currentEpochStartTimeInSeconds;
    }

    function getCurrentTimelockPeriodStartEpoch()
        public
        view
        returns (uint64)
    {
        return currentTimelockPeriodStartEpoch;
    }

    function getCurrentEpochEndTimeInSeconds()
        public
        view
        returns (uint64)
    {
        return getCurrentEpochStartTimeInSeconds() + getEpochPeriodInSeconds();
    }

    function getCurrentTimelockPeriodEndEpoch()
        public
        view
        returns (uint64)
    {
        return getCurrentTimelockPeriodStartEpoch() + getTimelockPeriodInEpochs();
    }

    function getCurrentEpoch()
        public
        view
        returns (uint64)
    {
        return currentEpoch;
    }

    function getCurrentTimelockPeriod()
        public
        view
        returns (uint64)
    {
        return currentTimelockPeriod;
    }

    function _goToNextEpoch()
        internal
    {
        // get current timestamp
        require(
            block.timestamp <= MAX_UINT_64,
            "BLOCK_TIMESTAMP_NOT_UINT_64"
        );
        uint64 currentBlockTimestamp = uint64(block.timestamp);

        // validate that we can increment the current epoch
        require(
            getCurrentEpochEndTimeInSeconds() <= currentBlockTimestamp,
            "BLOCK_TIMESTAMP_TOO_LOW"
        );

        // incremment epoch
        uint64 nextEpoch = currentEpoch + 1;
        currentEpoch = nextEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;

        // increment timelock period, if needed
        if (getCurrentTimelockPeriodEndEpoch() <= nextEpoch) {
            currentTimelockPeriod += 1;
            currentTimelockPeriodStartEpoch = currentEpoch;
        }
    }
}
