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
import "../sys/MixinAbstract.sol";


contract MixinStakingPoolRewards is
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances,
    MixinCumulativeRewards
{
    using LibSafeMath for uint256;

    /// @dev Syncs rewards for a delegator. This includes transferring WETH
    ///      rewards to the delegator, and adding/removing
    ///      dependencies on cumulative rewards.
    ///      This is used by a delegator when they want to sync their rewards
    ///      without delegating/undelegating. It's effectively the same as
    ///      delegating zero stake.
    /// @param poolId Unique id of pool.
    function withdrawDelegatorRewards(bytes32 poolId)
        external
    {
        address member = msg.sender;

        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner =
            _loadSyncedBalance(_delegatedStakeToPoolByOwner[member][poolId]);

        _withdrawAndSyncDelegatorRewards(
            poolId,
            member,
            // Initial balance
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[member][poolId]),
            finalDelegatedStakeToPoolByOwner
        );

        // Update stored balance with synchronized version; this prevents
        // redundant withdrawals.
        _delegatedStakeToPoolByOwner[member][poolId] =
            finalDelegatedStakeToPoolByOwner;
    }

    /// @dev Computes the reward balance in ETH of the operator of a pool.
    ///      This does not include the balance in the ETH vault.
    /// @param poolId Unique id of pool.
    /// @return totalReward Balance in ETH.
    function computeRewardBalanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256 reward)
    {
        // Because operator rewards are immediately sent to the ETH vault
        // on finalization, the only factor in this function are unfinalized
        // rewards.
        IStructs.Pool memory pool = _poolById[poolId];
        // Get any unfinalized rewards.
        (uint256 unfinalizedTotalRewards, uint256 unfinalizedMembersStake) =
            _getUnfinalizedPoolRewards(poolId);

        // Get the operators' portion.
        (reward,) = _computePoolRewardsSplit(
            pool.operatorShare,
            unfinalizedTotalRewards,
            unfinalizedMembersStake
        );
        return reward;
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    ///      This does not include the balance in the ETH vault.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @return totalReward Balance in ETH.
    function computeRewardBalanceOfDelegator(bytes32 poolId, address member)
        external
        view
        returns (uint256 reward)
    {
        IStructs.Pool memory pool = _poolById[poolId];
        // Get any unfinalized rewards.
        (uint256 unfinalizedTotalRewards, uint256 unfinalizedMembersStake) =
            _getUnfinalizedPoolRewards(poolId);

        // Get the members' portion.
        (, uint256 unfinalizedMembersReward) = _computePoolRewardsSplit(
            pool.operatorShare,
            unfinalizedTotalRewards,
            unfinalizedMembersStake
        );
        return _computeDelegatorReward(
            poolId,
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[member][poolId]),
            currentEpoch,
            unfinalizedMembersReward,
            unfinalizedMembersStake
        );
    }

    /// @dev Syncs rewards for a delegator. This includes transferring rewards
    ///      from the Reward Vault to the Eth Vault, and adding/removing
    ///      dependencies on cumulative rewards.
    /// @param poolId Unique id of pool.
    /// @param member of the pool.
    /// @param initialDelegatedStakeToPoolByOwner The member's delegated
    ///        balance at the beginning of this transaction.
    /// @param finalDelegatedStakeToPoolByOwner The member's delegated balance
    ///        at the end of this transaction.
    function _withdrawAndSyncDelegatorRewards(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory initialDelegatedStakeToPoolByOwner,
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner
    )
        internal
    {
        // Transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the
        // delegator pool.
        _finalizePoolAndWithdrawDelegatorRewards(
            poolId,
            member,
            initialDelegatedStakeToPoolByOwner,
            currentEpoch
        );

        // Add dependencies on cumulative rewards for this epoch and the next
        // epoch, if necessary.
        _setCumulativeRewardDependenciesForDelegator(
            poolId,
            finalDelegatedStakeToPoolByOwner,
            true
        );

        // Remove dependencies on previous cumulative rewards, if they are no
        // longer needed.
        _setCumulativeRewardDependenciesForDelegator(
            poolId,
            initialDelegatedStakeToPoolByOwner,
            false
        );
    }

    /// @dev Handles a pool's reward at the current epoch.
    ///      This will split the reward between the operator and members,
    ///      depositing them into their respective vaults, and update the
    ///      accounting needed to allow members to withdraw their individual
    ///      rewards.
    /// @param poolId Unique Id of pool.
    /// @param reward received by the pool.
    /// @param membersStake the amount of non-operator delegated stake that
    ///        will split the  reward.
    /// @return operatorReward Portion of `reward` given to the pool operator.
    /// @return membersReward Portion of `reward` given to the pool members.
    function _syncPoolRewards(
        bytes32 poolId,
        uint256 reward,
        uint256 membersStake
    )
        internal
        returns (uint256 operatorReward, uint256 membersReward)
    {
        IStructs.Pool memory pool = _poolById[poolId];

        // Split the reward between operator and members
        (operatorReward, membersReward) = _computePoolRewardsSplit(
            pool.operatorShare,
            reward,
            membersStake
        );
        // Transfer the operator's weth reward to the operator
        _getWethContract().transfer(pool.operator, operatorReward);

        if (membersReward == 0) {
            return (0, 0);
        }
        // Increment the balance of the pool
        balanceByPoolId[poolId] = balanceByPoolId[poolId].safeAdd(membersReward);

        // Fetch the last epoch at which we stored an entry for this pool;
        // this is the most up-to-date cumulative rewards for this pool.
        IStructs.Fraction memory mostRecentCumulativeReward =
            _getMostRecentCumulativeReward(poolId);

        // Compute new cumulative reward
        IStructs.Fraction memory cumulativeReward;
        (cumulativeReward.numerator, cumulativeReward.denominator) =
            LibFractions.add(
                mostRecentCumulativeReward.numerator,
                mostRecentCumulativeReward.denominator,
                membersReward,
                membersStake
            );
        // Normalize to prevent overflows.
        (cumulativeReward.numerator, cumulativeReward.denominator) =
            LibFractions.normalize(
                cumulativeReward.numerator,
                cumulativeReward.denominator
            );

        // Store cumulative rewards for this epoch.
        _forceSetCumulativeReward(
            poolId,
            currentEpoch,
            cumulativeReward
        );

        return (operatorReward, membersReward);
    }

    /// @dev Compute the split of a pool reward between the operator and members
    ///      based on the `operatorShare` and `membersStake`.
    /// @param operatorShare The fraction of rewards owed to the operator,
    ///        in PPM.
    /// @param totalReward The pool reward.
    /// @param membersStake The amount of member (non-operator) stake delegated
    ///        to the pool in the epoch the rewards were earned.
    /// @return operatorReward Portion of `totalReward` given to the pool operator.
    /// @return membersReward Portion of `totalReward` given to the pool members.
    function _computePoolRewardsSplit(
        uint32 operatorShare,
        uint256 totalReward,
        uint256 membersStake
    )
        internal
        pure
        returns (uint256 operatorReward, uint256 membersReward)
    {
        if (membersStake == 0) {
            operatorReward = totalReward;
        } else {
            operatorReward = LibMath.getPartialAmountCeil(
                uint256(operatorShare),
                PPM_DENOMINATOR,
                totalReward
            );
            membersReward = totalReward - operatorReward;
        }
        return (operatorReward, membersReward);
    }

    /// @dev Transfers a delegators accumulated rewards to the delegator.
    ///      This is required before the member's stake in the pool can be modified.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @param unsyncedStake Unsynced stake of the delegator to the pool.
    function _finalizePoolAndWithdrawDelegatorRewards(
        bytes32 poolId,
        address member,
        IStructs.StoredBalance memory unsyncedStake,
        uint256 currentEpoch
    )
        private
    {
        // Ensure the pool is finalized.
        finalizePool(poolId);

        // Compute balance owed to delegator
        uint256 balance = _computeDelegatorReward(
            poolId,
            unsyncedStake,
            currentEpoch,
            // No unfinalized values because we ensured the pool is already
            // finalized.
            0,
            0
        );
        if (balance == 0) {
            return;
        }

        // Decrement the balance of the pool
        balanceByPoolId[poolId] = balanceByPoolId[poolId].safeSub(balance);

        // Withdraw the member's WETH balance
        _getWethContract().transfer(member, balance);
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param unsyncedStake Unsynced delegated stake to pool by owner
    /// @param currentEpoch The epoch in which this call is executing
    /// @param unfinalizedMembersReward Unfinalized total members reward
    ///        (if any).
    /// @param unfinalizedMembersStake Unfinalized total members stake (if any).
    /// @return totalReward Balance in ETH.
    function _computeDelegatorReward(
        bytes32 poolId,
        IStructs.StoredBalance memory unsyncedStake,
        uint256 currentEpoch,
        uint256 unfinalizedMembersReward,
        uint256 unfinalizedMembersStake
    )
        private
        view
        returns (uint256 reward)
    {
        // There can be no rewards in epoch 0 because there is no delegated
        // stake.
        if (currentEpoch == 0) {
            return 0;
        }

        // There can be no rewards if the last epoch when stake was synced is
        // equal to the current epoch, because all prior rewards, including
        // rewards finalized this epoch have been claimed.
        if (unsyncedStake.currentEpoch == currentEpoch) {
            return 0;
        }

        // If there are unfinalized rewards this epoch, compute the member's
        // share.
        if (unfinalizedMembersReward != 0 && unfinalizedMembersStake != 0) {
            // Unfinalized rewards are always earned from stake in
            // the prior epoch so we want the stake at `currentEpoch-1`.
            uint256 _stake = unsyncedStake.currentEpoch >= currentEpoch.safeSub(1) ?
                unsyncedStake.currentEpochBalance :
                unsyncedStake.nextEpochBalance;
            if (_stake != 0) {
                reward = LibMath.getPartialAmountFloor(
                    unfinalizedMembersReward,
                    unfinalizedMembersStake,
                    _stake
                );
            }
        }

        // Get the last epoch where a reward was credited to this pool, which
        // also happens to be when we last created a cumulative reward entry.
        uint256 lastRewardEpoch = _cumulativeRewardsByPoolLastStored[poolId];

        // If the stake has been touched since the last reward epoch,
        // it has already been claimed.
        if (unsyncedStake.currentEpoch >= lastRewardEpoch) {
            return reward;
        }
        // From here we know: `unsyncedStake.currentEpoch < currentEpoch > 0`.

        uint256 nextStakeEpoch = uint256(unsyncedStake.currentEpoch).safeAdd(1);
        reward = reward.safeAdd(
            _computeMemberRewardOverInterval(
                poolId,
                unsyncedStake.currentEpochBalance,
                unsyncedStake.currentEpoch,
                nextStakeEpoch
            )
        );
        if (nextStakeEpoch < lastRewardEpoch) {
            reward = reward.safeAdd(
                _computeMemberRewardOverInterval(
                    poolId,
                    unsyncedStake.nextEpochBalance,
                    nextStakeEpoch,
                    lastRewardEpoch
                )
            );
        }
        return reward;
    }

    /// @dev Adds or removes cumulative reward dependencies for a delegator.
    ///      A delegator always depends on the cumulative reward for the current
    ///      and next epoch, if they would still have stake in the next epoch.
    /// @param poolId Unique id of pool.
    /// @param _delegatedStakeToPoolByOwner Amount of stake the member has
    ///        delegated to the pool.
    /// @param isDependent is true iff adding a dependency. False, otherwise.
    function _setCumulativeRewardDependenciesForDelegator(
        bytes32 poolId,
        IStructs.StoredBalance memory _delegatedStakeToPoolByOwner,
        bool isDependent
    )
        private
    {
        // If this delegator is not yet initialized then there's no dependency
        // to unset.
        if (!isDependent && !_delegatedStakeToPoolByOwner.isInitialized) {
            return;
        }

        // Get the most recent cumulative reward, which will serve as a
        // reference point when updating dependencies
        IStructs.Fraction memory mostRecentCumulativeReward =
            _getMostRecentCumulativeReward(poolId);

        // Record dependency on current epoch.
        if (_delegatedStakeToPoolByOwner.currentEpochBalance != 0
            || _delegatedStakeToPoolByOwner.nextEpochBalance != 0)
        {
            _addOrRemoveDependencyOnCumulativeReward(
                poolId,
                _delegatedStakeToPoolByOwner.currentEpoch,
                mostRecentCumulativeReward,
                isDependent
            );
        }

        // Record dependency on the next epoch
        if (_delegatedStakeToPoolByOwner.nextEpochBalance != 0) {
            _addOrRemoveDependencyOnCumulativeReward(
                poolId,
                uint256(_delegatedStakeToPoolByOwner.currentEpoch).safeAdd(1),
                mostRecentCumulativeReward,
                isDependent
            );
        }
    }
}
