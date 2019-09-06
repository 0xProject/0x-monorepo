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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../immutable/MixinHyperParameters.sol";
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
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinHyperParameters
{
    using LibSafeMath for uint256;

    /// @dev Returns the current epoch.
    /// @return Epoch.
    function getCurrentEpoch()
        public
        view
        returns (uint256)
    {
        return currentEpoch;
    }

    /// @dev Returns the start time in seconds of the current epoch.
    ///      Epoch period = [startTimeInSeconds..endTimeInSeconds)
    /// @return Time in seconds.
    function getCurrentEpochStartTimeInSeconds()
        public
        view
        returns (uint256)
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
        returns (uint256)
    {
        return getCurrentEpochStartTimeInSeconds().safeAdd(epochDurationInSeconds);
    }

    /// @dev Initializes state owned by this mixin.
    ///      Fails if state was already initialized.
    function _initMixinScheduler()
        internal
    {
        if (currentEpochStartTimeInSeconds != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InitializationError(
                    LibStakingRichErrors.InitializationErrorCode.MixinSchedulerAlreadyInitialized
                )
            );
        }
        currentEpochStartTimeInSeconds = block.timestamp;
    }

    /// @dev Moves to the next epoch, given the current epoch period has ended.
    ///      Time intervals that are measured in epochs (like timeLocks) are also incremented, given
    ///      their periods have ended.
    function _goToNextEpoch()
        internal
    {
        // get current timestamp
        // solhint-disable-next-line not-rely-on-time
        uint256 currentBlockTimestamp = block.timestamp;

        // validate that we can increment the current epoch
        uint256 epochEndTime = getCurrentEpochEarliestEndTimeInSeconds();
        if (epochEndTime > currentBlockTimestamp) {
            LibRichErrors.rrevert(LibStakingRichErrors.BlockTimestampTooLowError(
                epochEndTime,
                currentBlockTimestamp
            ));
        }

        // incremment epoch
        uint256 nextEpoch = currentEpoch.safeAdd(1);
        currentEpoch = nextEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;
        uint256 earliestEndTimeInSeconds = currentEpochStartTimeInSeconds.safeAdd(
            epochDurationInSeconds
        );

        // notify of epoch change
        emit EpochChanged(
            currentEpoch,
            currentEpochStartTimeInSeconds,
            earliestEndTimeInSeconds
        );
    }
}
