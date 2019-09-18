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

import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibCobbDouglas.sol";
import "../libs/LibStakingRichErrors.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinDeploymentConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "../interfaces/IStructs.sol";
import "../stake/MixinStakeBalances.sol";
import "../staking_pools/MixinStakingPool.sol";
import "./MixinScheduler.sol";


/// @dev This mixin contains functions related to finalizing epochs.
///      Finalization occurs AFTER the current epoch is ended/advanced and
///      over (potentially) multiple blocks/transactions. This pattern prevents
///      the contract from stalling while we finalize rewards for the previous
///      epoch.
contract MixinFinalizer is
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    MixinDeploymentConstants,
    Ownable,
    MixinStorage,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances,
    MixinCumulativeRewards,
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

    /// @dev Begins a new epoch, preparing the prior one for finalization.
    ///      Throws if not enough time has passed between epochs or if the
    ///      previous epoch was not fully finalized.
    ///      If there were no active pools in the closing epoch, the epoch
    ///      will be instantly finalized here. Otherwise, `finalizePools()`
    ///      should be called on each active pool afterwards.
    /// @return _unfinalizedPoolsRemaining The number of unfinalized pools.
    function endEpoch()
        external
        returns (uint256 _unfinalizedPoolsRemaining)
    {
        uint256 closingEpoch = currentEpoch;

        // Make sure the previous epoch has been fully finalized.
        if (unfinalizedPoolsRemaining != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.PreviousEpochNotFinalizedError(
                    closingEpoch.safeSub(1),
                    unfinalizedPoolsRemaining
                )
            );
        }

        // Unrwap any WETH protocol fees.
        _unwrapWETH();

        // Populate finalization state.
        unfinalizedPoolsRemaining =
            _unfinalizedPoolsRemaining = numActivePoolsThisEpoch;
        unfinalizedRewardsAvailable = address(this).balance;
        unfinalizedTotalFeesCollected = totalFeesCollectedThisEpoch;
        unfinalizedTotalWeightedStake = totalWeightedStakeThisEpoch;
        totalRewardsPaidLastEpoch = 0;

        // Emit an event.
        emit EpochEnded(
            closingEpoch,
            unfinalizedPoolsRemaining,
            unfinalizedRewardsAvailable,
            unfinalizedTotalFeesCollected,
            unfinalizedTotalWeightedStake
        );

        // Reset current epoch state.
        totalFeesCollectedThisEpoch = 0;
        totalWeightedStakeThisEpoch = 0;
        numActivePoolsThisEpoch = 0;

        // Advance the epoch. This will revert if not enough time has passed.
        _goToNextEpoch();

        // If there were no active pools, the epoch is already finalized.
        if (unfinalizedPoolsRemaining == 0) {
            emit EpochFinalized(closingEpoch, 0, unfinalizedRewardsAvailable);
        }
    }

    /// @dev Finalizes pools that were active in the previous epoch, paying out
    ///      rewards to the reward and eth vault. Keepers should call this
    ///      function repeatedly until all active pools that were emitted in in
    ///      a `StakingPoolActivated` in the prior epoch have been finalized.
    ///      Pools that have already been finalized will be silently ignored.
    ///      We deliberately try not to revert here in case multiple parties
    ///      are finalizing pools.
    /// @param poolIds List of active pool IDs to finalize.
    /// @return _unfinalizedPoolsRemaining The number of unfinalized pools left.
    function finalizePools(bytes32[] calldata poolIds)
        external
        returns (uint256 _unfinalizedPoolsRemaining)
    {
        uint256 epoch = currentEpoch;
        // There are no pools to finalize at epoch 0.
        if (epoch == 0) {
            return _unfinalizedPoolsRemaining = 0;
        }

        uint256 poolsRemaining = unfinalizedPoolsRemaining;
        // If there are no more unfinalized pools remaining, there's nothing
        // to do.
        if (poolsRemaining == 0) {
            return _unfinalizedPoolsRemaining = 0;
        }

        // Pointer to the active pools in the last epoch.
        mapping(bytes32 => IStructs.ActivePool) storage activePools =
            _getActivePoolsFromEpoch(epoch - 1);
        uint256 numPoolIds = poolIds.length;
        uint256 rewardsPaid = 0;
        uint256 totalOperatorRewardsPaid = 0;
        uint256 totalMembersRewardsPaid = 0;

        for (uint256 i = 0; i != numPoolIds && poolsRemaining != 0; ++i)
        {
            bytes32 poolId = poolIds[i];
            IStructs.ActivePool memory pool = activePools[poolId];

            // Ignore pools that aren't active.
            if (pool.feesCollected == 0) {
                continue;
            }

            (uint256 operatorReward, uint256 membersReward) =
                _creditRewardsToPool(epoch, poolId, pool, rewardsPaid);

            totalOperatorRewardsPaid =
                totalOperatorRewardsPaid.safeAdd(operatorReward);
            totalMembersRewardsPaid =
                totalMembersRewardsPaid.safeAdd(membersReward);

            rewardsPaid = rewardsPaid
                .safeAdd(operatorReward)
                .safeAdd(membersReward);

            // Decrease the number of unfinalized pools left.
            poolsRemaining = poolsRemaining.safeSub(1);
        }

        // Update finalization states.
        if (rewardsPaid != 0) {
            totalRewardsPaidLastEpoch =
                totalRewardsPaidLastEpoch.safeAdd(rewardsPaid);
        }
        unfinalizedPoolsRemaining = _unfinalizedPoolsRemaining = poolsRemaining;

        // If there are no more unfinalized pools remaining, the epoch is
        // finalized.
        if (poolsRemaining == 0) {
            emit EpochFinalized(
                epoch - 1,
                totalRewardsPaidLastEpoch,
                unfinalizedRewardsAvailable.safeSub(totalRewardsPaidLastEpoch)
            );
        }

        // Deposit all the rewards at once.
        if (rewardsPaid != 0) {
            _depositStakingPoolRewards(totalOperatorRewardsPaid, totalMembersRewardsPaid);
        }
    }

    /// @dev Instantly finalizes a single pool that was active in the previous
    ///      epoch, crediting it rewards and sending those rewards to the reward
    ///      and eth vault. This can be called by internal functions that need
    ///      to finalize a pool immediately. Does nothing if the pool is already
    ///      finalized. Does nothing if the pool was not active or was already
    ///      finalized.
    /// @param poolId The pool ID to finalize.
    /// @return operatorReward The reward credited to the pool operator.
    /// @return membersReward The reward credited to the pool members.
    /// @return membersStake The total stake for all non-operator members in
    ///         this pool.
    function _finalizePool(bytes32 poolId)
        internal
        returns (
            uint256 operatorReward,
            uint256 membersReward,
            uint256 membersStake
        )
    {
        uint256 epoch = currentEpoch;
        // There are no pools to finalize at epoch 0.
        if (epoch == 0) {
            return (operatorReward, membersReward, membersStake);
        }

        IStructs.ActivePool memory pool =
            _getActivePoolFromEpoch(epoch - 1, poolId);
        // Do nothing if the pool was not active (has no fees).
        if (pool.feesCollected == 0) {
            return (operatorReward, membersReward, membersStake);
        }

        (operatorReward, membersReward) =
            _creditRewardsToPool(epoch, poolId, pool, 0);
        uint256 totalReward = operatorReward.safeAdd(membersReward);

        if (totalReward > 0) {
            totalRewardsPaidLastEpoch =
                totalRewardsPaidLastEpoch.safeAdd(totalReward);
            _depositStakingPoolRewards(operatorReward, membersReward);
        }

        // Decrease the number of unfinalized pools left.
        uint256 poolsRemaining = unfinalizedPoolsRemaining;
        unfinalizedPoolsRemaining = poolsRemaining = poolsRemaining.safeSub(1);

        // If there are no more unfinalized pools remaining, the epoch is
        // finalized.
        if (poolsRemaining == 0) {
            emit EpochFinalized(
                epoch - 1,
                totalRewardsPaidLastEpoch,
                unfinalizedRewardsAvailable.safeSub(totalRewardsPaidLastEpoch)
            );
        }
        membersStake = pool.membersStake;
    }

    /// @dev Computes the reward owed to a pool during finalization.
    ///      Does nothing if the pool is already finalized.
    /// @param poolId The pool's ID.
    /// @return operatorReward The reward owed to the pool operator.
    /// @return membersStake The total stake for all non-operator members in
    ///         this pool.
    function _getUnfinalizedPoolRewards(bytes32 poolId)
        internal
        view
        returns (
            uint256 reward,
            uint256 membersStake
        )
    {
        uint256 epoch = currentEpoch;
        // There are no pools to finalize at epoch 0.
        if (epoch == 0) {
            return (reward, membersStake);
        }
        IStructs.ActivePool memory pool =
            _getActivePoolFromEpoch(epoch - 1, poolId);
        reward = _getUnfinalizedPoolRewards(pool, 0);
        membersStake = pool.membersStake;
    }

    /// @dev Get an active pool from an epoch by its ID.
    /// @param epoch The epoch the pool was/will be active in.
    /// @param poolId The ID of the pool.
    /// @return pool The pool with ID `poolId` that was active in `epoch`.
    function _getActivePoolFromEpoch(
        uint256 epoch,
        bytes32 poolId
    )
        internal
        view
        returns (IStructs.ActivePool memory pool)
    {
        pool = _getActivePoolsFromEpoch(epoch)[poolId];
    }

    /// @dev Get a mapping of active pools from an epoch.
    ///      This uses the formula `epoch % 2` as the epoch index in order
    ///      to reuse state, because we only need to remember, at most, two
    ///      epochs at once.
    /// @return activePools The pools that were active in `epoch`.
    function _getActivePoolsFromEpoch(
        uint256 epoch
    )
        internal
        view
        returns (mapping (bytes32 => IStructs.ActivePool) storage activePools)
    {
        activePools = _activePoolsByEpoch[epoch % 2];
    }

    /// @dev Converts the entire WETH balance of the contract into ETH.
    function _unwrapWETH()
        internal
    {
        uint256 wethBalance = IEtherToken(WETH_ADDRESS)
            .balanceOf(address(this));
        if (wethBalance != 0) {
            IEtherToken(WETH_ADDRESS).withdraw(wethBalance);
        }
    }

    /// @dev Computes the reward owed to a pool during finalization.
    /// @param pool The active pool.
    /// @param unpaidRewards Rewards that have been credited but not finalized.
    /// @return rewards Unfinalized rewards for this pool.
    function _getUnfinalizedPoolRewards(
        IStructs.ActivePool memory pool,
        uint256 unpaidRewards
    )
        private
        view
        returns (uint256 rewards)
    {
        // There can't be any rewards if the pool was active or if it has
        // no stake.
        if (pool.feesCollected == 0) {
            return rewards = 0;
        }

        uint256 unfinalizedRewardsAvailable_ = unfinalizedRewardsAvailable;
        // Use the cobb-douglas function to compute the total reward.
        rewards = LibCobbDouglas._cobbDouglas(
            unfinalizedRewardsAvailable_,
            pool.feesCollected,
            unfinalizedTotalFeesCollected,
            pool.weightedStake,
            unfinalizedTotalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );

        // Clip the reward to always be under
        // `unfinalizedRewardsAvailable - totalRewardsPaid - unpaidRewards`,
        // in case cobb-douglas overflows, which should be unlikely.
        uint256 rewardsRemaining = unfinalizedRewardsAvailable_
            .safeSub(totalRewardsPaidLastEpoch)
            .safeSub(unpaidRewards);
        if (rewardsRemaining < rewards) {
            rewards = rewardsRemaining;
        }
    }

    /// @dev Credits finalization rewards to a pool that was active in the
    ///      last epoch.
    /// @param epoch The current epoch.
    /// @param poolId The pool ID to finalize.
    /// @param pool The active pool to finalize.
    /// @param unpaidRewards Rewards that have been credited but not finalized.
    /// @return rewards Rewards.
    /// @return operatorReward The reward credited to the pool operator.
    /// @return membersReward The reward credited to the pool members.
    function _creditRewardsToPool(
        uint256 epoch,
        bytes32 poolId,
        IStructs.ActivePool memory pool,
        uint256 unpaidRewards
    )
        private
        returns (uint256 operatorReward, uint256 membersReward)
    {
        // Clear the pool state so we don't finalize it again, and to recoup
        // some gas.
        delete _getActivePoolsFromEpoch(epoch - 1)[poolId];

        // Compute the rewards.
        uint256 rewards = _getUnfinalizedPoolRewards(pool, unpaidRewards);

        // Credit the pool.
        // Note that we credit at the CURRENT epoch even though these rewards
        // were earned in the previous epoch.
        (operatorReward, membersReward) = _recordStakingPoolRewards(
            poolId,
            rewards,
            pool.membersStake
        );

        // Emit an event.
        emit RewardsPaid(
            epoch,
            poolId,
            operatorReward,
            membersReward
        );
    }
}
