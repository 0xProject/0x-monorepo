/*

  Copyright 2018 ZeroEx Intl.

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

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../stake/MixinStakeBalances.sol";
import "./MixinStakingPoolRewardVault.sol";
import "./MixinStakingPool.sol";


contract MixinStakingPoolRewards is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinOwnable,
    MixinStakingPoolRewardVault,
    MixinZrxVault,
    MixinStakeStorage,
    MixinStakingPool,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @return Balance in ETH.
    function computeRewardBalanceOfStakingPoolMember(bytes32 poolId, address member)
        public
        view
        returns (uint256)
    {
        // cache some values to reduce sloads
        IStructs.StoredStakeBalance memory delegatedStake = delegatedStakeToPoolByOwner[member][poolId];
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
        uint256 rewardsAccumulatedAfterLastStoredEpoch = (rewardRatioSumsLastUpdated[poolId] > delegatedStake.lastStored)
            ? _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.next,
                delegatedStake.lastStored,
                rewardRatioSumsLastUpdated[poolId]
            )
            : 0;

        // compute the total reward
        uint256 totalReward = rewardsAccumulatedDuringLastStoredEpoch._add(rewardsAccumulatedAfterLastStoredEpoch);
        return totalReward;
    }

    /// @param memberStakeOverInterval Stake delegated to pool by meber over the interval.
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
        IStructs.ND memory beginRatio = rewardRatioSums[poolId][beginEpoch];
        IStructs.ND memory endRatio = rewardRatioSums[poolId][endEpoch];
        uint256 reward = LibSafeMath._scaleFractionalDifference(
            endRatio.numerator,
            endRatio.denominator,
            beginRatio.numerator,
            beginRatio.denominator,
            memberStakeOverInterval
        );
        return reward;
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @return Balance.
    function _syncRewardBalanceOfStakingPoolMember(bytes32 poolId, address member)
        internal
    {
        // eat update cost if necessary
        if (getCurrentEpoch() == 0) {
            return;
        }
        if (rewardRatioSumsLastUpdated[poolId] != getCurrentEpoch() - 1) {
            if (rewardRatioSums[poolId][rewardRatioSumsLastUpdated[poolId]].denominator == 0) {
                revert('naaaaah');
            }

            rewardRatioSums[poolId][getCurrentEpoch() - 1] = rewardRatioSums[poolId][rewardRatioSumsLastUpdated[poolId]];
            rewardRatioSumsLastUpdated[poolId] = getCurrentEpoch() - 1;
        }

        // just in case
        // also set this epoch's ; it'll be overwritten if fees come in.


        if (rewardRatioSums[poolId][getCurrentEpoch()].denominator == 0) {
            rewardRatioSums[poolId][getCurrentEpoch()] = rewardRatioSums[poolId][rewardRatioSumsLastUpdated[poolId]];
        }

        if (delegatedStakeToPoolByOwner[member][poolId].lastStored == getCurrentEpoch()) {
            // already in sync
            return;
        }

        uint256 balance = computeRewardBalanceOfStakingPoolMember(poolId, member);
        if (balance == 0) {
            return;
        }

        // Pay the delegator
        require(address(rewardVault) != address(0), 'eyo');
        rewardVault.transferMemberBalanceToEthVault(poolId, member, balance);

        // Remove the reference
    }

/*
    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @return Balance.
    function syncRewardBalanceOfStakingPoolOperator(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        uint256 balance = computeRewardBalanceOfStakingPoolMember(poolId, member);

        // Pay the delegator


        // Remove the reference


    }
    */
}
