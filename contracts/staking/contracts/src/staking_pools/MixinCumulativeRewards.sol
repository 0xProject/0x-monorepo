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
    function _initializeCumulativeRewards(bytes32 poolId)
        internal
    {
        uint256 currentEpoch = getCurrentEpoch();
        _setCumulativeReward(poolId, currentEpoch, IStructs.Fraction({numerator: 0, denominator: MIN_TOKEN_VALUE}));
        _setMostRecentCumulativeReward(poolId, currentEpoch);
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

    /// @dev Sets a cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique Id of pool.
    /// @param epoch of cumulative reward.
    /// @param value of cumulative reward.
    function _setCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction memory value
    )
        internal
    {
        cumulativeRewardsByPool[poolId][epoch] = value;
    }

    /// @dev Unsets the cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique id of pool.
    /// @param epoch of cumulative reward to unset.
    function _unsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        assert(cumulativeRewardsByPoolReferenceCounter[poolId][epoch] == 0);
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

    /// @dev Adds a dependency on a cumulative reward for a given epoch.
    /// @param poolId Unique Id of pool.
    /// @param epoch to remove dependency from.
    /// @param mostRecentCumulativeRewardInfo Epoch of the most recent cumulative reward.
    /// @param isDependent still FGREG EEGGEGREG
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
                epoch,
                mostRecentCumulativeRewardInfo.cumulativeRewardEpoch
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

        // ensure dependency has a value, otherwise copy it from the most recent reward
        if (!_isCumulativeRewardSet(cumulativeRewardsByPool[poolId][epoch])) {
            _setCumulativeReward(poolId, epoch, mostRecentCumulativeRewardInfo.cumulativeReward);
            _setMostRecentCumulativeReward(poolId, epoch);
        }
    }

    /// @dev Removes a dependency on a cumulative reward for a given epoch.
    /// @param poolId Unique Id of pool.
    /// @param epoch to remove dependency from.
    /// @param mostRecentCumulativeRewardEpoch Epoch of the most recent cumulative reward.
    function _removeDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        uint256 mostRecentCumulativeRewardEpoch
    )
        internal
    {
        // remove dependency by decreasing reference counter
        uint256 newReferenceCounter = cumulativeRewardsByPoolReferenceCounter[poolId][epoch].safeSub(1);
        cumulativeRewardsByPoolReferenceCounter[poolId][epoch] = newReferenceCounter;

        // clear cumulative reward from state, if it is no longer needed
        if (newReferenceCounter == 0 && epoch < mostRecentCumulativeRewardEpoch) {
            _unsetCumulativeReward(poolId, epoch);
        }
    }

    /// @dev Computes a member's reward over a given epoch interval.
    /// @param poolId Uniqud Id of pool.
    /// @param memberStakeOverInterval Stake delegated to pool by meber over the interval.
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
        // sanity check
        if (memberStakeOverInterval == 0) {
            return 0;
        }

        // compute reward
        IStructs.Fraction memory beginRatio = cumulativeRewardsByPool[poolId][beginEpoch];
        IStructs.Fraction memory endRatio = cumulativeRewardsByPool[poolId][endEpoch];
        uint256 reward = LibFractions.scaleFractionalDifference(
            endRatio.numerator,
            endRatio.denominator,
            beginRatio.numerator,
            beginRatio.denominator,
            memberStakeOverInterval
        );
        return reward;
    }

    /// @dev Sets the most recent cumulative reward for the pool.
    /// @param poolId Unique Id of pool.
    /// @param epoch The epoch of the most recent cumulative reward.
    function _setMostRecentCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        // load the current value, sanity check that we're not trying to go back in time
        uint256 currentMostRecentEpoch = cumulativeRewardsByPoolLastStored[poolId];
        assert(epoch >= currentMostRecentEpoch);

        // check if we should do any work
        if (epoch == currentMostRecentEpoch) {
            return;
        }

        // unset the current most recent reward if it has no more references
        if (cumulativeRewardsByPoolReferenceCounter[poolId][currentMostRecentEpoch] == 0) {
            _unsetCumulativeReward(poolId, currentMostRecentEpoch);
        }

        // update state to reflect the most recent cumulative reward
        cumulativeRewardsByPoolLastStored[poolId] = epoch;
    }
}
