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
import "../src/interfaces/IStakingPoolRewardVault.sol";
import "../src/interfaces/IEthVault.sol";
import "./TestStaking.sol";


contract TestDelegatorRewards is
    TestStaking
{
    event RecordDepositToEthVault(
        address owner,
        uint256 amount
    );

    event RecordDepositToRewardVault(
        bytes32 poolId,
        uint256 membersReward
    );

    event FinalizePool(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward,
        uint256 membersStake
    );

    struct UnfinalizedPoolReward {
        uint256 operatorReward;
        uint256 membersReward;
        uint256 membersStake;
    }

    constructor() public {
        init(
            address(1),
            address(1),
            address(1),
            address(1)
        );
        // Set this contract up as the eth and reward vault to intercept
        // deposits.
        ethVault = IEthVault(address(this));
        rewardVault = IStakingPoolRewardVault(address(this));
    }

    mapping (uint256 => mapping (bytes32 => UnfinalizedPoolReward)) private
        unfinalizedPoolRewardsByEpoch;

    /// @dev Expose _finalizePool
    function internalFinalizePool(bytes32 poolId) external {
        _finalizePool(poolId);
    }

    /// @dev Set unfinalized rewards for a pool in the current epoch.
    function setUnfinalizedPoolReward(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward,
        uint256 membersStake
    )
        external
    {
        unfinalizedPoolRewardsByEpoch[currentEpoch][poolId] =
            UnfinalizedPoolReward({
                operatorReward: operatorReward,
                membersReward: membersReward,
                membersStake: membersStake
            });
        _setOperatorShare(poolId, operatorReward, membersReward);
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
        _initGenesisCumulativeRewards(poolId);
        IStructs.StoredBalance memory initialStake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        IStructs.StoredBalance storage _stake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        _stake.isInitialized = true;
        _stake.currentEpochBalance += uint96(stake);
        _stake.nextEpochBalance += uint96(stake);
        _stake.currentEpoch = uint32(currentEpoch);
        _syncRewardsForDelegator(
            poolId,
            delegator,
            initialStake,
            _stake
        );
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
        _initGenesisCumulativeRewards(poolId);
        IStructs.StoredBalance memory initialStake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        IStructs.StoredBalance storage _stake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        if (_stake.currentEpoch < currentEpoch) {
            _stake.currentEpochBalance = _stake.nextEpochBalance;
        }
        _stake.isInitialized = true;
        _stake.nextEpochBalance += uint96(stake);
        _stake.currentEpoch = uint32(currentEpoch);
        _syncRewardsForDelegator(
            poolId,
            delegator,
            initialStake,
            _stake
        );
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
        _initGenesisCumulativeRewards(poolId);
        IStructs.StoredBalance memory initialStake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        IStructs.StoredBalance storage _stake =
            _delegatedStakeToPoolByOwner[delegator][poolId];
        if (_stake.currentEpoch < currentEpoch) {
            _stake.currentEpochBalance = _stake.nextEpochBalance;
        }
        _stake.isInitialized = true;
        _stake.nextEpochBalance -= uint96(stake);
        _stake.currentEpoch = uint32(currentEpoch);
        _syncRewardsForDelegator(
            poolId,
            delegator,
            initialStake,
            _stake
        );
    }

    /// @dev `IEthVault.recordDepositFor()`,` overridden to just emit events.
    function recordDepositFor(
        address owner,
        uint256 amount
    )
        external
    {
        emit RecordDepositToEthVault(
            owner,
            amount
        );
    }

    /// @dev `IStakingPoolRewardVault.recordDepositFor()`,`
    ///       overridden to just emit events.
    function recordDepositFor(
        bytes32 poolId,
        uint256 membersReward
    )
        external
    {
        emit RecordDepositToRewardVault(
            poolId,
            membersReward
        );
    }

    /// @dev Expose `_recordStakingPoolRewards`.
    function recordStakingPoolRewards(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward,
        uint256 membersStake
    )
        external
    {
        _setOperatorShare(poolId, operatorReward, membersReward);
        _recordStakingPoolRewards(
            poolId,
            operatorReward + membersReward,
            membersStake
        );
    }

    /// @dev Overridden to realize `unfinalizedPoolRewardsByEpoch` in
    ///      the current epoch and emit a event,
    function _finalizePool(bytes32 poolId)
        internal
        returns (
            uint256 operatorReward,
            uint256 membersReward,
            uint256 membersStake
        )
    {
        UnfinalizedPoolReward memory reward =
            unfinalizedPoolRewardsByEpoch[currentEpoch][poolId];
        delete unfinalizedPoolRewardsByEpoch[currentEpoch][poolId];

        _setOperatorShare(poolId, reward.operatorReward, reward.membersReward);

        uint256 totalRewards = reward.operatorReward + reward.membersReward;
        membersStake = reward.membersStake;
        (operatorReward, membersReward) =
            _recordStakingPoolRewards(poolId, totalRewards, membersStake);
        emit FinalizePool(poolId, operatorReward, membersReward, membersStake);
    }

    /// @dev Overridden to use unfinalizedPoolRewardsByEpoch.
    function _getUnfinalizedPoolRewards(bytes32 poolId)
        internal
        view
        returns (
            uint256 totalReward,
            uint256 membersStake
        )
    {
        UnfinalizedPoolReward storage reward =
            unfinalizedPoolRewardsByEpoch[currentEpoch][poolId];
        totalReward = reward.operatorReward + reward.membersReward;
        membersStake = reward.membersStake;
    }

    /// @dev Create a cumulative rewards entry for a pool if one doesn't
    ///      already exist to get around having to create pools in advance.
    function _initGenesisCumulativeRewards(bytes32 poolId)
        private
    {
        uint256 lastRewardEpoch = _cumulativeRewardsByPoolLastStored[poolId];
        IStructs.Fraction memory cumulativeReward  =
            _cumulativeRewardsByPool[poolId][lastRewardEpoch];
        if (!_isCumulativeRewardSet(cumulativeReward)) {
            _initializeCumulativeRewards(poolId);
        }
    }

    /// @dev Set the operator share of a pool based on reward ratios.
    function _setOperatorShare(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward
    )
        private
    {
        uint32 operatorShare = 0;
        uint256 totalReward = operatorReward + membersReward;
        if (totalReward != 0) {
            operatorShare = uint32(
                operatorReward * PPM_DENOMINATOR / totalReward
            );
        }
        _poolById[poolId].operatorShare = operatorShare;
    }

}
