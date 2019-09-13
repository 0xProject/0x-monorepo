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
import "../staking_pools/MixinStakingPoolRewardVault.sol";
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
    MixinZrxVault,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeStorage,
    MixinStakeBalances,
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
        uint256 closingEpoch = getCurrentEpoch();

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
    ///      rewards to the reward vault. Keepers should call this function
    ///      repeatedly until all active pools that were emitted in in a
    ///      `StakingPoolActivated` in the prior epoch have been finalized.
    ///      Pools that have already been finalized will be silently ignored.
    ///      We deliberately try not to revert here in case multiple parties
    ///      are finalizing pools.
    /// @param poolIds List of active pool IDs to finalize.
    /// @return _unfinalizedPoolsRemaining The number of unfinalized pools left.
    function finalizePools(bytes32[] calldata poolIds)
        external
        returns (uint256 _unfinalizedPoolsRemaining)
    {
        uint256 epoch = getCurrentEpoch();
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

        for (uint256 i = 0; i != numPoolIds && poolsRemaining != 0; ++i) {
            bytes32 poolId = poolIds[i];
            IStructs.ActivePool memory pool = activePools[poolId];

            // Ignore pools that aren't active.
            if (pool.feesCollected == 0) {
                continue;
            }

            // Clear the pool state so we don't finalize it again, and to
            // recoup some gas.
            delete activePools[poolId];

            // Credit the pool with rewards.
            // We will transfer the total rewards to the vault at the end.
            IStructs.PoolRewards memory poolRewards =
                _creditRewardToPool(poolId, pool);
            rewardsPaid = rewardsPaid.safeAdd(
                poolRewards.operatorReward + poolRewards.membersReward
            );

            // Decrease the number of unfinalized pools left.
            poolsRemaining = poolsRemaining.safeSub(1);

            // Emit an event.
            emit RewardsPaid(
                epoch,
                poolId,
                poolRewards.operatorReward,
                poolRewards.membersReward
            );
        }

        // Deposit all the rewards at once into the RewardVault.
        if (rewardsPaid != 0) {
            _depositIntoStakingPoolRewardVault(rewardsPaid);
        }

        // Update finalization states.
        totalRewardsPaidLastEpoch =
            totalRewardsPaidLastEpoch.safeAdd(rewardsPaid);
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
    }

    /// @dev Instantly finalizes a single pool that was active in the previous
    ///      epoch, crediting it rewards and sending those rewards to the reward
    ///      vault. This can be called by internal functions that need to
    ///      finalize a pool immediately. Does nothing if the pool is already
    ///      finalized.
    /// @param poolId The pool ID to finalize.
    /// @return rewards Rewards.
    /// @return rewards The rewards credited to the pool.
    function _finalizePool(bytes32 poolId)
        internal
        returns (IStructs.PoolRewards memory rewards)
    {
        uint256 epoch = getCurrentEpoch();
        // There are no pools to finalize at epoch 0.
        if (epoch == 0) {
            return rewards;
        }

        // Get the active pool.
        mapping (bytes32 => IStructs.ActivePool) storage activePools =
            _getActivePoolsFromEpoch(epoch - 1);
        IStructs.ActivePool memory pool = activePools[poolId];

        // Ignore pools that weren't active.
        if (pool.feesCollected == 0) {
            return rewards;
        }

        // Clear the pool state so we don't finalize it again, and to recoup
        // some gas.
        delete activePools[poolId];

        // Credit the pool with rewards.
        // We will transfer the total rewards to the vault at the end.
        rewards = _creditRewardToPool(poolId, pool);
        uint256 totalReward = rewards.membersReward + rewards.operatorReward;
        totalRewardsPaidLastEpoch =
            totalRewardsPaidLastEpoch.safeAdd(totalReward);

        // Decrease the number of unfinalized pools left.
        uint256 poolsRemaining =
            unfinalizedPoolsRemaining =
            unfinalizedPoolsRemaining.safeSub(1);

        // Emit an event.
        emit RewardsPaid(
            epoch,
            poolId,
            rewards.operatorReward,
            rewards.membersReward
        );

        // Deposit all the rewards at once into the RewardVault.
        _depositIntoStakingPoolRewardVault(totalReward);

        // If there are no more unfinalized pools remaining, the epoch is
        // finalized.
        if (poolsRemaining == 0) {
            emit EpochFinalized(
                epoch - 1,
                totalRewardsPaidLastEpoch,
                unfinalizedRewardsAvailable.safeSub(totalRewardsPaidLastEpoch)
            );
        }
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
        activePools = activePoolsByEpoch[epoch % 2];
    }

    /// @dev Computes the reward owed to a pool during finalization.
    ///      Does nothing if the pool is already finalized.
    /// @param poolId The pool's ID.
    /// @return rewards Amount of rewards for this pool.
    function _getUnfinalizedPoolReward(bytes32 poolId)
        internal
        view
        returns (IStructs.PoolRewards memory rewards)
    {
        uint256 epoch = getCurrentEpoch();
        // There can't be any rewards in the first epoch.
        if (epoch == 0) {
            return rewards;
        }

        IStructs.ActivePool memory pool =
            _getActivePoolFromEpoch(epoch - 1, poolId);
        // There can't be any rewards if the pool was active or if it has
        // no stake.
        if (pool.feesCollected == 0 || pool.weightedStake == 0) {
            return rewards;
        }

        // Use the cobb-douglas function to compute the total reward.
        uint256 totalReward = LibCobbDouglas._cobbDouglas(
            unfinalizedRewardsAvailable,
            pool.feesCollected,
            unfinalizedTotalFeesCollected,
            pool.weightedStake,
            unfinalizedTotalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenomintor
        );

        // Split the reward between the operator and delegators.
        if (pool.membersStake == 0) {
            rewards.operatorReward = totalReward;
        } else {
            (rewards.operatorReward, rewards.membersReward) =
                _splitAmountBetweenOperatorAndMembers(poolId, totalReward);
        }
        rewards.membersStake = pool.membersStake;
    }

    /// @dev Converts the entire WETH balance of the contract into ETH.
    function _unwrapWETH() internal {
        uint256 wethBalance = IEtherToken(WETH_ADDRESS)
            .balanceOf(address(this));
        if (wethBalance != 0) {
            IEtherToken(WETH_ADDRESS).withdraw(wethBalance);
        }
    }

    /// @dev Splits an amount between the pool operator and members of the
    ///      pool based on the pool operator's share.
    /// @param poolId The ID of the pool.
    /// @param amount Amount to to split.
    /// @return operatorPortion Portion of `amount` attributed to the operator.
    /// @return membersPortion Portion of `amount` attributed to the pool.
    function _splitAmountBetweenOperatorAndMembers(
        bytes32 poolId,
        uint256 amount
    )
        internal
        view
        returns (uint256 operatorReward, uint256 membersReward)
    {
        (operatorReward, membersReward) =
            rewardVault.splitAmountBetweenOperatorAndMembers(poolId, amount);
    }

    /// @dev Record a deposit for a pool in the RewardVault.
    /// @param poolId ID of the pool.
    /// @param amount Amount in ETH to record.
    /// @param operatorOnly Only attribute amount to operator.
    /// @return operatorPortion Portion of `amount` attributed to the operator.
    /// @return membersPortion Portion of `amount` attributed to the pool.
    function _recordDepositInRewardVaultFor(
        bytes32 poolId,
        uint256 amount,
        bool operatorOnly
    )
        internal
        returns (
            uint256 operatorPortion,
            uint256 membersPortion
        )
    {
        (operatorPortion, membersPortion) = rewardVault.recordDepositFor(
            poolId,
            amount,
            operatorOnly
        );
    }

    /// @dev Computes the reward owed to a pool during finalization and
    ///      credits it to that pool for the CURRENT epoch.
    /// @param poolId The pool's ID.
    /// @param pool The pool.
    /// @return rewards Amount of rewards for this pool.
    function _creditRewardToPool(
        bytes32 poolId,
        IStructs.ActivePool memory pool
    )
        private
        returns (IStructs.PoolRewards memory rewards)
    {
        // There can't be any rewards if the pool was active or if it has
        // no stake.
        if (pool.feesCollected == 0 || pool.weightedStake == 0) {
            return rewards;
        }

        // Use the cobb-douglas function to compute the total reward.
        uint256 totalReward = LibCobbDouglas._cobbDouglas(
            unfinalizedRewardsAvailable,
            pool.feesCollected,
            unfinalizedTotalFeesCollected,
            pool.weightedStake,
            unfinalizedTotalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenomintor
        );

        // Credit the pool the reward in the RewardVault.
        (rewards.operatorReward, rewards.membersReward) =
            _recordDepositInRewardVaultFor(
                poolId,
                totalReward,
                // If no delegated stake, all rewards go to the operator.
                pool.membersStake == 0
            );
        rewards.membersStake = pool.membersStake;

        // Sync delegator rewards.
        if (rewards.membersReward != 0) {
            _recordRewardForDelegators(
                poolId,
                rewards.membersReward,
                pool.membersStake
            );
        }
    }
}
