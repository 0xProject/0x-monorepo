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
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./MixinCumulativeRewards.sol";
import "../sys/MixinAbstract.sol";


contract MixinStakingPoolRewards is
    MixinAbstract,
    MixinCumulativeRewards
{
    using LibSafeMath for uint256;

    /// @dev Withdraws the caller's WETH rewards that have accumulated
    ///      until the last epoch.
    /// @param poolId Unique id of pool.
    function withdrawDelegatorRewards(bytes32 poolId)
        external
    {
        _withdrawAndSyncDelegatorRewards(poolId, msg.sender);
    }

    /// @dev Syncs rewards for a delegator. This includes withdrawing rewards
    ///      rewards and adding/removing dependencies on cumulative rewards.
    /// @param poolId Unique id of pool.
    /// @param member of the pool.
    function _withdrawAndSyncDelegatorRewards(
        bytes32 poolId,
        address member
    )
        internal
    {
        // Ensure the pool is finalized.
        _assertPoolFinalizedLastEpoch(poolId);

        // Compute balance owed to delegator
        uint256 balance = _computeDelegatorReward(
            poolId,
            member
        );

        // Sync the delegated stake balance. This will ensure future calls of
        // `_computeDelegatorReward` during this epoch will return 0, 
        // preventing a delegator from withdrawing more than once an epoch.
        _delegatedStakeToPoolByOwner[member][poolId] =
            _loadCurrentBalance(_delegatedStakeToPoolByOwner[member][poolId]);

        // Withdraw non-0 balance
        if (balance != 0) {
            // Decrease the balance of the pool
            _decreasePoolRewards(poolId, balance);

            // Withdraw the member's WETH balance
            getWethContract().transfer(member, balance);
        }

        // Ensure a cumulative reward entry exists for this epoch,
        // copying the previous epoch's CR if one doesn't exist already.
        _updateCumulativeReward(poolId);
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

        if (operatorReward > 0) {
            // Transfer the operator's weth reward to the operator
            getWethContract().transfer(pool.operator, operatorReward);
        }

        if (membersReward > 0) {
            // Increase the balance of the pool
            _increasePoolRewards(poolId, membersReward);
            // Create a cumulative reward entry at the current epoch.
            _addCumulativeReward(poolId, membersReward, membersStake);
        }

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
            membersReward = totalReward.safeSub(operatorReward);
        }
        return (operatorReward, membersReward);
    }

    /// @dev Computes the reward balance in ETH of a specific member of a pool.
    /// @param poolId Unique id of pool.
    /// @param member of the pool.
    /// @return reward Balance in WETH.
    function _computeDelegatorReward(
        bytes32 poolId,
        address member
    )
        private
        view
        returns (uint256 reward)
    {
        uint256 currentEpoch_ = currentEpoch;
        IStructs.StoredBalance memory delegatedStake = _delegatedStakeToPoolByOwner[member][poolId];

        // There can be no rewards if the last epoch when stake was stored is
        // equal to the current epoch, because all prior rewards, including
        // rewards finalized this epoch have been claimed.
        if (delegatedStake.currentEpoch == currentEpoch_) {
            return 0;
        }

        // We account for rewards over 2 intervals, below.

        // 1/2 Finalized rewards earned in epochs [`delegatedStake.currentEpoch + 1` .. `currentEpoch - 1`]
        uint256 delegatedStakeNextEpoch = uint256(delegatedStake.currentEpoch).safeAdd(1);
        reward = reward.safeAdd(
            _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.currentEpochBalance,
                delegatedStake.currentEpoch,
                delegatedStakeNextEpoch
            )
        );

        // 2/2 Finalized rewards earned in epoch `delegatedStake.currentEpoch`.
        reward = reward.safeAdd(
            _computeMemberRewardOverInterval(
                poolId,
                delegatedStake.nextEpochBalance,
                delegatedStakeNextEpoch,
                currentEpoch_
            )
        );

        return reward;
    }

    /// @dev Increases rewards for a pool.
    /// @param poolId Unique id of pool.
    /// @param amount Amount to increment rewards by.
    function _increasePoolRewards(bytes32 poolId, uint256 amount)
        private
    {
        rewardsByPoolId[poolId] = rewardsByPoolId[poolId].safeAdd(amount);
        wethReservedForPoolRewards = wethReservedForPoolRewards.safeAdd(amount);
    }

    /// @dev Decreases rewards for a pool.
    /// @param poolId Unique id of pool.
    /// @param amount Amount to decrement rewards by.
    function _decreasePoolRewards(bytes32 poolId, uint256 amount)
        private
    {
        rewardsByPoolId[poolId] = rewardsByPoolId[poolId].safeSub(amount);
        wethReservedForPoolRewards = wethReservedForPoolRewards.safeSub(amount);
    }
}
