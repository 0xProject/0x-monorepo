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

import "../libs/LibSafeMath.sol";
import "../libs/LibSafeMath64Bit.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStructs.sol";

contract MixinEpoch is
    MixinConstants,
    MixinStorage
{

    using LibSafeMath for uint256;
    using LibSafeMath64Bit for uint64;

    /// @dev returns the current epoch in seconds
    function getEpochPeriodInSeconds()
        public
        pure
        returns (uint64)
    {
        return EPOCH_PERIOD_IN_SECONDS;
    }

    function getTimelockPeriodInEpochs()
        public
        pure
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
        return getCurrentEpochStartTimeInSeconds()._add(getEpochPeriodInSeconds());
    }

    function getCurrentTimelockPeriodEndEpoch()
        public
        view
        returns (uint64)
    {
        return getCurrentTimelockPeriodStartEpoch()._add(getTimelockPeriodInEpochs());
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
        // solium-disable-next-line security/no-block-members
        uint64 currentBlockTimestamp = block.timestamp._downcastToUint64();

        // validate that we can increment the current epoch
        require(
            getCurrentEpochEndTimeInSeconds() <= currentBlockTimestamp,
            "BLOCK_TIMESTAMP_TOO_LOW"
        );

        // incremment epoch
        uint64 nextEpoch = currentEpoch._add(1);
        currentEpoch = nextEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;

        // increment timelock period, if needed
        if (getCurrentTimelockPeriodEndEpoch() <= nextEpoch) {
            currentTimelockPeriod = currentTimelockPeriod._add(1);
            currentTimelockPeriodStartEpoch = currentEpoch;
        }
    }
}
