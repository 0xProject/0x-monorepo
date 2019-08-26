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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeMath64.sol";
import "../libs/LibSafeDowncast.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStructs.sol";
import "../interfaces/IStakingEvents.sol";


/// @dev This mixin contains logic for time-based scheduling.
/// All processes in the system are segmented into time intervals, called epochs.
/// Epochs have a fixed minimum time period that is configured when this contract is deployed.
/// The current epoch only changes by calling this contract, which can be invoked by anyone.
/// Epochs serve as the basis for all other time intervals, which provides a more stable
/// and consistent scheduling metric than time. TimeLocks, for example, are measured in epochs.
contract MixinScheduler is
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage
{

    using LibSafeDowncast for uint256;
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
        return getCurrentEpochStartTimeInSeconds().safeAdd(getEpochDurationInSeconds());
    }

    /// @dev Returns the current timeLock period.
    /// @return TimeLock period.
    function getCurrentTimeLockPeriod()
        public
        view
        returns (uint64)
    {
        return currentTimeLockPeriod;
    }

    /// @dev Returns the length of a timeLock period, measured in epochs.
    ///      TimeLock period = [startEpoch..endEpoch)
    /// @return TimeLock period end.
    function getTimeLockDurationInEpochs()
        public
        pure
        returns (uint64)
    {
        return TIMELOCK_DURATION_IN_EPOCHS;
    }

    /// @dev Returns the epoch that the current timeLock period started at.
    ///      TimeLock period = [startEpoch..endEpoch)
    /// @return TimeLock period start.
    function getCurrentTimeLockPeriodStartEpoch()
        public
        view
        returns (uint64)
    {
        return currentTimeLockPeriodStartEpoch;
    }

    /// @dev Returns the epoch that the current timeLock period will end.
    ///      TimeLock period = [startEpoch..endEpoch)
    /// @return TimeLock period.
    function getCurrentTimeLockPeriodEndEpoch()
        public
        view
        returns (uint64)
    {
        return getCurrentTimeLockPeriodStartEpoch().safeAdd(getTimeLockDurationInEpochs());
    }

    /// @dev Moves to the next epoch, given the current epoch period has ended.
    ///      Time intervals that are measured in epochs (like timeLocks) are also incremented, given
    ///      their periods have ended.
    function _goToNextEpoch()
        internal
    {
        // get current timestamp
        // solhint-disable-next-line not-rely-on-time
        uint64 currentBlockTimestamp = block.timestamp.downcastToUint64();

        // validate that we can increment the current epoch
        uint64 epochEndTime = getCurrentEpochEarliestEndTimeInSeconds();
        if (epochEndTime > currentBlockTimestamp) {
            LibRichErrors.rrevert(LibStakingRichErrors.BlockTimestampTooLowError(
                epochEndTime,
                currentBlockTimestamp
            ));
        }

        // incremment epoch
        uint64 nextEpoch = currentEpoch.safeAdd(1);
        currentEpoch = nextEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;
        uint64 earliestEndTimeInSeconds = currentEpochStartTimeInSeconds.safeAdd(getEpochDurationInSeconds());
        
        // notify of epoch change
        emit EpochChanged(
            currentEpoch,
            currentEpochStartTimeInSeconds,
            earliestEndTimeInSeconds
        );

        // increment timeLock period, if needed
        if (getCurrentTimeLockPeriodEndEpoch() <= nextEpoch) {
            currentTimeLockPeriod = currentTimeLockPeriod.safeAdd(1);
            currentTimeLockPeriodStartEpoch = currentEpoch;
            uint64 endEpoch = currentEpoch.safeAdd(getTimeLockDurationInEpochs());
            
            // notify
            emit TimeLockPeriodChanged(
                currentTimeLockPeriod,
                currentTimeLockPeriodStartEpoch,
                endEpoch
            );
        }
    }
}
