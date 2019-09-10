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

    function syncRewardsForDelegator(bytes32 poolId, address member)
        public
    {
        _syncRewardsForDelegator(
            poolId,
            member,
            _loadUnsyncedBalance(delegatedStakeToPoolByOwner[member][poolId]), // initial value
            _loadAndSyncBalance(delegatedStakeToPoolByOwner[member][poolId]) // final value
        );

        // @todo write synced version

    }

    function _syncRewardsForDelegator(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory initialDelegatedStakeToPoolByOwner,
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner
    )
        internal
    {
        uint256 currentEpoch = getCurrentEpoch();

        // transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the delegator pool.
        _transferDelegatorRewardsToEthVault(
            poolId,
            member,
            initialDelegatedStakeToPoolByOwner,
            currentEpoch
        );

        // update dependencies on cumulative rewards
        _updateCumulativeRewardDependencies(
            poolId,
            member,
            initialDelegatedStakeToPoolByOwner,
            finalDelegatedStakeToPoolByOwner,
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
        // value is always zero in these two scenarios:
        //   1. The owner's delegated is current as of this epoch: their rewards have been moved to the ETH vault.
        //   2. The current epoch is zero: delegation begins at epoch 1
        if (unsyncedDelegatedStakeToPoolByOwner.currentEpoch == currentEpoch || currentEpoch == 0) return 0;

        // compute reward accumulated during `delegatedStake.currentEpoch`;
        uint256 rewardsAccumulatedDuringLastStoredEpoch = (unsyncedDelegatedStakeToPoolByOwner.currentEpochBalance != 0)
            ? _computeMemberRewardOverInterval(
                poolId,
                unsyncedDelegatedStakeToPoolByOwner.currentEpochBalance,
                uint256(unsyncedDelegatedStakeToPoolByOwner.currentEpoch).safeSub(1),
                unsyncedDelegatedStakeToPoolByOwner.currentEpoch
            )
            : 0;

        // compute the reward accumulated by the `next` balance;
        // this starts at `delegatedStake.currentEpoch + 1` and goes up until the last epoch, during which
        // rewards were accumulated. This is at most the most recently finalized epoch (current epoch - 1).
        uint256 rewardsAccumulatedAfterLastStoredEpoch = (cumulativeRewardsByPoolLastStored[poolId] > unsyncedDelegatedStakeToPoolByOwner.currentEpoch)
            ? _computeMemberRewardOverInterval(
                poolId,
                unsyncedDelegatedStakeToPoolByOwner.nextEpochBalance,
                unsyncedDelegatedStakeToPoolByOwner.currentEpoch,
                cumulativeRewardsByPoolLastStored[poolId]
            )
            : 0;

        // compute the total reward
        totalReward = rewardsAccumulatedDuringLastStoredEpoch.safeAdd(rewardsAccumulatedAfterLastStoredEpoch);
        return totalReward;
    }

    function _updateCumulativeRewardDependencies(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory oldDelegatedStakeToPoolByOwner,
        IStructs.StoredBalance memory newDelegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        internal
    {
        _setCumulativeRewardDependencies(
            poolId,
            member,
            newDelegatedStakeToPoolByOwner,
            currentEpoch
        );

        _unsetCumulativeRewardDependencies(
            poolId,
            member,
            oldDelegatedStakeToPoolByOwner,
            currentEpoch
        );
    }

    function _setCumulativeRewardDependencies(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory delegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        private
    {
        // get the most recent cumulative rewards; these will serve as a reference point when updating dependencies
        IStructs.CumulativeRewardInfo memory mostRecentCumulativeRewardInfo = _getMostRecentCumulativeRewardInfo(poolId);

        // record dependency on current epoch.
        _recordDependencyOnCumulativeReward(
            poolId,
            currentEpoch,
            mostRecentCumulativeRewardInfo
        );

        // @todo Set most recent cumulative reward here!

        // in epoch 0, there are no previous epochs we depend on; nor are there epochs we no longer depend on.
        if (currentEpoch == 0) {
            return;
        }

        // record dependency on `lastEpoch`
        _recordDependencyOnCumulativeReward(
            poolId,
            currentEpoch.safeSub(1),
            mostRecentCumulativeRewardInfo
        );
    }

    function _unsetCumulativeRewardDependencies(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory delegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        private
    {
        // if this delegator is not yet initialized then there's no dependency to unrecord.
        if (!delegatedStakeToPoolByOwner.isInitialized) {
            return;
        }

        // unrecord dependency on stored "current epoch"
        // (note that this may be equal to `lastEpoch` without causing a fault)
        // @todo if (unsyncedDelegatedStakeToPoolByOwner.current > 0)
        _unrecordDependencyOnCumulativeReward(
            poolId,
            delegatedStakeToPoolByOwner.currentEpoch, // previously stored "current epoch"
            currentEpoch
        );

        // if this delegator last updated in epoch 0 then there is no earlier dependency to unrecord.
        if (delegatedStakeToPoolByOwner.currentEpoch == 0) {
            return;
        }

        // unrecord dependency on stored "last epoch"
        _unrecordDependencyOnCumulativeReward(
            poolId,
            uint256(delegatedStakeToPoolByOwner.currentEpoch).safeSub(1), // previously stored "last epoch"
            currentEpoch
        );
    }
}
