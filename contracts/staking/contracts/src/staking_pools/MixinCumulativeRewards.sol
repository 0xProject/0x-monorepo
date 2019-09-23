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
import "../stake/MixinStakeBalances.sol";


contract MixinCumulativeRewards is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage,
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
        // Sets the default cumulative reward
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
        // We use the denominator as a proxy for whether the cumulative
        // reward is set, as setting the cumulative reward always sets this
        // field to at least 1.
        return cumulativeReward.denominator != 0;
    }

    /// @dev Tries to set a cumulative reward for `poolId` at `epoch`.
    /// @param poolId Unique Id of pool.
    /// @param epoch Epoch of cumulative reward.
    /// @param value Value of cumulative reward.
    function _trySetCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction memory value
    )
        internal
    {
        // Do nothing if it's in the past since we don't want to
        // rewrite history.
        if (epoch < currentEpoch
            && _isCumulativeRewardSet(_cumulativeRewardsByPool[poolId][epoch]))
        {
            return;
        }
        _forceSetCumulativeReward(poolId, epoch, value);
    }

    /// @dev Sets a cumulative reward for `poolId` at `epoch`.
    /// This can be used to overwrite an existing value.
    /// @param poolId Unique Id of pool.
    /// @param epoch Epoch of cumulative reward.
    /// @param value Value of cumulative reward.
    function _forceSetCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.Fraction memory value
    )
        internal
    {
        _cumulativeRewardsByPool[poolId][epoch] = value;

        // Never set the most recent reward epoch to one in the future, because
        // it may get removed if there are no more dependencies on it.
        if (epoch <= currentEpoch) {
            _trySetMostRecentCumulativeRewardEpoch(poolId, epoch);
        }
    }

    /// @dev Tries to set the epoch of the most recent cumulative reward.
    ///      The value will only be set if the input epoch is greater than the
    ///     current most recent value.
    /// @param poolId Unique Id of pool.
    /// @param epoch Epoch of the most recent cumulative reward.
    function _trySetMostRecentCumulativeRewardEpoch(
        bytes32 poolId,
        uint256 epoch
    )
        internal
    {
        // Check if we should do any work
        uint256 currentMostRecentEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        if (epoch == currentMostRecentEpoch) {
            return;
        }

        // Update state to reflect the most recent cumulative reward
        _forceSetMostRecentCumulativeRewardEpoch(
            poolId,
            currentMostRecentEpoch,
            epoch
        );
    }

    /// @dev Forcefully sets the epoch of the most recent cumulative reward.
    /// @param poolId Unique Id of pool.
    /// @param currentMostRecentEpoch Epoch of the most recent cumulative
    ///        reward.
    /// @param newMostRecentEpoch Epoch of the new most recent cumulative
    ///        reward.
    function _forceSetMostRecentCumulativeRewardEpoch(
        bytes32 poolId,
        uint256 currentMostRecentEpoch,
        uint256 newMostRecentEpoch
    )
        internal
    {
        // Sanity check that we're not trying to go back in time
        assert(newMostRecentEpoch >= currentMostRecentEpoch);
        _cumulativeRewardsByPoolLastStored[poolId] = newMostRecentEpoch;
    }

    /// @dev Computes a member's reward over a given epoch interval.
    /// @param poolId Uniqud Id of pool.
    /// @param memberStakeOverInterval Stake delegated to pool by member over
    ///        the interval.
    /// @param beginEpoch Beginning of interval.
    /// @param endEpoch End of interval.
    /// @return rewards Reward accumulated over interval [beginEpoch, endEpoch]
    function _computeMemberRewardOverInterval(
        bytes32 poolId,
        uint256 memberStakeOverInterval,
        uint256 beginEpoch,
        uint256 endEpoch
    )
        internal
        view
        returns (uint256 reward)
    {
        if (memberStakeOverInterval == 0) {
            return 0;
        }

        // Sanity check interval
        require(beginEpoch <= endEpoch, "CR_INTERVAL_INVALID");

        // Sanity check begin reward
        IStructs.Fraction memory beginReward =
            _cumulativeRewardsByPool[poolId][beginEpoch];
        require(_isCumulativeRewardSet(beginReward), "CR_INTERVAL_INVALID_BEGIN");

        // Sanity check end reward
        IStructs.Fraction memory endReward =
            _cumulativeRewardsByPool[poolId][endEpoch];
        require(_isCumulativeRewardSet(endReward), "CR_INTERVAL_INVALID_END");

        // Compute reward
        reward = LibFractions.scaleDifference(
            endReward.numerator,
            endReward.denominator,
            beginReward.numerator,
            beginReward.denominator,
            memberStakeOverInterval
        );
    }

    /// @dev Fetch the most recent cumulative reward entry for a pool.
    /// @param poolId Unique ID of pool.
    /// @return cumulativeReward The most recent cumulative reward `poolId`.
    function _getMostRecentCumulativeReward(bytes32 poolId)
        internal
        view
        returns (IStructs.Fraction memory cumulativeReward)
    {
        uint256 lastStoredEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        return _cumulativeRewardsByPool[poolId][lastStoredEpoch];
    }
}
