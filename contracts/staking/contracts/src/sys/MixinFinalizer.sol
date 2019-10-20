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
import "../libs/LibCobbDouglas.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IStructs.sol";
import "../staking_pools/MixinStakingPoolRewards.sol";


contract MixinFinalizer is
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

    /// @dev Begins a new epoch, preparing the prior one for finalization.
    ///      Throws if not enough time has passed between epochs or if the
    ///      previous epoch was not fully finalized.
    ///      If there were no active pools in the closing epoch, the epoch
    ///      will be instantly finalized here. Otherwise, `finalizePool()`
    ///      should be called on each active pool afterwards.
    /// @return poolsRemaining The number of unfinalized pools.
    function endEpoch()
        external
        returns (uint256 poolsRemaining)
    {
        uint256 closingEpoch = currentEpoch;
        IStructs.UnfinalizedState memory state = unfinalizedState;

        // Make sure the previous epoch has been fully finalized.
        if (state.poolsRemaining != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.PreviousEpochNotFinalizedError(
                    closingEpoch.safeSub(1),
                    state.poolsRemaining
                )
            );
        }

        // Convert all ETH to WETH
        _wrapEth();

        // Set up unfinalized state.
        state.rewardsAvailable = _getAvailableWethBalance();
        state.poolsRemaining = poolsRemaining = numActivePoolsThisEpoch;
        state.totalFeesCollected = totalFeesCollectedThisEpoch;
        state.totalWeightedStake = totalWeightedStakeThisEpoch;
        state.totalRewardsFinalized = 0;
        unfinalizedState = state;

        // Emit an event.
        emit EpochEnded(
            closingEpoch,
            state.poolsRemaining,
            state.rewardsAvailable,
            state.totalFeesCollected,
            state.totalWeightedStake
        );

        // Reset current epoch state.
        totalFeesCollectedThisEpoch = 0;
        totalWeightedStakeThisEpoch = 0;
        numActivePoolsThisEpoch = 0;

        // Advance the epoch. This will revert if not enough time has passed.
        _goToNextEpoch();

        // If there were no active pools, the epoch is already finalized.
        if (poolsRemaining == 0) {
            emit EpochFinalized(closingEpoch, 0, state.rewardsAvailable);
        }
    }

    /// @dev Instantly finalizes a single pool that was active in the previous
    ///      epoch, crediting it rewards for members and withdrawing operator's
    ///      rewards as WETH. This can be called by internal functions that need
    ///      to finalize a pool immediately. Does nothing if the pool is already
    ///      finalized or was not active in the previous epoch.
    /// @param poolId The pool ID to finalize.
    function finalizePool(bytes32 poolId)
        public
    {
        // Load the finalization and pool state into memory.
        IStructs.UnfinalizedState memory state = unfinalizedState;

        // Noop if all active pools have been finalized.
        if (state.poolsRemaining == 0) {
            return;
        }

        uint256 currentEpoch_ = currentEpoch;
        uint256 prevEpoch = currentEpoch_.safeSub(1);
        IStructs.ActivePool memory pool = _getActivePoolFromEpoch(prevEpoch, poolId);

        // Noop if the pool was not active or already finalized (has no fees).
        if (pool.feesCollected == 0) {
            return;
        }

        // Clear the pool state so we don't finalize it again, and to recoup
        // some gas.
        delete _getActivePoolsFromEpoch(prevEpoch)[poolId];

        // Compute the rewards.
        uint256 rewards = _getUnfinalizedPoolRewardsFromState(pool, state);

        // Pay the operator and update rewards for the pool.
        // Note that we credit at the CURRENT epoch even though these rewards
        // were earned in the previous epoch.
        (uint256 operatorReward, uint256 membersReward) = _syncPoolRewards(
            poolId,
            rewards,
            pool.membersStake
        );

        // Emit an event.
        emit RewardsPaid(
            currentEpoch_,
            poolId,
            operatorReward,
            membersReward
        );

        uint256 totalReward = operatorReward.safeAdd(membersReward);

        // Increase `totalRewardsFinalized`.
        unfinalizedState.totalRewardsFinalized =
            state.totalRewardsFinalized =
            state.totalRewardsFinalized.safeAdd(totalReward);

        // Decrease the number of unfinalized pools left.
        unfinalizedState.poolsRemaining =
            state.poolsRemaining =
            state.poolsRemaining.safeSub(1);

        // If there are no more unfinalized pools remaining, the epoch is
        // finalized.
        if (state.poolsRemaining == 0) {
            emit EpochFinalized(
                prevEpoch,
                state.totalRewardsFinalized,
                state.rewardsAvailable.safeSub(state.totalRewardsFinalized)
            );
        }
    }

    /// @dev Computes the reward owed to a pool during finalization.
    ///      Does nothing if the pool is already finalized.
    /// @param poolId The pool's ID.
    /// @return totalReward The total reward owed to a pool.
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
        IStructs.ActivePool memory pool = _getActivePoolFromEpoch(
            currentEpoch.safeSub(1),
            poolId
        );
        reward = _getUnfinalizedPoolRewardsFromState(pool, unfinalizedState);
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
        return pool;
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
        return activePools;
    }

    /// @dev Converts the entire ETH balance of this contract into WETH.
    function _wrapEth()
        internal
    {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            getWethContract().deposit.value(ethBalance)();
        }
    }

    /// @dev Returns the WETH balance of this contract, minus
    ///      any WETH that has already been reserved for rewards.
    function _getAvailableWethBalance()
        internal
        view
        returns (uint256 wethBalance)
    {
        wethBalance = getWethContract().balanceOf(address(this))
            .safeSub(wethReservedForPoolRewards);

        return wethBalance;
    }

    /// @dev Asserts that a pool has been finalized last epoch.
    /// @param poolId The id of the pool that should have been finalized.
    function _assertPoolFinalizedLastEpoch(bytes32 poolId)
        internal
        view
    {
        uint256 prevEpoch = currentEpoch.safeSub(1);
        IStructs.ActivePool memory pool = _getActivePoolFromEpoch(prevEpoch, poolId);

        // A pool that has any fees remaining has not been finalized
        if (pool.feesCollected != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.PoolNotFinalizedError(
                    poolId,
                    prevEpoch
                )
            );
        }
    }

    /// @dev Computes the reward owed to a pool during finalization.
    /// @param pool The active pool.
    /// @param state The current state of finalization.
    /// @return rewards Unfinalized rewards for this pool.
    function _getUnfinalizedPoolRewardsFromState(
        IStructs.ActivePool memory pool,
        IStructs.UnfinalizedState memory state
    )
        private
        view
        returns (uint256 rewards)
    {
        // There can't be any rewards if the pool was active or if it has
        // no stake.
        if (pool.feesCollected == 0) {
            return rewards;
        }

        // Use the cobb-douglas function to compute the total reward.
        rewards = LibCobbDouglas.cobbDouglas(
            state.rewardsAvailable,
            pool.feesCollected,
            state.totalFeesCollected,
            pool.weightedStake,
            state.totalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );

        // Clip the reward to always be under
        // `rewardsAvailable - totalRewardsPaid`,
        // in case cobb-douglas overflows, which should be unlikely.
        uint256 rewardsRemaining = state.rewardsAvailable.safeSub(state.totalRewardsFinalized);
        if (rewardsRemaining < rewards) {
            rewards = rewardsRemaining;
        }
    }
}
