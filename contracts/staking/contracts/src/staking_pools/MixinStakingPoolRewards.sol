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
import "./MixinCumulativeRewards.sol";


contract MixinStakingPoolRewards is
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeBalances,
    MixinCumulativeRewards
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
        return _computeRewardBalanceOfDelegator(
            poolId,
            member,
            _loadUnsyncedBalance(delegatedStakeToPoolByOwner[member][poolId]),
            getCurrentEpoch()
        );
    }

    function _syncRewardsForDelegator(bytes32 poolId, address member)
        internal
    {
        // cache some values to reduce sloads
        IStructs.StoredBalance memory unsyncedDelegatedStakeToPoolByOwner = _loadUnsyncedBalance(delegatedStakeToPoolByOwner[member][poolId]);
        uint256 currentEpoch = getCurrentEpoch();

        // transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the delegator pool.
        _transferDelegatorRewardsToEthVault(
            poolId,
            member,
            unsyncedDelegatedStakeToPoolByOwner,
            currentEpoch
        );

        // sync cumulative rewards that we'll need for future computations
        _syncCumulativeRewards(
            poolId,
            member,
            unsyncedDelegatedStakeToPoolByOwner,
            currentEpoch
        );
    }

    /// @dev Transfers a delegators accumulated rewards from the transient pool Reward Pool vault
    ///      to the Eth Vault. This is required before the member's stake in the pool can be
    ///      modified.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    function _transferDelegatorRewardsToEthVault(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory unsyncedDelegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        private
    {
        // there are no delegators in the first epoch
        if (currentEpoch == 0) {
            return;
        }

        // compute balance owed to delegator
        uint256 balance = _computeRewardBalanceOfDelegator(
            poolId,
            member,
            unsyncedDelegatedStakeToPoolByOwner,
            currentEpoch
        );
        if (balance == 0) {
            return;
        }

        // transfer from transient Reward Pool vault to ETH Vault
        _transferMemberBalanceToEthVault(poolId, member, balance);
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @param unsyncedDelegatedStakeToPoolByOwner Unsynced delegated stake to pool by owner
    /// @param currentEpoch The epoch in which this call is executing
    /// @return totalReward Balance in ETH.
    function _computeRewardBalanceOfDelegator(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory unsyncedDelegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        private
        view
        returns (uint256 totalReward)
    {
        // cache some values to reduce sloads
        IStructs.StoredBalance memory delegatedStake = _loadUnsyncedBalance(delegatedStakeToPoolByOwner[member][poolId]);
        uint256 currentEpoch = getCurrentEpoch();

        // value is always zero in these two scenarios:
        //   1. The owner's delegated is current as of this epoch: their rewards have been moved to the ETH vault.
        //   2. The current epoch is zero: delegation begins at epoch 1
        if (delegatedStake.currentEpoch == currentEpoch || currentEpoch == 0) return 0;

        // compute reward accumulated during `delegatedStake.currentEpoch`;
        uint256 rewardsAccumulatedDuringLastStoredEpoch = (delegatedStake.currentEpochBalance != 0)
            ? _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.currentEpochBalance,
                delegatedStake.currentEpoch - 1,
                delegatedStake.currentEpoch
            )
            : 0;

        // compute the reward accumulated by the `next` balance;
        // this starts at `delegatedStake.currentEpoch + 1` and goes up until the last epoch, during which
        // rewards were accumulated. This is at most the most recently finalized epoch (current epoch - 1).
        uint256 rewardsAccumulatedAfterLastStoredEpoch = (cumulativeRewardsByPoolLastStored[poolId] > delegatedStake.currentEpoch)
            ? _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.nextEpochBalance,
                delegatedStake.currentEpoch,
                cumulativeRewardsByPoolLastStored[poolId]
            )
            : 0;

        // compute the total reward
        totalReward = rewardsAccumulatedDuringLastStoredEpoch.safeAdd(rewardsAccumulatedAfterLastStoredEpoch);
        return totalReward;
    }
}
