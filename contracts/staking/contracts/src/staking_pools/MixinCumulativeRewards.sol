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
    MixinStorage,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeBalances
{
    using LibSafeMath for uint256;

    /// @dev Initializes Cumulative Rewards for a given pool.
    function _initializeCumulativeRewards(bytes32 poolId)
        internal
    {
        uint256 currentEpoch = getCurrentEpoch();
        cumulativeRewardsByPool[poolId][currentEpoch] = IStructs.Fraction({numerator: 0, denominator: MIN_TOKEN_VALUE});
        cumulativeRewardsByPoolLastStored[poolId] = currentEpoch;
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

    function _unsetCumulativeReward(bytes32 poolId, uint256 epoch)
        internal
    {
        cumulativeRewardsByPool[poolId][epoch] = IStructs.Fraction({numerator: 0, denominator: 0});
    }

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

    function _recordDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        IStructs.CumulativeRewardInfo memory mostRecentCumulativeRewardInfo
    )
        internal
    {
        // record dependency
        cumulativeRewardsByPoolReferenceCounter[poolId][epoch] = cumulativeRewardsByPoolReferenceCounter[poolId][epoch].safeAdd(1);

        // ensure dependency has a value, otherwise copy it from the most recent reward
        if (!_isCumulativeRewardSet(cumulativeRewardsByPool[poolId][epoch])) {
            assert(epoch > mostRecentCumulativeRewardInfo.cumulativeRewardEpoch);
            cumulativeRewardsByPool[poolId][epoch] = mostRecentCumulativeRewardInfo.cumulativeReward;
            cumulativeRewardsByPoolLastStored[poolId] = epoch;
        }
    }

    function _unrecordDependencyOnCumulativeReward(
        bytes32 poolId,
        uint256 epoch,
        uint256 mostRecentCumulativeRewardEpoch
    )
        internal
    {
        // unrecord dependency
        uint256 newReferenceCounter = cumulativeRewardsByPoolReferenceCounter[poolId][epoch].safeSub(1);
        cumulativeRewardsByPoolReferenceCounter[poolId][epoch] = newReferenceCounter;

        // clear cumulative reward from state, if it is no longer needed
        if (newReferenceCounter == 0 && epoch < mostRecentCumulativeRewardEpoch) {
            _unsetCumulativeReward(poolId, epoch);
        }
    }

    /// @dev Records a reward for delegators. This adds to the `cumulativeRewardsByPool`.
    /// @param poolId Unique Id of pool.
    /// @param reward to record for delegators.
    /// @param amountOfDelegatedStake the amount of delegated stake that will split this reward.
    /// @param epoch at which this was earned.
    function _recordRewardForDelegators(
        bytes32 poolId,
        uint256 reward,
        uint256 amountOfDelegatedStake,
        uint256 epoch
    )
        internal
    {
        // cache a storage pointer to the cumulative rewards for `poolId` indexed by epoch.
        mapping (uint256 => IStructs.Fraction) storage cumulativeRewardsByPoolPtr = cumulativeRewardsByPool[poolId];

        // fetch the last epoch at which we stored an entry for this pool;
        // this is the most up-to-date cumulative rewards for this pool.
        uint256 cumulativeRewardsLastStored = cumulativeRewardsByPoolLastStored[poolId];
        IStructs.Fraction memory mostRecentCumulativeRewards = cumulativeRewardsByPoolPtr[cumulativeRewardsLastStored];

        // compute new cumulative reward
        (uint256 numerator, uint256 denominator) = LibFractions.addFractions(
            mostRecentCumulativeRewards.numerator,
            mostRecentCumulativeRewards.denominator,
            reward,
            amountOfDelegatedStake
        );

        // normalize fraction components by dividing by the min token value (10^18)
        (uint256 numeratorNormalized, uint256 denominatorNormalized) = (
            numerator.safeDiv(MIN_TOKEN_VALUE),
            denominator.safeDiv(MIN_TOKEN_VALUE)
        );

        // store cumulative rewards
        cumulativeRewardsByPoolPtr[epoch] = IStructs.Fraction({
            numerator: numeratorNormalized,
            denominator: denominatorNormalized
        });
        cumulativeRewardsByPoolLastStored[poolId] = epoch;
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
}
