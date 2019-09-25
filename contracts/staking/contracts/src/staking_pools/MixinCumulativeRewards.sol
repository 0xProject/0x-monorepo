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

    /// @dev Sets a cumulative reward for `poolId` at `epoch`.
    /// This can be used to overwrite an existing value.
    /// @param poolId Unique Id of pool.
    /// @param value Value of cumulative reward.
    function _forceSetCumulativeReward(
        bytes32 poolId,
        IStructs.Fraction memory value
    )
        internal
    {
        uint256 currentEpoch_ = currentEpoch;
        _cumulativeRewardsByPool[poolId][currentEpoch_] = value;

        // Check if we should do any work
        uint256 currentMostRecentEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        if (currentEpoch_ == currentMostRecentEpoch) {
            return;
        }

        // Update state to reflect the most recent cumulative reward
        _forceSetMostRecentCumulativeRewardEpoch(
            poolId,
            currentMostRecentEpoch,
            currentEpoch_
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
        // Sanity check if we can skip computation, as it will result in zero.
        if (memberStakeOverInterval == 0 || beginEpoch == endEpoch) {
            return 0;
        }

        // Sanity check interval
        require(beginEpoch < endEpoch, "CR_INTERVAL_INVALID");

        // Sanity check begin reward
        (IStructs.Fraction memory beginReward, uint256 beginRewardStoredAt) = _getCumulativeRewardAtEpoch(poolId, beginEpoch);
        (IStructs.Fraction memory endReward, uint256 endRewardStoredAt) = _getCumulativeRewardAtEpoch(poolId, endEpoch);

        // If the rewards were stored at the same epoch then the computation will result in zero.
        if (beginRewardStoredAt == endRewardStoredAt) {
            return 0;
        }

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

    /// @dev Fetch the cumulative reward for a given epoch.
    ///      If the corresponding CR does not exist in state, then we backtrack
    ///      to find its value by querying `epoch-1` and then most recent CR.
    /// @param poolId Unique ID of pool.
    /// @param epoch The epoch to find the
    /// @return cumulativeReward The cumulative reward for `poolId` at `epoch`.
    /// @return cumulativeRewardStoredAt Epoch that the `cumulativeReward` is stored at.
    function _getCumulativeRewardAtEpoch(bytes32 poolId, uint256 epoch)
        internal
        view
        returns (
            IStructs.Fraction memory cumulativeReward,
            uint256 cumulativeRewardStoredAt
        )
    {
        // Return CR at `epoch`, given it's set.
        cumulativeReward = _cumulativeRewardsByPool[poolId][epoch];
        if (_isCumulativeRewardSet(cumulativeReward)) {
            return (cumulativeReward, epoch);
        }

        // Return CR at `epoch-1`, given it's set.
        uint256 lastEpoch = epoch.safeSub(1);
        cumulativeReward = _cumulativeRewardsByPool[poolId][lastEpoch];
        if (_isCumulativeRewardSet(cumulativeReward)) {
            return (cumulativeReward, lastEpoch);
        }

        // Return the most recent CR, given it's less than `epoch`.
        uint256 mostRecentEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        if (mostRecentEpoch < epoch) {
            cumulativeReward = _cumulativeRewardsByPool[poolId][mostRecentEpoch];
            if (_isCumulativeRewardSet(cumulativeReward)) {
                return (cumulativeReward, mostRecentEpoch);
            }
        }

        // Could not find a CR for `epoch`
        revert("CR_INVALID_EPOCH");
    }
}
