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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../fees/MixinExchangeFees.sol";


contract MixinEpoch is
    IStakingEvents,
    MixinStorage,
    MixinExchangeFees
{
    using LibSafeMath for uint256;

    /// @dev Begins a new epoch, preparing the prior one for finalization.
    ///      Throws if not enough time has passed between epochs or if the
    ///      previous epoch was not fully finalized.
    ///      If there were no active pools in the closing epoch, the epoch
    ///      will be instantly finalized here. Otherwise, `finalizePool()`
    ///      should be called on each active pool afterwards.
    function endEpoch()
        external
    {
        // Use the block's timestampe to assert that we can end the current epoch.
        // solhint-disable-next-line not-rely-on-time
        uint256 currentBlockTimestamp = block.timestamp;
        uint256 epochEndTime = getCurrentEpochEarliestEndTimeInSeconds();
        if (epochEndTime > currentBlockTimestamp) {
            LibRichErrors.rrevert(LibStakingRichErrors.BlockTimestampTooLowError(
                epochEndTime,
                currentBlockTimestamp
            ));
        }

        // Increment epoch.
        uint256 oldEpoch = currentEpoch;
        uint256 newEpoch = oldEpoch.safeAdd(1);
        currentEpoch = newEpoch;
        currentEpochStartTimeInSeconds = currentBlockTimestamp;

        // When an epoch ends, we also end the current protocol fee period.
        _endProtocolFeePeriod(oldEpoch);

        // Notify that epoch has ended. Include relevant stats.
        emit EpochEnded(
            oldEpoch,
            _combinedStatsByEpoch[oldEpoch].poolsRemaining,
            _combinedStatsByEpoch[oldEpoch].rewardsAvailable,
            _combinedStatsByEpoch[oldEpoch].totalFeesCollected,
            _combinedStatsByEpoch[oldEpoch].totalWeightedStake
        );
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
        return currentEpochStartTimeInSeconds.safeAdd(epochDurationInSeconds);
    }

    /// @dev Initializes state owned by this mixin.
    ///      Fails if state was already initialized.
    function _initMixinEpoch()
        internal
    {
        // assert the current values before overwriting them.
        _assertMixinEpochNotInitialized();

        // solhint-disable-next-line
        currentEpochStartTimeInSeconds = block.timestamp;
    }

    /// @dev Assert MixinEpoch state before initializing it.
    /// This must be updated for each migration.
    function _assertMixinEpochNotInitialized()
        internal
        view
    {
        if (currentEpochStartTimeInSeconds != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InitializationError(
                    LibStakingRichErrors.InitializationErrorCodes.MixinEpochAlreadyInitialized
                )
            );
        }
    }
}
