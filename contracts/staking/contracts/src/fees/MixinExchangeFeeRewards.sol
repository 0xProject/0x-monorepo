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

import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibCobbDouglas.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IStructs.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinDeploymentConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "../stake/MixinStakeBalances.sol";


contract MixinExchangeFeeRewards is
    IStakingEvents,
    MixinConstants,
    MixinDeploymentConstants,
    MixinStorage,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    /// @dev Get information on an active staking pool in this epoch.
    /// @param poolId Pool Id to query.
    /// @return PoolStats struct.
    function getActiveStakingPoolThisEpoch(bytes32 poolId)
        external
        view
        returns (IStructs.PoolStats memory)
    {
        return _poolStatsByEpoch[currentEpoch][poolId];
    }

    function _attributeFeeToPool(bytes32 poolId, uint256 protocolFeePaid)
        internal
    {
        // Only attribute the protocol fee payment to a pool if the maker is
        // registered to a pool.
        if (poolId == NIL_POOL_ID) {
            return;
        }

        uint256 poolStake = getTotalStakeDelegatedToPool(poolId).currentEpochBalance;
        // Ignore pools with dust stake.
        if (poolStake < minimumPoolStake) {
            return;
        }

        // Look up the pool stats and aggregated stats for this epoch.
        uint256 currentEpoch_ = currentEpoch;
        IStructs.PoolStats memory poolStats = _poolStatsByEpoch[currentEpoch_][poolId];
        IStructs.AggregatedStats memory aggregatedStats = _aggregatedStatsByEpoch[currentEpoch_];

        // If the pool was previously inactive in this epoch, initialize it.
        if (poolStats.feesCollected == 0) {
            // Compute member and total weighted stake.
            (poolStats.membersStake, poolStats.weightedStake) = _computeMembersAndWeightedStake(poolId, poolStake);

            // Increase the total weighted stake.
            aggregatedStats.totalWeightedStake = aggregatedStats.totalWeightedStake.safeAdd(poolStats.weightedStake);

            // Increase the number of active pools.
            aggregatedStats.poolsRemaining += 1;

            // Emit an event so keepers know what pools earned rewards this epoch.
            emit StakingPoolEarnedRewards(currentEpoch_, poolId);
        }

        // Credit the fees to the pool.
        poolStats.feesCollected = poolStats.feesCollected.safeAdd(protocolFeePaid);

        // Increase the total fees collected this epoch.
        aggregatedStats.totalFeesCollected = aggregatedStats.totalFeesCollected.safeAdd(protocolFeePaid);

        // Store the updated stats.
        _poolStatsByEpoch[currentEpoch_][poolId] = poolStats;
        _aggregatedStatsByEpoch[currentEpoch_] = aggregatedStats;
    }

    function _setRewardsAvailable(uint256 epoch, uint256 rewardsAvailable)
        internal
    {
        // Set rewards available for this epoch.
        _aggregatedStatsByEpoch[epoch].rewardsAvailable = rewardsAvailable;

        // Nothing left to do if this is epoch 0.
        if (epoch == 0) {
            return;
        }

        // Ensure all rewards have been paid out for the previous epoch;
        // otherwise the available rewards may not be accurate.
        uint256 lastEpoch = epoch.safeSub(1);
        if (_aggregatedStatsByEpoch[lastEpoch].poolsRemaining != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.UnpaidRewardsError(
                    lastEpoch,
                    _aggregatedStatsByEpoch[lastEpoch].poolsRemaining
                )
            );
        }
    }

    function _computeFeeRewardForPool(bytes32 poolId)
        internal
        view
        returns (
            IStructs.PoolStats memory poolStats,
            uint256 rewards
        ) {

        // Noop on epoch 0
        uint256 currentEpoch_ = currentEpoch;
        if (currentEpoch_ == 0) {
            return (poolStats, rewards);
        }

        // Load pool stats for last epoch.
        uint256 lastEpoch = currentEpoch_.safeSub(1);
        poolStats = _poolStatsByEpoch[lastEpoch][poolId];

        // Noop if the pool was did not earn any rewards or has already been paid their reward.
        if (poolStats.feesCollected == 0) {
            return (poolStats, rewards);
        }

        // Compute the rewards.
        // Use the cobb-douglas function to compute the total reward.
        IStructs.AggregatedStats memory aggregatedStats = _aggregatedStatsByEpoch[lastEpoch];
        rewards = LibCobbDouglas.cobbDouglas(
            aggregatedStats.rewardsAvailable,
            poolStats.feesCollected,
            aggregatedStats.totalFeesCollected,
            poolStats.weightedStake,
            aggregatedStats.totalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );

        // Clip the reward to always be under
        // `rewardsAvailable - totalRewardsPaid`,
        // in case cobb-douglas overflows, which should be unlikely.
        uint256 rewardsRemaining = aggregatedStats.rewardsAvailable.safeSub(aggregatedStats.totalRewardsPaid);
        if (rewardsRemaining < rewards) {
            rewards = rewardsRemaining;
        }
    }

    function _handleRewardPaidToPool(bytes32 poolId, uint256 amountSettled)
        internal
    {
        // Clear the pool stats so we don't payout the reward again.
        uint256 currentEpoch_ = currentEpoch;
        uint256 lastEpoch = currentEpoch_.safeSub(1);
        delete _poolStatsByEpoch[lastEpoch][poolId];

        // Update the aggregated stats for last epoch.
        _aggregatedStatsByEpoch[lastEpoch].totalRewardsPaid = _aggregatedStatsByEpoch[lastEpoch].totalRewardsPaid.safeAdd(amountSettled);
        _aggregatedStatsByEpoch[lastEpoch].poolsRemaining = _aggregatedStatsByEpoch[lastEpoch].poolsRemaining.safeSub(1);

        // Handle the case where this was the final pool to be settled.
        _handleAllRewardsPaid(lastEpoch);
    }

    /// @dev Computes the members and weighted stake for a pool at the current
    ///      epoch.
    /// @param poolId ID of the pool.
    /// @param totalStake Total (unweighted) stake in the pool.
    /// @return membersStake Non-operator stake in the pool.
    /// @return weightedStake Weighted stake of the pool.
    function _computeMembersAndWeightedStake(
        bytes32 poolId,
        uint256 totalStake
    )
        private
        view
        returns (uint256 membersStake, uint256 weightedStake)
    {
        uint256 operatorStake = getStakeDelegatedToPoolByOwner(
            _poolById[poolId].operator,
            poolId
        ).currentEpochBalance;

        membersStake = totalStake.safeSub(operatorStake);
        weightedStake = operatorStake.safeAdd(
            LibMath.getPartialAmountFloor(
                rewardDelegatedStakeWeight,
                PPM_DENOMINATOR,
                membersStake
            )
        );
        return (membersStake, weightedStake);
    }

    function _handleAllRewardsPaid(uint256 epoch)
        internal
    {
        if (_aggregatedStatsByEpoch[epoch].poolsRemaining != 0) {
            return;
        }

        uint256 rewardsPaid = _aggregatedStatsByEpoch[epoch].totalRewardsPaid;
        uint256 rewardsRemaining = _aggregatedStatsByEpoch[epoch].rewardsAvailable.safeSub(rewardsPaid);
        emit AllRewardsPaid(
            epoch,
            rewardsPaid,
            rewardsRemaining
        );

        // Reset stats from last epoch as they are no longer needed.
        _aggregatedStatsByEpoch[epoch] = IStructs.AggregatedStats({
            rewardsAvailable: 0,
            poolsRemaining: 0,
            totalFeesCollected: 0,
            totalWeightedStake: 0,
            totalRewardsPaid: 0
        });
    }
}
