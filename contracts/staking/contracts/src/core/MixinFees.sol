/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.5.5;

import "../interfaces/IVault.sol";
import "../libs/LibZrxToken.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinStakeBalances.sol";
import "./MixinEpoch.sol";
import "./MixinPools.sol";
import "../interfaces/IStructs.sol";
import "../libs/LibMath.sol";


contract MixinFees is
    SafeMath,
    IStakingEvents,
    IStructs,
    MixinConstants,
    MixinStorage,
    MixinEpoch,
    MixinStakeBalances,
    MixinPools
{

    function _payProtocolFee(address makerAddress, uint256 amount)
        internal
    {
        bytes32 poolId = _getMakerPoolId(makerAddress);
        uint256 _feesCollectedThisEpoch = protocolFeesThisEpochByPool[poolId];
        protocolFeesThisEpochByPool[poolId] = _safeAdd(_feesCollectedThisEpoch, amount);
        if (_feesCollectedThisEpoch == 0) {
            activePoolIdsThisEpoch.push(poolId);
        }
    }

    function _getProtocolFeesThisEpochByPool(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return protocolFeesThisEpochByPool[poolId];
    }


    function _getTotalProtocolFeesThisEpoch()
        internal
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    event E(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake
    );
    function _payRebates()
        internal
    {
        // Step 1 - compute total fees this epoch
        uint256 numberOfActivePoolIds = activePoolIdsThisEpoch.length;
        ActivePool[] memory activePoolIds = new ActivePool[](activePoolIdsThisEpoch.length);
        uint256 totalFees = 0;
        for (uint i = 0; i != numberOfActivePoolIds; i++) {
            activePoolIds[i].poolId = activePoolIdsThisEpoch[i];
            activePoolIds[i].feesCollected = protocolFeesThisEpochByPool[activePoolIds[i].poolId];
            totalFees = _safeAdd(totalFees, activePoolIds[i].feesCollected);
        }
        uint256 totalRewards = address(this).balance;
        uint256 totalStake = _getActivatedStakeAcrossAllOwners();

        // no rebates available
        // note that there is a case in cobb-douglas where if we weigh either fees or stake at 100%,
        // then the other value doesn't matter. However, it's cheaper on gas to assume that there is some
        // non-zero split.
        if (totalRewards == 0 || totalFees == 0 || totalStake == 0) {
            revert("We don't want to hit this case in testing");
            return;
        }

        // Step 2 - payout
        uint256 totalRewardsRecordedInVault = 0;
        for (uint i = 0; i != numberOfActivePoolIds; i++) {
            uint256 stakeDelegatedToPool = _getStakeDelegatedToPool(activePoolIds[i].poolId);
            uint256 stakeHeldByPoolOperator = _getActivatedAndUndelegatedStake(_getPoolOperator(activePoolIds[i].poolId));
            uint256 scaledStake = _safeAdd(
                stakeHeldByPoolOperator,
                _safeDiv(
                    _safeMul(
                        stakeDelegatedToPool,
                        REWARD_PAYOUT_DELEGATED_STAKE_PERCENT_VALUE
                    ),
                    100
                )
            );
            emit E(
                totalRewards,
                activePoolIds[i].feesCollected,
                totalFees,
                scaledStake,
                totalStake
            );
            uint256 reward = LibMath._cobbDouglasSuperSimplified(
                totalRewards,
                activePoolIds[i].feesCollected,
                totalFees,
                scaledStake,
                totalStake
            );

            // record reward in vault
            rewardVault.recordDepositFor(activePoolIds[i].poolId, reward);
            totalRewardsRecordedInVault = _safeAdd(totalRewardsRecordedInVault, reward);

            // clear state for refunds
            protocolFeesThisEpochByPool[activePoolIds[i].poolId] = 0;
            activePoolIdsThisEpoch[i] = 0;
        }
        activePoolIdsThisEpoch.length = 0;

        // Step 3 send total payout to vault
        require(
            totalRewardsRecordedInVault <= totalRewards,
            "MISCALCULATED_REWARDS"
        );
        if (totalRewardsRecordedInVault > 0) {
            address payable rewardVaultAddress = address(uint160(address(rewardVault)));
            rewardVaultAddress.transfer(totalRewardsRecordedInVault);
        }
    }
}