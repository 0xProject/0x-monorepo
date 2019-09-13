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
    struct RecordedReward {
        uint256 membersReward;
        uint256 membersStake;
    }

    struct DepositedReward {
        uint256 totalReward;
        bool operatorOnly;
    }
    mapping (bytes32 => uint32) internal _operatorSharesByPool;
    mapping (bytes32 => RecordedReward) internal _recordedRewardsByPool;
    mapping (bytes32 => DepositedReward) internal _depositedRewardsByPool;

    function getFinalizationState()
        external
        view
        returns (
            uint256 _closingEpoch,
            uint256 _unfinalizedPoolsRemaining,
            uint256 _unfinalizedRewardsAvailable,
            uint256 _unfinalizedTotalFeesCollected,
            uint256 _unfinalizedTotalWeightedStake
        )
    {
        _closingEpoch = currentEpoch - 1;
        _unfinalizedPoolsRemaining = unfinalizedPoolsRemaining;
        _unfinalizedRewardsAvailable = unfinalizedRewardsAvailable;
        _unfinalizedTotalFeesCollected = unfinalizedTotalFeesCollected;
        _unfinalizedTotalWeightedStake = unfinalizedTotalWeightedStake;
    }

    function addActivePool(
        bytes32 poolId,
        uint32 operatorShare,
        uint256 feesCollected,
        uint256 membersStake,
        uint256 weightedStake
    )
        external
    {
        mapping (bytes32 => IStructs.ActivePool) storage activePools =
            _getActivePoolsFromEpoch(currentEpoch);
        assert(activePools[poolId].feesCollected == 0);
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

    /// @dev Overridden to just store inputs.
    function _recordRewardForDelegators(
        bytes32 poolId,
        uint256 membersReward,
        uint256 membersStake
    )
        internal
    {
        _recordedRewardsByPool[poolId] = RecordedReward({
            membersReward: membersReward,
            membersStake: membersStake
        });
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
        _depositedRewardsByPool[poolId] = DepositedReward({
            totalReward: totalReward,
            operatorOnly: operatorOnly
        });

        if (operatorOnly) {
            operatorPortion = totalReward;
        } else {
            (operatorPortion, membersPortion) =
                _splitAmountBetweenOperatorAndMembers(poolId, totalReward);
        }
    }

    /// @dev Overridden to do some really basic math.
    function _splitAmountBetweenOperatorAndMembers(
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

    /// @dev Overriden to always succeed.
    function _goToNextEpoch() internal {
        currentEpoch += 1;
    }

    /// @dev Overridden to do nothing.
    function _unwrapWETH() internal {
        // NOOP
    }
}
