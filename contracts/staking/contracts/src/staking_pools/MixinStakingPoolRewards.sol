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
    /// @return Balance.
    function computeRewardBalanceOfStakingPoolMember(bytes32 poolId, address member)
        public
        view
        returns (uint256)
    {
        IStructs.StoredStakeBalance memory delegatedStake = delegatedStakeToPoolByOwner[member][poolId];
        if (getCurrentEpoch() == 0 || delegatedStake.lastStored == getCurrentEpoch()) return 0;


        // `current` leg
        uint256 totalReward = 0;
        if (delegatedStake.current != 0) {
            uint256 beginEpoch = delegatedStake.lastStored - 1;
            uint endEpoch = delegatedStake.lastStored;
            IStructs.ND memory beginRatio = rewardRatioSums[poolId][beginEpoch];
            IStructs.ND memory endRatio = rewardRatioSums[poolId][endEpoch];


            if (beginRatio.denominator == 0) {
                revert('begin denom = 0 (1)');
            }

            if (endRatio.denominator == 0) {
                revert('end denom = 0 (1)');
            }

            uint256 rewardRatioN = ((endRatio.numerator * beginRatio.denominator) - (beginRatio.numerator * endRatio.denominator));
            uint256 rewardRatio = (delegatedStake.current * (rewardRatioN / beginRatio.denominator)) / endRatio.denominator;
            totalReward += rewardRatio;
        }

        // `next` leg
        if (rewardRatioSumsLastUpdated[poolId] > delegatedStake.lastStored) {
            uint256 beginEpoch = delegatedStake.lastStored;
            uint256 endEpoch = uint256(getCurrentEpoch()) - 1;
            if (rewardRatioSumsLastUpdated[poolId] < endEpoch) {
                endEpoch = rewardRatioSumsLastUpdated[poolId];
            }
            IStructs.ND memory beginRatio = rewardRatioSums[poolId][beginEpoch];
            IStructs.ND memory endRatio = rewardRatioSums[poolId][endEpoch];

            if (beginRatio.denominator == 0) {
                revert('begin denom = 0 (2)');
            }

            if (endRatio.denominator == 0) {
                revert('end denom = 0 (2)');
            }

            uint256 rewardRatioN = ((endRatio.numerator * beginRatio.denominator) - (beginRatio.numerator * endRatio.denominator));
            uint256 rewardRatio = (delegatedStake.next * (rewardRatioN / beginRatio.denominator)) / endRatio.denominator;
            totalReward += rewardRatio;
        }

        return totalReward;
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
