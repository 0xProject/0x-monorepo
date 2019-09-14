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
import "../src/Staking.sol";


contract TestFinalizer is
    Staking
{
    event RecordRewardForDelegatorsCall(
        bytes32 poolId,
        uint256 membersReward,
        uint256 membersStake
    );

    event RecordDepositInRewardVaultForCall(
        bytes32 poolId,
        uint256 totalReward,
        bool operatorOnly
    );

    event DepositIntoStakingPoolRewardVaultCall(
        uint256 amount
    );

    mapping (bytes32 => uint32) internal _operatorSharesByPool;

    constructor() public {
        init();
    }

    /// @dev Get finalization-related state variables.
    function getFinalizationState()
        external
        view
        returns (
            uint256 _balance,
            uint256 _currentEpoch,
            uint256 _closingEpoch,
            uint256 _numActivePoolsThisEpoch,
            uint256 _totalFeesCollectedThisEpoch,
            uint256 _totalWeightedStakeThisEpoch,
            uint256 _unfinalizedPoolsRemaining,
            uint256 _unfinalizedRewardsAvailable,
            uint256 _unfinalizedTotalFeesCollected,
            uint256 _unfinalizedTotalWeightedStake
        )
    {
        _balance = address(this).balance;
        _currentEpoch = currentEpoch;
        _closingEpoch = currentEpoch - 1;
        _numActivePoolsThisEpoch = numActivePoolsThisEpoch;
        _totalFeesCollectedThisEpoch = totalFeesCollectedThisEpoch;
        _totalWeightedStakeThisEpoch = totalWeightedStakeThisEpoch;
        _unfinalizedPoolsRemaining = unfinalizedPoolsRemaining;
        _unfinalizedRewardsAvailable = unfinalizedRewardsAvailable;
        _unfinalizedTotalFeesCollected = unfinalizedTotalFeesCollected;
        _unfinalizedTotalWeightedStake = unfinalizedTotalWeightedStake;
    }

    /// @dev Activate a pool in the current epoch.
    function addActivePool(
        bytes32 poolId,
        uint32 operatorShare,
        uint256 feesCollected,
        uint256 membersStake,
        uint256 weightedStake
    )
        external
    {
        require(feesCollected > 0, "FEES_MUST_BE_NONZERO");
        mapping (bytes32 => IStructs.ActivePool) storage activePools =
            _getActivePoolsFromEpoch(currentEpoch);
        require(feesCollected > 0, "POOL_ALREADY_ADDED");
        _operatorSharesByPool[poolId] = operatorShare;
        activePools[poolId] = IStructs.ActivePool({
            feesCollected: feesCollected,
            membersStake: membersStake,
            weightedStake: weightedStake
        });
        totalFeesCollectedThisEpoch += feesCollected;
        totalWeightedStakeThisEpoch += weightedStake;
        numActivePoolsThisEpoch += 1;
    }

    /// @dev Expose `_getUnfinalizedPoolReward()`
    function internalGetUnfinalizedPoolRewards(bytes32 poolId)
        external
        view
        returns (IStructs.PoolRewards memory rewards)
    {
        rewards = _getUnfinalizedPoolRewards(poolId);
    }


    /// @dev Expose `_getActivePoolFromEpoch`.
    function internalGetActivePoolFromEpoch(uint256 epoch, bytes32 poolId)
        external
        view
        returns (IStructs.ActivePool memory pool)
    {
        pool = _getActivePoolFromEpoch(epoch, poolId);
    }


    /// @dev Expose `_finalizePool()`
    function internalFinalizePool(bytes32 poolId)
        external
        returns (IStructs.PoolRewards memory rewards)
    {
        rewards = _finalizePool(poolId);
    }

    /// @dev Overridden to just store inputs.
    function _recordRewardForDelegators(
        bytes32 poolId,
        uint256 membersReward,
        uint256 membersStake
    )
        internal
    {
        emit RecordRewardForDelegatorsCall(
            poolId,
            membersReward,
            membersStake
        );
    }

    /// @dev Overridden to store inputs and do some really basic math.
    function _depositIntoStakingPoolRewardVault(uint256 amount) internal {
        emit DepositIntoStakingPoolRewardVaultCall(amount);
    }

    /// @dev Overridden to store inputs and do some really basic math.
    function _recordDepositInRewardVaultFor(
        bytes32 poolId,
        uint256 totalReward,
        bool operatorOnly
    )
        internal
        returns (
            uint256 operatorPortion,
            uint256 membersPortion
        )
    {
        emit RecordDepositInRewardVaultForCall(
            poolId,
            totalReward,
            operatorOnly
        );

        if (operatorOnly) {
            operatorPortion = totalReward;
        } else {
            (operatorPortion, membersPortion) =
                _splitRewardAmountBetweenOperatorAndMembers(
                    poolId,
                    totalReward
                );
        }
    }

    /// @dev Overridden to do some really basic math.
    function _splitRewardAmountBetweenOperatorAndMembers(
        bytes32 poolId,
        uint256 amount
    )
        internal
        view
        returns (uint256 operatorPortion, uint256 membersPortion)
    {
        uint32 operatorShare = _operatorSharesByPool[poolId];
        operatorPortion = operatorShare * amount / PPM_DENOMINATOR;
        membersPortion = amount - operatorPortion;
    }

    /// @dev Overriden to just increase the epoch counter.
    function _goToNextEpoch() internal {
        currentEpoch += 1;
    }

    /// @dev Overridden to do nothing.
    function _unwrapWETH() internal {
        // NOOP
    }
}
