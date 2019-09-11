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
import "../libs/LibFixedMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "../interfaces/IStructs.sol";
import "../stake/MixinStakeBalances.sol";
import "../sys/MixinScheduler.sol";
import "../staking_pools/MixinStakingPool.sol";
import "../staking_pools/MixinStakingPoolRewardVault.sol";
import "./MixinExchangeManager.sol";


/// @dev This mixin contains functions related to finalizing epochs.
///      Finalization occurs over multiple calls because we can only
///      discover the `totalRewardsPaid` to all pools by summing the
///      the reward function across all active pools at the end of an
///      epoch. Until this value is known for epoch `e`, we cannot finalize
///      epoch `e+1`, because the remaining balance (`balance - totalRewardsPaid`)
///      is the reward pool for finalizing the next epoch.
contract MixinFinalizer is
    IStakingEvents,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinStakingPoolRewardVault,
    MixinScheduler,
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
        uint256 closingEpoch = currentEpoch;
        // Make sure the previous epoch has been fully finalized.
        if (unfinalizedPoolsRemaining != 0) {
            LibRichErrors.rrevert(LibStakingRichErrors.PreviousEpochNotFinalized(
                closingEpoch.sub(1),
                unfinalizedPoolsRemaining
            ));
        }
        // Populate finalization state.
        unfinalizedPoolsRemaining = numActivePoolsThisEpoch;
        unfinalizedRewardsAvailable = address(this).balance;
        unfinalizedTotalFeesCollected = totalFeesCollected;
        unfinalizedTotalWeightedStake = totalWeightedStake;
        totalRewardsPaid = 0;
        // Emit an event.
        emit EpochEnded(
            closingEpoch,
            numActivePoolsThisEpoch,
            rewardsAvailable,
            totalWeightedStake,
            totalFeesCollected
        );
        // Reset current epoch state.
        totalFeesCollected = 0;
        totalWeightedStake = 0;
        numActivePoolsThisEpoch = 0;
        // Advance the epoch. This will revert if not enough time has passed.
        _goToNextEpoch();
        // If there were no active pools, the epoch is already finalized.
        if (unfinalizedPoolsRemaining == 0) {
            emit EpochFinalized(closingEpoch, 0, unfinalizedRewardsAvailable);
        }
        return _unfinalizedPoolsRemaining = unfinalizedPoolsRemaining;
    }

    /// @dev Finalizes a pool that was active in the previous epoch, paying out
    ///      its rewards to the reward vault. Keepers should call this function
    ///      repeatedly until all active pools that were emitted in in a
    ///      `StakingPoolActivated` in the prior epoch have been finalized.
    ///      Pools that have already been finalized will be silently ignored.
    ///      We deliberately try not to revert here in case multiple parties
    ///      are finalizing pools.
    /// @param poolIds List of active pool IDs to finalize.
    /// @return rewardsPaid Total rewards paid to the pools passed in.
    /// @return _unfinalizedPoolsRemaining The number of unfinalized pools left.
    function finalizePools(bytes32[] memory poolIds)
        external
        returns (uint256 rewardsPaid, uint256 _unfinalizedPoolsRemaining)
    {
        uint256 epoch = currentEpoch.sub(1);
        uint256 poolsRemaining = unfinalizedPoolsRemaining;
        uint256 numPoolIds = poolIds.length;
        uint256 rewardsPaid = 0;
        // Pointer to the active pools in the last epoch.
        // We use `(currentEpoch - 1) % 2` as the index to reuse state.
        mapping(bytes32 => IStructs.ActivePool) storage activePools =
            activePoolsByEpoch[epoch % 2];
        for (uint256 i = 0; i < numPoolIds && poolsRemaining != 0; i++) {
            bytes32 poolId = poolIds[i];
            IStructs.ActivePool memory pool = activePools[poolId];
            // Ignore pools that aren't active.
            if (pool.feesCollected != 0) {
                // Credit the pool with rewards.
                // We will transfer the total rewards to the vault at the end.
                rewardsPaid = rewardsPaid.add(_creditRewardsToPool(poolId, pool));
                // Clear the pool state so we don't finalize it again,
                // and to recoup some gas.
                activePools[poolId] = IStructs.ActivePool(0, 0);
                // Decrease the number of unfinalized pools left.
                poolsRemaining = poolsRemaining.sub(1);
                // Emit an event.
                emit RewardsPaid(epoch, poolId, reward);
            }
        }
        // Deposit all the rewards at once into the RewardVault.
        _depositIntoStakingPoolRewardVault(rewardsPaid);
        // Update finalization state.
        totalRewardsPaidLastEpoch = totalRewardsPaidLastEpoch.add(rewardsPaid);
        _unfinalizedPoolsRemaining = unfinalizedPoolsRemaining = poolsRemaining;
        // If there are no more unfinalized pools remaining, the epoch is
        // finalized.
        if (poolsRemaining == 0) {
            emit EpochFinalized(
                epoch,
                totalRewardsPaidLastEpoch,
                unfinalizedRewardsAvailable.sub(totalRewardsPaidLastEpoch)
            );
        }
    }

    /// @dev Computes the rewards owned for a pool during finalization and
    ///      credits it in the RewardVault.
    /// @param The epoch being finalized.
    /// @param poolId The pool's ID.
    /// @param pool The pool.
    /// @return rewards Amount of rewards for this pool.
    function _creditRewardsToPool(
        uint256 epoch,
        bytes32 poolId,
        IStructs.ActivePool memory pool
    )
        internal
        returns (uint256 rewards)
    {
        // Use the cobb-douglas function to compute the reward.
        reward = _cobbDouglas(
            unfinalizedRewardsAvailable,
            pool.feesCollected,
            unfinalizedTotalFeesCollected,
            pool.weightedStake,
            unfinalizedTotalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenomintor
        );
        // Credit the pool the reward in the RewardVault.
        (, uint256 membersPortionOfReward) = rewardVault.recordDepositFor(
            poolId,
            reward,
            // If no delegated stake, all rewards go to the operator.
            pool.delegatedStake == 0
        );
        // Sync delegator rewards.
        if (membersPortionOfReward != 0) {
            _recordRewardForDelegators(
                poolId,
                membersPortionOfReward,
                pool.delegatedStake,
                epoch
            );
        }
    }

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note that in this function there is no limitation on alpha; we tend to get better rounding
    /// on the simplified versions below.
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @param alphaNumerator Numerator of `alpha` in the cobb-dougles function.
    /// @param alphaDenominator Denominator of `alpha` in the cobb-douglas function.
    /// @return ownerRewards Rewards for the owner.
    function _cobbDouglas(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint256 alphaNumerator,
        uint256 alphaDenominator
    )
        internal
        pure
        returns (uint256 ownerRewards)
    {
        int256 feeRatio = LibFixedMath._toFixed(ownerFees, totalFees);
        int256 stakeRatio = LibFixedMath._toFixed(ownerStake, totalStake);
        if (feeRatio == 0 || stakeRatio == 0) {
            return ownerRewards = 0;
        }

        // The cobb-doublas function has the form:
        // `totalRewards * feeRatio ^ alpha * stakeRatio ^ (1-alpha)`
        // This is equivalent to:
        // `totalRewards * stakeRatio * e^(alpha * (ln(feeRatio / stakeRatio)))`
        // However, because `ln(x)` has the domain of `0 < x < 1`
        // and `exp(x)` has the domain of `x < 0`,
        // and fixed-point math easily overflows with multiplication,
        // we will choose the following if `stakeRatio > feeRatio`:
        // `totalRewards * stakeRatio / e^(alpha * (ln(stakeRatio / feeRatio)))`

        // Compute
        // `e^(alpha * (ln(feeRatio/stakeRatio)))` if feeRatio <= stakeRatio
        // or
        // `e^(ln(stakeRatio/feeRatio))` if feeRatio > stakeRatio
        int256 n = feeRatio <= stakeRatio ?
            LibFixedMath._div(feeRatio, stakeRatio) :
            LibFixedMath._div(stakeRatio, feeRatio);
        n = LibFixedMath._exp(
            LibFixedMath._mulDiv(
                LibFixedMath._ln(n),
                int256(alphaNumerator),
                int256(alphaDenominator)
            )
        );
        // Compute
        // `totalRewards * n` if feeRatio <= stakeRatio
        // or
        // `totalRewards / n` if stakeRatio > feeRatio
        n = feeRatio <= stakeRatio ?
            LibFixedMath._mul(stakeRatio, n) :
            LibFixedMath._div(stakeRatio, n);
        // Multiply the above with totalRewards.
        ownerRewards = LibFixedMath._uintMul(n, totalRewards);
    }
}
