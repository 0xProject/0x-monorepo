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
import "../libs/LibSafeMath64.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStructs.sol";
import "../interfaces/IStakingEvents.sol";


/// @dev This mixin contains logic for time-based scheduling.
/// All processes in the system are segmented into time intervals, called epochs.
/// Epochs have a fixed minimum time period that is configured when this contract is deployed.
/// The current epoch only changes by calling this contract, which can be invoked by anyone.
/// Epochs serve as the basis for all other time intervals, which provides a more stable
/// and consistent scheduling metric than time. Timelocks, for example, are measured in epochs.
contract MixinScheduler is
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage
{

    using LibSafeMath for uint256;
    using LibSafeMath64 for uint64;

    /// @dev Returns the current epoch.
    /// @return Epoch.
    function getCurrentEpoch()
        public
        view
        returns (uint64)
    {
        return currentEpoch;
    }

    /// @dev Returns the current epoch period, measured in seconds.
    ///      Epoch period = [startTimeInSeconds..endTimeInSeconds)
    /// @return Time in seconds.
    function getEpochDurationInSeconds()
        public
        pure
        returns (uint64)
    {
        return EPOCH_DURATION_IN_SECONDS;
    }

    /// @dev Returns the start time in seconds of the current epoch.
    ///      Epoch period = [startTimeInSeconds..endTimeInSeconds)
    /// @return Time in seconds.
    function getCurrentEpochStartTimeInSeconds()
        public
        view
        returns (uint64)
    {
        return currentEpochStartTimeInSeconds;
    }

    /// @dev Returns the earliest end time in seconds of this epoch.
    ///      The next epoch can begin once this time is reached.  
    ///      Epoch period = [startTimeInSeconds..endTimeInSeconds)
    /// @return Time in seconds.
    function getCurrentEpochEarliestEndTimeInSeconds()
        public
        view
        returns (uint64)
    {
        return getCurrentEpochStartTimeInSeconds()._add(getEpochDurationInSeconds());
    }

    /// @dev Returns the current timelock period.
    /// @return Timelock period.
    function getCurrentTimelockPeriod()
        public
        view
        returns (uint64)
    {
        return currentTimelockPeriod;
    }

    /// @dev Returns the length of a timelock period, measured in epochs.
    ///      Timelock period = [startEpoch..endEpoch)
    /// @return Timelock period end.
    function getTimelockDurationInEpochs()
        public
        pure
        returns (uint64)
    {
        return TIMELOCK_DURATION_IN_EPOCHS;
    }

    /// @dev Returns the epoch that the current timelock period started at.
    ///      Timelock period = [startEpoch..endEpoch)
    /// @return Timelock period start.
    function getCurrentTimelockPeriodStartEpoch()
        public
        view
        returns (uint64)
    {
        return currentTimelockPeriodStartEpoch;
    }

    /// @dev Returns the epoch that the current timelock period will end.
    ///      Timelock period = [startEpoch..endEpoch)
    /// @return Timelock period.
    function getCurrentTimelockPeriodEndEpoch()
        public
        view
        returns (uint64)
    {
        return getCurrentTimelockPeriodStartEpoch()._add(getTimelockDurationInEpochs());
    }

    /// @dev Moves to the next epoch, given the current epoch period has ended.
    ///      Time intervals that are measured in epochs (like timelocks) are also incremented, given
    ///      their periods have ended.
    function _goToNextEpoch()
        internal
    {
        // get current timestamp
        // solhint-disable-next-line not-rely-on-time
        uint64 currentBlockTimestamp = block.timestamp._downcastToUint64();

        // validate that we can increment the current epoch
        require(
            getCurrentEpochEarliestEndTimeInSeconds() <= currentBlockTimestamp,
            "BLOCK_TIMESTAMP_TOO_LOW"
        );

        // incremment epoch
        uint64 nextEpoch = currentEpoch._add(1);
        currentEpoch = nextEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;
        uint64 earliestEndTimeInSeconds = currentEpochStartTimeInSeconds._add(getEpochDurationInSeconds());
        
        // notify of epoch change
        emit EpochChanged(
            currentEpoch,
            currentEpochStartTimeInSeconds,
            earliestEndTimeInSeconds
        );

        // increment timelock period, if needed
        if (getCurrentTimelockPeriodEndEpoch() <= nextEpoch) {
            currentTimelockPeriod = currentTimelockPeriod._add(1);
            currentTimelockPeriodStartEpoch = currentEpoch;
            uint64 endEpoch = currentEpoch._add(getTimelockDurationInEpochs());
            
            // notify
            emit TimelockPeriodChanged(
                currentTimelockPeriod,
                currentTimelockPeriodStartEpoch,
                endEpoch
            );
        }
    }
}
