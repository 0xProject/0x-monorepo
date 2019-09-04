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


contract MixinStakingPoolRewards is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinZrxVault,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeStorage,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @return totalReward Balance in ETH.
    function computeRewardBalanceOfDelegator(bytes32 poolId, address member)
        public
        view
        returns (uint256 totalReward)
    {
        // cache some values to reduce sloads
        IStructs.DelayedBalance memory delegatedStake = delegatedStakeToPoolByOwner[member][poolId];
        uint256 currentEpoch = getCurrentEpoch();

        // value is always zero in these two scenarios:
        //   1. The current epoch is zero: delegation begins at epoch 1
        //   2. The owner's delegated is current as of this epoch: their rewards have been moved to the ETH vault.
        if (currentEpoch == 0 || delegatedStake.lastStored == currentEpoch) return 0;

        // compute reward accumulated during `lastStored` epoch;
        // the `current` balance describes how much stake was collecting rewards when `lastStored` was set.
        uint256 rewardsAccumulatedDuringLastStoredEpoch = (delegatedStake.current != 0)
            ? _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.current,
                delegatedStake.lastStored - 1,
                delegatedStake.lastStored
            )
            : 0;

        // compute the rewards accumulated by the `next` balance;
        // this starts at `lastStored + 1` and goes up until the last epoch, during which
        // rewards were accumulated. This is at most the most recently finalized epoch (current epoch - 1).
        uint256 rewardsAccumulatedAfterLastStoredEpoch = (cumulativeRewardsByPoolLastStored[poolId] > delegatedStake.lastStored)
            ? _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.next,
                delegatedStake.lastStored,
                cumulativeRewardsByPoolLastStored[poolId]
            )
            : 0;

        // compute the total reward
        totalReward = rewardsAccumulatedDuringLastStoredEpoch.safeAdd(rewardsAccumulatedAfterLastStoredEpoch);
        return totalReward;
    }

    /// @dev Transfers a delegators accumulated rewards from the transient pool Reward Pool vault
    ///      to the Eth Vault. This is required before the member's stake in the pool can be
    ///      modified.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    function _transferDelegatorsAccumulatedRewardsToEthVault(bytes32 poolId, address member)
        internal
    {
        // there are no delegators in the first epoch
        uint256 currentEpoch = getCurrentEpoch();
        if (currentEpoch == 0) {
            return;
        }

        // compute balance owed to delegator
        uint256 balance = computeRewardBalanceOfDelegator(poolId, member);
        if (balance == 0) {
            return;
        }

        // transfer from transient Reward Pool vault to ETH Vault
        _transferMemberBalanceToEthVault(poolId, member, balance);
    }

    /// @dev Initializes Cumulative Rewards for a given pool.
    function _initializeCumulativeRewards(bytes32 poolId)
        internal
    {
        uint256 currentEpoch = getCurrentEpoch();
        cumulativeRewardsByPool[poolId][currentEpoch] = IStructs.Fraction({numerator: 0, denominator: MIN_TOKEN_VALUE});
        cumulativeRewardsByPoolLastStored[poolId] = currentEpoch;
    }

    /// @dev To compute a delegator's reward we must know the cumulative reward
    ///      at the epoch before they delegated. If they were already delegated then
    ///      we also need to know the value at the epoch in which they modified
    ///      their delegated stake for this pool. See `computeRewardBalanceOfDelegator`.
    /// @param poolId Unique Id of pool.
    /// @param epoch at which the stake was delegated by the delegator.
    function _syncCumulativeRewardsNeededByDelegator(bytes32 poolId, uint256 epoch)
        internal
    {
        // set default value if staking at epoch 0
        if (epoch == 0) {
            return;
        }

        // cache a storage pointer to the cumulative rewards for `poolId` indexed by epoch.
        mapping (uint256 => IStructs.Fraction) storage cumulativeRewardsByPoolPtr = cumulativeRewardsByPool[poolId];

        // fetch the last epoch at which we stored an entry for this pool;
        // this is the most up-to-date cumulative rewards for this pool.
        uint256 cumulativeRewardsLastStored = cumulativeRewardsByPoolLastStored[poolId];
        IStructs.Fraction memory mostRecentCumulativeRewards = cumulativeRewardsByPoolPtr[cumulativeRewardsLastStored];

        // copy our most up-to-date cumulative rewards for last epoch, if necessary.
        uint256 lastEpoch = currentEpoch.safeSub(1);
        if (cumulativeRewardsLastStored != lastEpoch) {
            cumulativeRewardsByPoolPtr[lastEpoch] = mostRecentCumulativeRewards;
            cumulativeRewardsByPoolLastStored[poolId] = lastEpoch;
        }

        // copy our most up-to-date cumulative rewards for last epoch, if necessary.
        // this is necessary if the pool does not earn any rewards this epoch;
        // if it does then this value may be overwritten when the epoch is finalized.
        if (!_isCumulativeRewardSet(cumulativeRewardsByPoolPtr[epoch])) {
            cumulativeRewardsByPoolPtr[epoch] = mostRecentCumulativeRewards;
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
        private
        view
        returns (uint256)
    {
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

    /// @dev returns true iff Cumulative Rewards are set
    function _isCumulativeRewardSet(IStructs.Fraction memory cumulativeReward)
        private
        returns (bool)
    {
        // we use the denominator as a proxy for whether the cumulative
        // reward is set, as setting the cumulative reward always sets this
        // field to at least 1.
        return cumulativeReward.denominator != 0;
    }
}
