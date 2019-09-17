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

import "@0x/contracts-utils/contracts/src/LibFractions.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../stake/MixinStakeBalances.sol";
import "./MixinStakingPoolRewardVault.sol";


contract MixinCumulativeRewards is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinZrxVault,
    MixinStakingPoolRewardVault,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances
{
    using LibSafeMath for uint256;

    /// @dev Initializes Cumulative Rewards for a given pool.
    /// @param poolId Unique id of pool.
    function _initializeCumulativeRewards(bytes32 poolId)
        internal
    {
        uint256 currentEpoch = getCurrentEpoch();
        // sets the default cumulative reward
        _forceSetCumulativeReward(
            poolId,
            currentEpoch,
            IStructs.Fraction({
                numerator: 0,
                denominator: MIN_TOKEN_VALUE
            })
        );
    }

    /// @dev returns true iff Cumulative Rewards are set
    function _isCumulativeRewardSet(IStructs.Fraction memory cumulativeReward)
        internal
        pure
        returns (bool)
    {
        // we use the denominator as a proxy for whether the cumulative
        // reward is set, as setting the cumulative reward always sets this
        // field to at least 1.
        return cumulativeReward.denominator != 0;
    }

    /// Returns true iff the cumulative reward for `poolId` at `epoch` can be unset.
    /// @param poolId Unique id of pool.
    /// @param epoch of the cumulative reward.
    function _canUnsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
        view
        returns (bool)
    {
        return (
            _isCumulativeRewardSet(cumulativeRewardsByPool[poolId][epoch]) &&   // is there a value to unset
            cumulativeRewardsByPoolReferenceCounter[poolId][epoch] == 0 &&      // no references to this CR
            cumulativeRewardsByPoolLastStored[poolId] > epoch                   // this is *not* the most recent CR
        );
    }

    /// @dev Tries to set a cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique Id of pool.
    /// @param epoch of cumulative reward.
    /// @param value of cumulative reward.
    function _trySetCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction memory value
    )
        internal
    {
        if (_isCumulativeRewardSet(cumulativeRewardsByPool[poolId][epoch])) {
            // do nothing; we don't want to override the current value
            return;
        }
        _forceSetCumulativeReward(poolId, epoch, value);
    }

    /// @dev Sets a cumulative reward for `poolId` at `epoch`.
    /// This can be used to overwrite an existing value.
    /// @param poolId Unique Id of pool.
    /// @param epoch of cumulative reward.
    /// @param value of cumulative reward.
    function _forceSetCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction memory value
    )
        internal
    {
        cumulativeRewardsByPool[poolId][epoch] = value;
        _trySetMostRecentCumulativeRewardEpoch(poolId, epoch);
    }

    /// @dev Tries to unset the cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique id of pool.
    /// @param epoch of cumulative reward to unset.
    function _tryUnsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        if (!_canUnsetCumulativeReward(poolId, epoch)) {
            return;
        }
        _forceUnsetCumulativeReward(poolId, epoch);
    }

    /// @dev Unsets the cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique id of pool.
    /// @param epoch of cumulative reward to unset.
    function _forceUnsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        cumulativeRewardsByPool[poolId][epoch] = IStructs.Fraction({numerator: 0, denominator: 0});
    }

    /// @dev Returns info on most recent cumulative reward.
    function _getMostRecentCumulativeRewardInfo(bytes32 poolId)
        internal
        returns (IStructs.CumulativeRewardInfo memory)
    {
        // fetch the last epoch at which we stored a cumulative reward for this pool
        uint256 cumulativeRewardsLastStored = cumulativeRewardsByPoolLastStored[poolId];

        // query and return cumulative reward info for this pool
        return IStructs.CumulativeRewardInfo({
            cumulativeReward: cumulativeRewardsByPool[poolId][cumulativeRewardsLastStored],
            cumulativeRewardEpoch: cumulativeRewardsLastStored
        });
    }

    /// @dev Tries to set the epoch of the most recent cumulative reward.
    /// The value will only be set if the input epoch is greater than the current
    /// most recent value.
    /// @param poolId Unique Id of pool.
    /// @param epoch of the most recent cumulative reward.
    function _trySetMostRecentCumulativeRewardEpoch(bytes32 poolId, uint256 epoch)
        internal
    {
        // check if we should do any work
        uint256 currentMostRecentEpoch = cumulativeRewardsByPoolLastStored[poolId];
        if (epoch == currentMostRecentEpoch) {
            return;
        }

        // update state to reflect the most recent cumulative reward
        _forceSetMostRecentCumulativeRewardEpoch(
            poolId,
            currentMostRecentEpoch,
            epoch
        );
    }

    /// @dev Forcefully sets the epoch of the most recent cumulative reward.
    /// @param poolId Unique Id of pool.
    /// @param currentMostRecentEpoch of the most recent cumulative reward.
    /// @param newMostRecentEpoch of the new most recent cumulative reward.
    function _forceSetMostRecentCumulativeRewardEpoch(
        bytes32 poolId,
        uint256 currentMostRecentEpoch,
        uint256 newMostRecentEpoch
    )
        internal
    {
        // sanity check that we're not trying to go back in time
        assert(newMostRecentEpoch >= currentMostRecentEpoch);
        cumulativeRewardsByPoolLastStored[poolId] = newMostRecentEpoch;

        // unset the previous most recent reward, if it is no longer needed
        _tryUnsetCumulativeReward(poolId, currentMostRecentEpoch);
    }

    /// @dev Adds a dependency on a cumulative reward for a given epoch.
    /// @param poolId Unique Id of pool.
    /// @param epoch to remove dependency from.
    /// @param mostRecentCumulativeRewardInfo Info for the most recent cumulative reward (value and epoch)
    /// @param isDependent True iff there is a dependency on the cumulative reward for `poolId` at `epoch`
    function _addOrRemoveDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.CumulativeRewardInfo memory mostRecentCumulativeRewardInfo,
        bool isDependent
    )
        internal
    {
        if (isDependent) {
            _addDependencyOnCumulativeReward(
                poolId,
                epoch,
                mostRecentCumulativeRewardInfo
            );
        } else {
            _removeDependencyOnCumulativeReward(
                poolId,
                epoch
            );
        }
    }

    /// @dev Adds a dependency on a cumulative reward for a given epoch.
    /// @param poolId Unique Id of pool.
    /// @param epoch to remove dependency from.
    /// @param mostRecentCumulativeRewardInfo Info on the most recent cumulative reward.
    function _addDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.CumulativeRewardInfo memory mostRecentCumulativeRewardInfo
    )
        internal
    {
        // add dependency by increasing the reference counter
        cumulativeRewardsByPoolReferenceCounter[poolId][epoch] = cumulativeRewardsByPoolReferenceCounter[poolId][epoch].safeAdd(1);

        // set CR to most recent reward (if it is not already set)
        _trySetCumulativeReward(
            poolId,
            epoch,
            mostRecentCumulativeRewardInfo.cumulativeReward
        );
    }

    /// @dev Removes a dependency on a cumulative reward for a given epoch.
    /// @param poolId Unique Id of pool.
    /// @param epoch to remove dependency from.
    function _removeDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch
    )
        internal
    {
        // remove dependency by decreasing reference counter
        uint256 newReferenceCounter = cumulativeRewardsByPoolReferenceCounter[poolId][epoch].safeSub(1);
        cumulativeRewardsByPoolReferenceCounter[poolId][epoch] = newReferenceCounter;

        // clear cumulative reward from state, if it is no longer needed
        _tryUnsetCumulativeReward(poolId, epoch);
    }

    /// @dev Computes a member's reward over a given epoch interval.
    /// @param poolId Uniqud Id of pool.
    /// @param memberStakeOverInterval Stake delegated to pool by member over the interval.
    /// @param beginEpoch beginning of interval.
    /// @param endEpoch end of interval.
    /// @return rewards accumulated over interval [beginEpoch, endEpoch]
    function _computeMemberRewardOverInterval(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        internal
        view
        returns (uint256)
    {
        // sanity check inputs
        if (memberStakeOverInterval == 0) {
            return 0;
        }

        // sanity check interval
        if (beginEpoch >= endEpoch) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.CumulativeRewardIntervalError(
                    LibStakingRichErrors.CumulativeRewardIntervalErrorCode.BeginEpochMustBeLessThanEndEpoch,
                    poolId,
                    beginEpoch,
                    endEpoch
                )
            );
        }

        // sanity check begin reward
        IStructs.Fraction memory beginReward = cumulativeRewardsByPool[poolId][beginEpoch];
        if (!_isCumulativeRewardSet(beginReward)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.CumulativeRewardIntervalError(
                    LibStakingRichErrors.CumulativeRewardIntervalErrorCode.BeginEpochDoesNotHaveReward,
                    poolId,
                    beginEpoch,
                    endEpoch
                )
            );
        }

        // sanity check end reward
        IStructs.Fraction memory endReward = cumulativeRewardsByPool[poolId][endEpoch];
        if (!_isCumulativeRewardSet(endReward)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.CumulativeRewardIntervalError(
                    LibStakingRichErrors.CumulativeRewardIntervalErrorCode.EndEpochDoesNotHaveReward,
                    poolId,
                    beginEpoch,
                    endEpoch
                )
            );
        }

        // compute reward
        uint256 reward = LibFractions.scaleFractionalDifference(
            endReward.numerator,
            endReward.denominator,
            beginReward.numerator,
            beginReward.denominator,
            memberStakeOverInterval
        );
        return reward;
    }
}
