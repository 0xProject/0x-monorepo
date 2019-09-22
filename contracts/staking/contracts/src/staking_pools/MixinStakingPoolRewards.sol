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
    MixinCumulativeRewards,
    MixinAbstract
{
    using LibSafeMath for uint256;

    /// @dev Syncs rewards for a delegator. This includes transferring rewards from
    /// the Reward Vault to the Eth Vault, and adding/removing dependencies on cumulative rewards.
    /// This is used by a delegator when they want to sync their rewards without delegating/undelegating.
    /// It's effectively the same as delegating zero stake.
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
        returns (uint256 reward)
    {
        IStructs.PoolRewards memory unfinalizedPoolRewards =
            _getUnfinalizedPoolRewards(poolId);
        reward = _computeRewardBalanceOfDelegator(
            poolId,
            member,
            unfinalizedPoolRewards.membersReward,
            unfinalizedPoolRewards.membersStake
        );
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member The member of the pool.
    /// @param unfinalizedMembersReward Unfinalized memeber reward for
    ///        this pool in the current epoch.
    /// @param unfinalizedDelegatedStake Unfinalized total delegated stake for
    ///        this pool in the current epoch.
    /// @return totalReward Balance in ETH.
    function _computeRewardBalanceOfDelegator(
        bytes32 poolId,
        address member,
        uint256 unfinalizedMembersReward,
        uint256 unfinalizedDelegatedStake
    )
        internal
        view
        returns (uint256 reward)
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
        uint256 amountOfDelegatedStake
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

        // Fetch the last epoch at which we stored an entry for this pool;
        // this is the most up-to-date cumulative rewards for this pool.
        uint256 cumulativeRewardsLastStored = _cumulativeRewardsByPoolLastStored[poolId];
        IStructs.Fraction memory mostRecentCumulativeRewards = _cumulativeRewardsByPoolPtr[cumulativeRewardsLastStored];

        // Compute new cumulative reward
        (uint256 numerator, uint256 denominator) = LibFractions.addFractions(
            mostRecentCumulativeRewards.numerator,
            mostRecentCumulativeRewards.denominator,
            membersPortion,
            amountOfDelegatedStake
        );

        // Normalize fraction components by dividing by the minimum denominator.
        uint256 minDenominator =
            mostRecentCumulativeRewards.denominator <= amountOfDelegatedStake ?
            mostRecentCumulativeRewards.denominator :
            amountOfDelegatedStake;
        minDenominator = minDenominator == 0 ? 1 : minDenominator;
        (uint256 numeratorNormalized, uint256 denominatorNormalized) = (
            numerator.safeDiv(minDenominator),
            denominator.safeDiv(minDenominator)
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
        uint256 currentEpoch = getCurrentEpoch();
        // There can be no rewards in epoch 0 because there is no delegated
        // stake.
        if (currentEpoch == 0) {
            return reward = 0;
        }

        IStructs.StoredBalance memory stake =
            _loadUnsyncedBalance(delegatedStakeToPoolByOwner[member][poolId]);
        // There can be no rewards if the last epoch when stake was synced is
        // equal to the current epoch, because all prior rewards, including
        // rewards finalized this epoch have been claimed.
        if (stake.currentEpoch == currentEpoch) {
            return reward = 0;
        }

        // From here we know:
        //   1. `currentEpoch > 0`
        //   2. `stake.currentEpoch < currentEpoch`.

        // Get the last epoch where a reward was credited to this pool.
        uint256 lastRewardEpoch = cumulativeRewardsByPoolLastStored[poolId];

        // If there are unfinalized rewards this epoch, compute the member's
        // share.
        if (unfinalizedMembersReward != 0 && unfinalizedDelegatedStake != 0) {
            // Unfinalized rewards are always earned from stake in
            // the prior epoch so we want the stake at `currentEpoch-1`.
            uint256 _stake = stake.currentEpoch == currentEpoch - 1 ?
                stake.currentEpochBalance :
                stake.nextEpochBalance;
            if (_stake != 0) {
                reward = _stake
                    .safeMul(unfinalizedMembersReward)
                    .safeDiv(unfinalizedDelegatedStake);
            }
            // Add rewards up to the last reward epoch.
            if (lastRewardEpoch != 0 && lastRewardEpoch > stake.currentEpoch) {
                reward = reward.safeAdd(
                    _computeMemberRewardOverInterval(
                        poolId,
                        stake,
                        stake.currentEpoch,
                        stake.currentEpoch + 1
                    )
                );
                if (lastRewardEpoch > stake.currentEpoch + 1) {
                    reward = reward.safeAdd(
                        _computeMemberRewardOverInterval(
                            poolId,
                            stake,
                            stake.currentEpoch + 1,
                            lastRewardEpoch
                        )
                    );
                }
            }
        // Otherwise get the rewards earned up to the last reward epoch.
        } else if (stake.currentEpoch < lastRewardEpoch) {
            reward = _computeMemberRewardOverInterval(
                poolId,
                stake,
                stake.currentEpoch,
                stake.currentEpoch + 1
            );
            if (lastRewardEpoch > stake.currentEpoch + 1) {
                reward = _computeMemberRewardOverInterval(
                    poolId,
                    stake,
                    stake.currentEpoch + 1,
                    lastRewardEpoch
                ).safeSub(reward);
            }
        }
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
