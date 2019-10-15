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
import "../src/libs/LibCobbDouglas.sol";
import "./TestStakingNoWETH.sol";


contract TestFinalizer is
    TestStakingNoWETH
{
    event DepositStakingPoolRewards(
        bytes32 poolId,
        uint256 reward,
        uint256 membersStake
    );

    struct UnfinalizedPoolReward {
        uint256 totalReward;
        uint256 membersStake;
    }

    struct FinalizedPoolRewards {
        uint256 operatorReward;
        uint256 membersReward;
        uint256 membersStake;
    }

    address payable private _operatorRewardsReceiver;
    address payable private _membersRewardsReceiver;
    mapping (bytes32 => uint32) private _operatorSharesByPool;

    /// @param operatorRewardsReceiver The address to transfer rewards into when
    ///        a pool is finalized.
    constructor(
        address payable operatorRewardsReceiver,
        address payable membersRewardsReceiver
    )
        public
    {
        _addAuthorizedAddress(msg.sender);
        init();
        _operatorRewardsReceiver = operatorRewardsReceiver;
        _membersRewardsReceiver = membersRewardsReceiver;
        _removeAuthorizedAddressAtIndex(msg.sender, 0);
    }

    /// @dev Activate a pool in the current epoch.
    function addPoolStats(
        bytes32 poolId,
        uint32 operatorShare,
        uint256 feesCollected,
        uint256 membersStake,
        uint256 weightedStake
    )
        external
    {
        require(feesCollected > 0, "FEES_MUST_BE_NONZERO");
        mapping (bytes32 => IStructs.PoolStats) storage rewardStatsByPoolId = _poolStatsByEpoch[currentEpoch];
        IStructs.PoolStats memory poolStats = rewardStatsByPoolId[poolId];
        require(poolStats.feesCollected == 0, "POOL_ALREADY_ADDED");
        _operatorSharesByPool[poolId] = operatorShare;
        rewardStatsByPoolId[poolId] = IStructs.PoolStats({
            feesCollected: feesCollected,
            membersStake: membersStake,
            weightedStake: weightedStake
        });
        _aggregatedStatsByEpoch[currentEpoch].totalFeesCollected += feesCollected;
        _aggregatedStatsByEpoch[currentEpoch].totalWeightedStake += weightedStake;
        _aggregatedStatsByEpoch[currentEpoch].poolsRemaining += 1;
    }

    /// @dev Drain the balance of this contract.
    function drainBalance()
        external
    {
        address(0).transfer(address(this).balance);
    }

    /// @dev Compute Cobb-Douglas.
    function cobbDouglas(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake
    )
        external
        view
        returns (uint256 ownerRewards)
    {
        ownerRewards = LibCobbDouglas.cobbDouglas(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            cobbDouglasAlphaNumerator,
            cobbDouglasAlphaDenominator
        );
    }

    /// @dev Expose `_getUnfinalizedPoolReward()`
    function getUnfinalizedPoolRewards(bytes32 poolId)
        external
        view
        returns (UnfinalizedPoolReward memory reward)
    {
        (IStructs.PoolStats memory poolStats, uint256 unsettledRewards) = _computeFeeRewardForPool(poolId);
        reward.totalReward = unsettledRewards;
        reward.membersStake = poolStats.membersStake;
    }

    /// @dev Expose `_getPoolStatsFromEpoch`.
    function getPoolStatsFromEpoch(uint256 epoch, bytes32 poolId)
        external
        view
        returns (IStructs.PoolStats memory)
    {
        return _poolStatsByEpoch[epoch][poolId];
    }

    /// @dev Overridden to log and transfer to receivers.
    function _syncPoolRewards(
        bytes32 poolId,
        uint256 reward,
        uint256 membersStake
    )
        internal
        returns (uint256 operatorReward, uint256 membersReward)
    {
        uint32 operatorShare = _operatorSharesByPool[poolId];
        (operatorReward, membersReward) = _computePoolRewardsSplit(
            operatorShare,
            reward,
            membersStake
        );
        address(_operatorRewardsReceiver).transfer(operatorReward);
        address(_membersRewardsReceiver).transfer(membersReward);
        emit DepositStakingPoolRewards(poolId, reward, membersStake);
    }

    /// @dev Overriden to just increase the epoch counter.
    function _goToNextEpoch() internal {
        currentEpoch += 1;
    }
}
