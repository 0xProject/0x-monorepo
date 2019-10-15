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
import "../immutable/MixinStorage.sol";
import "../immutable/MixinDeploymentConstants.sol";
import "../interfaces/IStakingEvents.sol";


contract MixinExchangeFeeRewards is
    IStakingEvents,
    MixinStorage,
    MixinDeploymentConstants
{

    using LibSafeMath for uint256;

    function _storeFeeRewardStats()
        internal
        returns (IStructs.CombinedStats memory combinedStats)
    {
        // Load combined stats for this epoch.
        uint256 currentEpoch_ = currentEpoch;
        combinedStats = _combinedStatsByEpoch[currentEpoch_];

        // Convert all ETH to WETH and record the total rewards available.
        _wrapEth();
        combinedStats.rewardsAvailable = _getAvailableWethBalance();

        // Reset combined stats from last epoch
        if (currentEpoch_ == 0) {
            return combinedStats;
        }
        uint256 lastEpoch = currentEpoch_ - 1;

        // Make sure all pools that generated rewards last epoch have been paid out.
        IStructs.CombinedStats memory combinedStatsLastEpoch = _combinedStatsByEpoch[lastEpoch];
        if (combinedStatsLastEpoch.poolsRemaining != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.PreviousEpochNotFinalizedError(
                    lastEpoch,
                    combinedStatsLastEpoch.poolsRemaining
                )
            );
        }

        // Reset stats from last epoch as they are no longer needed.
        _combinedStatsByEpoch[lastEpoch] = IStructs.CombinedStats({
            rewardsAvailable: 0,
            poolsRemaining: 0,
            totalFeesCollected: 0,
            totalWeightedStake: 0,
            totalRewardsFinalized: 0
        });
    }

    function _computeUnsettledFeeReward(bytes32 poolId)
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

        // Noop if the pool was not active or already finalized (has no fees).
        if (poolStats.feesCollected == 0) {
            return (poolStats, rewards);
        }

        // Compute the rewards.
        // Use the cobb-douglas function to compute the total reward.
        IStructs.CombinedStats memory combinedStats = _combinedStatsByEpoch[lastEpoch];
        rewards = LibCobbDouglas.cobbDouglas(
            combinedStats.rewardsAvailable,
            poolStats.feesCollected,
            combinedStats.totalFeesCollected,
            poolStats.weightedStake,
            combinedStats.totalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );

        // Clip the reward to always be under
        // `rewardsAvailable - totalRewardsPaid`,
        // in case cobb-douglas overflows, which should be unlikely.
        uint256 rewardsRemaining = combinedStats.rewardsAvailable.safeSub(combinedStats.totalRewardsFinalized);
        if (rewardsRemaining < rewards) {
            rewards = rewardsRemaining;
        }
    }

    function _recordFeeRewardSettlement(bytes32 poolId, uint256 amountSettled) internal {
        // Clear the pool stats so we don't finalize it again.
        uint256 currentEpoch_ = currentEpoch;
        uint256 lastEpoch = currentEpoch_.safeSub(1);
        delete _poolStatsByEpoch[lastEpoch][poolId];

        // Update the combined stats for last epoch.
        _combinedStatsByEpoch[lastEpoch].totalRewardsFinalized = _combinedStatsByEpoch[lastEpoch].totalRewardsFinalized.safeAdd(amountSettled);
        _combinedStatsByEpoch[lastEpoch].poolsRemaining = _combinedStatsByEpoch[lastEpoch].poolsRemaining.safeSub(1);

        // Handle the case where this was the final pool to be settled.
        _handleAllRewardsSettled(_combinedStatsByEpoch[lastEpoch]);
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

    /// @dev Converts the entire ETH balance of this contract into WETH.
    function _wrapEth()
        internal
    {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            getWethContract().deposit.value(ethBalance)();
        }
    }

    function _handleAllRewardsSettled(IStructs.CombinedStats memory combinedStats)
        internal
    {
        if (combinedStats.poolsRemaining != 0) {
            return;
        }

        uint256 rewardsRemaining = combinedStats.rewardsAvailable.safeSub(
            combinedStats.totalRewardsFinalized
        );
        emit EpochFinalized(
            currentEpoch.safeSub(1),
            combinedStats.totalRewardsFinalized,
            rewardsRemaining
        );
    }
}
