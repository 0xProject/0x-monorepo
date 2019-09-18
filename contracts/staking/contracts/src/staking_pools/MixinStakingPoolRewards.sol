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
import "@0x/contracts-utils/contracts/src/LibFractions.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./MixinCumulativeRewards.sol";


contract MixinStakingPoolRewards is
    MixinCumulativeRewards
{
    using LibSafeMath for uint256;

    /// @dev Syncs rewards for a delegator. This includes transferring rewards from
    /// the Reward Vault to the Eth Vault, and adding/removing dependencies on cumulative rewards.
    /// @param poolId Unique id of pool.
    function syncDelegatorRewards(bytes32 poolId)
        external
    {
        address member = msg.sender;

        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner = _loadAndSyncBalance(_delegatedStakeToPoolByOwner[member][poolId]);
        _syncRewardsForDelegator(
            poolId,
            member,
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[member][poolId]),  // initial balance
            finalDelegatedStakeToPoolByOwner
        );

        // update stored balance with synchronized version; this prevents redundant withdrawals.
        _delegatedStakeToPoolByOwner[member][poolId] = finalDelegatedStakeToPoolByOwner;
    }

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
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[member][poolId]),
            currentEpoch
        );
    }

    /// @dev Syncs rewards for a delegator. This includes transferring rewards from
    /// the Reward Vault to the Eth Vault, and adding/removing dependencies on cumulative rewards.
    /// @param poolId Unique id of pool.
    /// @param member of the pool.
    /// @param initialDelegatedStakeToPoolByOwner The member's delegated balance at the beginning of this transaction.
    /// @param finalDelegatedStakeToPoolByOwner The member's delegated balance at the end of this transaction.
    function _syncRewardsForDelegator(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory initialDelegatedStakeToPoolByOwner,
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner
    )
        internal
    {
        // transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the delegator pool.
        _transferDelegatorRewardsToEthVault(
            poolId,
            member,
            initialDelegatedStakeToPoolByOwner,
            currentEpoch
        );

        // add dependencies on cumulative rewards for this epoch and the previous epoch, if necessary.
        _setCumulativeRewardDependenciesForDelegator(
            poolId,
            finalDelegatedStakeToPoolByOwner,
            true
        );

        // remove dependencies on previous cumulative rewards, if they are no longer needed.
        _setCumulativeRewardDependenciesForDelegator(
            poolId,
            initialDelegatedStakeToPoolByOwner,
            false
        );
    }

    /// @dev Handles a pool's reward. This will deposit the operator's reward into the Eth Vault and
    /// the members' reward into the Staking Pool Vault. It also records the cumulative reward, which
    /// is used to compute each delegator's portion of the members' reward.
    /// @param poolId Unique Id of pool.
    /// @param reward received by the pool.
    /// @param amountOfDelegatedStake the amount of delegated stake that will split the  reward.
    /// @param epoch at which this was earned.
    function _handleStakingPoolReward(
        bytes32 poolId,
        uint256 reward,
        uint256 amountOfDelegatedStake,
        uint256 epoch
    )
        internal
    {
        IStructs.Pool memory pool = poolById[poolId];

        // compute the operator's portion of the reward and transfer it to the ETH vault (we round in favor of the operator).
        uint256 operatorPortion = amountOfDelegatedStake == 0
            ? reward
            : LibMath.getPartialAmountCeil(
                uint256(pool.operatorShare),
                PPM_DENOMINATOR,
                reward
            );

        ethVault.depositFor.value(operatorPortion)(pool.operator);

        // compute the reward portion for the pool members and transfer it to the Reward Vault.
        uint256 membersPortion = reward.safeSub(operatorPortion);
        if (membersPortion == 0) {
            return;
        }

        rewardVault.depositFor.value(membersPortion)(poolId);

        // cache a storage pointer to the cumulative rewards for `poolId` indexed by epoch.
        mapping (uint256 => IStructs.Fraction) storage _cumulativeRewardsByPoolPtr = _cumulativeRewardsByPool[poolId];

        // fetch the last epoch at which we stored an entry for this pool;
        // this is the most up-to-date cumulative rewards for this pool.
        uint256 cumulativeRewardsLastStored = _cumulativeRewardsByPoolLastStored[poolId];
        IStructs.Fraction memory mostRecentCumulativeRewards = _cumulativeRewardsByPoolPtr[cumulativeRewardsLastStored];

        // compute new cumulative reward
        (uint256 numerator, uint256 denominator) = LibFractions.addFractions(
            mostRecentCumulativeRewards.numerator,
            mostRecentCumulativeRewards.denominator,
            membersPortion,
            amountOfDelegatedStake
        );

        // normalize fraction components by dividing by the min token value (10^18)
        (uint256 numeratorNormalized, uint256 denominatorNormalized) = (
            numerator.safeDiv(MIN_TOKEN_VALUE),
            denominator.safeDiv(MIN_TOKEN_VALUE)
        );

        // store cumulative rewards and set most recent
        _forceSetCumulativeReward(
            poolId,
            epoch,
            IStructs.Fraction({
                numerator: numeratorNormalized,
                denominator: denominatorNormalized
            })
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
        // compute balance owed to delegator
        uint256 balance = _computeRewardBalanceOfDelegator(
            poolId,
            unsyncedDelegatedStakeToPoolByOwner,
            currentEpoch
        );
        if (balance == 0) {
            return;
        }

        // transfer from transient Reward Pool vault to ETH Vault
        rewardVault.transferToEthVault(
            poolId,
            member,
            balance,
            address(ethVault)
        );
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param unsyncedDelegatedStakeToPoolByOwner Unsynced delegated stake to pool by owner
    /// @param currentEpoch The epoch in which this call is executing
    /// @return totalReward Balance in ETH.
    function _computeRewardBalanceOfDelegator(
        bytes32 poolId,
        IStructs.StoredBalance memory unsyncedDelegatedStakeToPoolByOwner,
        uint256 currentEpoch
    )
        private
        view
        returns (uint256 totalReward)
    {
        // reward balance is always zero in these two scenarios:
        //   1. The owner's delegated stake is current as of this epoch: their rewards have been moved to the ETH vault.
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
        uint256 rewardsAccumulatedAfterLastStoredEpoch = (_cumulativeRewardsByPoolLastStored[poolId] > unsyncedDelegatedStakeToPoolByOwner.currentEpoch)
            ? _computeMemberRewardOverInterval(
                poolId,
                unsyncedDelegatedStakeToPoolByOwner.nextEpochBalance,
                unsyncedDelegatedStakeToPoolByOwner.currentEpoch,
                _cumulativeRewardsByPoolLastStored[poolId]
            )
            : 0;

        // compute the total reward
        totalReward = rewardsAccumulatedDuringLastStoredEpoch.safeAdd(rewardsAccumulatedAfterLastStoredEpoch);
        return totalReward;
    }

    /// @dev Adds or removes cumulative reward dependencies for a delegator.
    /// A delegator always depends on the cumulative reward for the current epoch.
    /// They will also depend on the previous epoch's reward, if they are already staked with the input pool.
    /// @param poolId Unique id of pool.
    /// @param _delegatedStakeToPoolByOwner Amount of stake the member has delegated to the pool.
    /// @param isDependent is true iff adding a dependency. False, otherwise.
    function _setCumulativeRewardDependenciesForDelegator(
        bytes32 poolId,
        IStructs.StoredBalance memory _delegatedStakeToPoolByOwner,
        bool isDependent
    )
        private
    {
        // if this delegator is not yet initialized then there's no dependency to unset.
        if (!isDependent && !_delegatedStakeToPoolByOwner.isInitialized) {
            return;
        }

        // get the most recent cumulative reward, which will serve as a reference point when updating dependencies
        IStructs.CumulativeRewardInfo memory mostRecentCumulativeRewardInfo = _getMostRecentCumulativeRewardInfo(poolId);

        // record dependency on `lastEpoch`
        if (_delegatedStakeToPoolByOwner.currentEpoch > 0 && _delegatedStakeToPoolByOwner.currentEpochBalance != 0) {
            _addOrRemoveDependencyOnCumulativeReward(
                poolId,
                uint256(_delegatedStakeToPoolByOwner.currentEpoch).safeSub(1),
                mostRecentCumulativeRewardInfo,
                isDependent
            );
        }

        // record dependency on current epoch.
        if (_delegatedStakeToPoolByOwner.currentEpochBalance != 0 || _delegatedStakeToPoolByOwner.nextEpochBalance != 0) {
            _addOrRemoveDependencyOnCumulativeReward(
                poolId,
                _delegatedStakeToPoolByOwner.currentEpoch,
                mostRecentCumulativeRewardInfo,
                isDependent
            );
        }
    }
}
