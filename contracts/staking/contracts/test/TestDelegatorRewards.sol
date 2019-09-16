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

import "../src/interfaces/IStructs.sol";
import "./TestStaking.sol";


contract TestDelegatorRewards is
    TestStaking
{
    event Deposit(
        bytes32 poolId,
        address member,
        uint256 balance
    );

    event FinalizePool(
        bytes32 poolId,
        uint256 reward,
        uint256 stake
    );

    struct UnfinalizedMembersReward {
        uint256 reward;
        uint256 stake;
    }

    constructor() public {
        init();
    }

    mapping (uint256 => mapping (bytes32 => UnfinalizedMembersReward)) private
        unfinalizedMembersRewardByPoolByEpoch;

    /// @dev Expose _finalizePool
    function internalFinalizePool(bytes32 poolId) external {
        _finalizePool(poolId);
    }

    /// @dev Set unfinalized members reward for a pool in the current epoch.
    function setUnfinalizedMembersRewards(
        bytes32 poolId,
        uint256 membersReward,
        uint256 membersStake
    )
        external
    {
        unfinalizedMembersRewardByPoolByEpoch[currentEpoch][poolId] =
            UnfinalizedMembersReward({
                reward: membersReward,
                stake: membersStake
            });
    }

    /// @dev Advance the epoch.
    function advanceEpoch() external {
        currentEpoch += 1;
    }

    /// @dev Create and delegate stake that is active in the current epoch.
    ///      Only used to test purportedly unreachable states.
    ///      Also withdraws pending rewards to the eth vault.
    function delegateStakeNow(
        address delegator,
        bytes32 poolId,
        uint256 stake
    )
        external
    {
        _transferDelegatorsAccumulatedRewardsToEthVault(poolId, delegator);
        _syncCumulativeRewardsNeededByDelegator(poolId, currentEpoch);
        IStructs.StoredBalance storage _stake =
            delegatedStakeToPoolByOwner[delegator][poolId];
        _stake.currentEpochBalance += uint96(stake);
        _stake.nextEpochBalance += uint96(stake);
        _stake.currentEpoch = uint64(currentEpoch);
    }

    /// @dev Create and delegate stake that will occur in the next epoch
    ///      (normal behavior).
    ///      Also withdraws pending rewards to the eth vault.
    function delegateStake(
        address delegator,
        bytes32 poolId,
        uint256 stake
    )
        external
    {
        _transferDelegatorsAccumulatedRewardsToEthVault(poolId, delegator);
        _syncCumulativeRewardsNeededByDelegator(poolId, currentEpoch);
        IStructs.StoredBalance storage _stake =
            delegatedStakeToPoolByOwner[delegator][poolId];
        if (_stake.currentEpoch < currentEpoch) {
            _stake.currentEpochBalance = _stake.nextEpochBalance;
        }
        _stake.nextEpochBalance += uint96(stake);
        _stake.currentEpoch = uint64(currentEpoch);
    }

    /// @dev Clear stake that will occur in the next epoch
    ///      (normal behavior).
    ///      Also withdraws pending rewards to the eth vault.
    function undelegateStake(
        address delegator,
        bytes32 poolId,
        uint256 stake
    )
        external
    {
        _transferDelegatorsAccumulatedRewardsToEthVault(poolId, delegator);
        _syncCumulativeRewardsNeededByDelegator(poolId, currentEpoch);
        IStructs.StoredBalance storage _stake =
            delegatedStakeToPoolByOwner[delegator][poolId];
        if (_stake.currentEpoch < currentEpoch) {
            _stake.currentEpochBalance = _stake.nextEpochBalance;
        }
        _stake.nextEpochBalance -= uint96(stake);
        _stake.currentEpoch = uint64(currentEpoch);
    }

    /// @dev Expose `_recordDepositInRewardVaultFor`.
    function recordRewardForDelegators(
        bytes32 poolId,
        uint256 reward,
        uint256 amountOfDelegatedStake
    )
        external
    {
        _recordRewardForDelegators(poolId, reward, amountOfDelegatedStake);
    }

    /// @dev Overridden to just emit events.
    function _transferMemberBalanceToEthVault(
        bytes32 poolId,
        address member,
        uint256 balance
    )
        internal
    {
        emit Deposit(
            poolId,
            member,
            balance
        );
    }

    /// @dev Overridden to realize unfinalizedMembersRewardByPoolByEpoch in
    ///      the current epoch and eit a event,
    function _finalizePool(bytes32 poolId)
        internal
        returns (IStructs.PoolRewards memory rewards)
    {
        UnfinalizedMembersReward memory reward =
            unfinalizedMembersRewardByPoolByEpoch[currentEpoch][poolId];
        delete unfinalizedMembersRewardByPoolByEpoch[currentEpoch][poolId];
        rewards.membersReward = reward.reward;
        rewards.membersStake = reward.stake;
        _recordRewardForDelegators(poolId, reward.reward, reward.stake);
        emit FinalizePool(poolId, reward.reward, reward.stake);
    }

    /// @dev Overridden to use unfinalizedMembersRewardByPoolByEpoch.
    function _getUnfinalizedPoolRewards(bytes32 poolId)
        internal
        view
        returns (IStructs.PoolRewards memory rewards)
    {
        UnfinalizedMembersReward storage reward =
            unfinalizedMembersRewardByPoolByEpoch[currentEpoch][poolId];
        rewards.membersReward = reward.reward;
        rewards.membersStake = reward.stake;
    }
}
