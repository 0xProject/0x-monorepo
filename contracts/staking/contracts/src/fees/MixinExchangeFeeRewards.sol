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
        returns (IStructs.TotalRewardStats memory totalRewardStats_)
    {
        uint256 currentEpoch_ = currentEpoch;
        totalRewardStats_ = totalRewardStats;

        // Make sure the previous epoch has been fully finalized.
        if (totalRewardStats_.poolsRemaining != 0) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.PreviousEpochNotFinalizedError(
                    currentEpoch_.safeSub(1),
                    totalRewardStats_.poolsRemaining
                )
            );
        }

        // Convert all ETH to WETH
        _wrapEth();

        // Set up unfinalized state.
        totalRewardStats_.rewardsAvailable = _getAvailableWethBalance();
        totalRewardStats_.poolsRemaining = numPoolRewardStatsThisEpoch;
        totalRewardStats_.totalFeesCollected = totalFeesCollectedThisEpoch;
        totalRewardStats_.totalWeightedStake = totalWeightedStakeThisEpoch;
        totalRewardStats_.totalRewardsFinalized = 0;
        totalRewardStats = totalRewardStats_;

        // Reset current epoch state.
        totalFeesCollectedThisEpoch = 0;
        totalWeightedStakeThisEpoch = 0;
        numPoolRewardStatsThisEpoch = 0;
    }


    function _computeUnsettledFeeReward(bytes32 poolId)
        internal
        view
        returns (
            IStructs.PoolRewardStats memory poolStats,
            uint256 rewards
        ) {

        // Noop on epoch 0
        uint256 currentEpoch_ = currentEpoch;
        uint256 prevEpoch = currentEpoch_.safeSub(1);
        poolStats = _getPoolRewardStatsFromEpoch(prevEpoch, poolId);

        if (currentEpoch_ == 0) {
            return (poolStats, rewards);
        }

        // Noop if the pool was not active or already finalized (has no fees).
        if (poolStats.feesCollected == 0) {
            return (poolStats, rewards);
        }

        // Load the finalization and pool state into memory.
        IStructs.TotalRewardStats memory totalRewardStats_ = totalRewardStats;

        // Compute the rewards.
        // Use the cobb-douglas function to compute the total reward.
        rewards = LibCobbDouglas.cobbDouglas(
            totalRewardStats_.rewardsAvailable,
            poolStats.feesCollected,
            totalRewardStats_.totalFeesCollected,
            poolStats.weightedStake,
            totalRewardStats_.totalWeightedStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );

        // Clip the reward to always be under
        // `rewardsAvailable - totalRewardsPaid`,
        // in case cobb-douglas overflows, which should be unlikely.
        uint256 rewardsRemaining = totalRewardStats_.rewardsAvailable.safeSub(totalRewardStats_.totalRewardsFinalized);
        if (rewardsRemaining < rewards) {
            rewards = rewardsRemaining;
        }
    }

    function _recordFeeRewardSettlement(bytes32 poolId, uint256 amountSettled) internal {
        // Clear the pool state so we don't finalize it again, and to recoup
        // some gas.
        uint256 currentEpoch_ = currentEpoch;
        uint256 lastEpoch = currentEpoch_.safeSub(1);
        delete _getPoolRewardStatsFromEpoch(lastEpoch)[poolId];

        // Increase `totalRewardsFinalized`.
        totalRewardStats.totalRewardsFinalized = totalRewardStats.totalRewardsFinalized.safeAdd(amountSettled);

        // Decrease the number of unfinalized pools left.
        totalRewardStats.poolsRemaining = totalRewardStats.poolsRemaining.safeSub(1);

        // Handle the case where this was the final pool to be settled.
        _handleAllRewardsSettled(totalRewardStats);
    }

    /// @dev Get an active pool from an epoch by its ID.
    /// @param epoch The epoch the pool was/will be active in.
    /// @param poolId The ID of the pool.
    /// @return The pool reward stats with ID `poolId` that was active in `epoch`.
    function _getPoolRewardStatsFromEpoch(
        uint256 epoch,
        bytes32 poolId
    )
        internal
        view
        returns (IStructs.PoolRewardStats memory)
    {
        return _getPoolRewardStatsFromEpoch(epoch)[poolId];
    }

    /// @dev Get a mapping of pool reward stats from an epoch.
    ///      This uses the formula `epoch % 2` as the epoch index in order
    ///      to reuse state, because we only need to remember, at most, two
    ///      epochs at once.
    /// @return The pool reward stats for `epoch`.
    function _getPoolRewardStatsFromEpoch(
        uint256 epoch
    )
        internal
        view
        returns (mapping (bytes32 => IStructs.PoolRewardStats) storage)
    {
        return _poolRewardStatsByEpoch[epoch % 2];
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

    function _handleAllRewardsSettled(IStructs.TotalRewardStats memory totalRewardStats_)
        internal
    {
        if (totalRewardStats_.poolsRemaining != 0) {
            return;
        }

        uint256 rewardsRemaining = totalRewardStats_.rewardsAvailable.safeSub(
            totalRewardStats_.totalRewardsFinalized
        );
        emit EpochFinalized(
            currentEpoch.safeSub(1),
            totalRewardStats_.totalRewardsFinalized,
            rewardsRemaining
        );
    }
}
