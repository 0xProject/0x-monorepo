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

import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../interfaces/IVault.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinStakeBalances.sol";
import "./MixinEpoch.sol";
import "./MixinPools.sol";
import "./MixinExchange.sol";
import "./MixinRewardVault.sol";
import "../interfaces/IStructs.sol";
import "../libs/LibMath.sol";


contract MixinFees is
    // libraries
    SafeMath,
    // interfaces
    IStakingEvents,
    IStructs,
    // immutables
    MixinConstants,
    MixinStorage,
    // standalones
    MixinEpoch,
    MixinExchange,
    MixinRewardVault,
    // staking logic
    MixinStakeBalances,
    MixinPools
{

    function payProtocolFee(address makerAddress)
        external
        payable
        onlyExchange
    {
        uint256 amount = msg.value;
        bytes32 poolId = getMakerPoolId(makerAddress);
        uint256 _feesCollectedThisEpoch = protocolFeesThisEpochByPool[poolId];
        protocolFeesThisEpochByPool[poolId] = _safeAdd(_feesCollectedThisEpoch, amount);
        if (_feesCollectedThisEpoch == 0) {
            activePoolIdsThisEpoch.push(poolId);
        }
    }

    function finalizeFees()
        external
    {
        _payRebates();
        _goToNextEpoch();
    }

    function getProtocolFeesThisEpochByPool(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return protocolFeesThisEpochByPool[poolId];
    }

    function getTotalProtocolFeesThisEpoch()
        public
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
        uint256 totalStake = getActivatedStakeAcrossAllOwners();

        emit EpochFinalized(
            numberOfActivePoolIds,
            totalRewards,
            0
        );

        // no rebates available
        // note that there is a case in cobb-douglas where if we weigh either fees or stake at 100%,
        // then the other value doesn't matter. However, it's cheaper on gas to assume that there is some
        // non-zero split.
        if (totalRewards == 0 || totalFees == 0 || totalStake == 0) {
            return;
        }

        // Step 2 - payout
        uint256 totalRewardsRecordedInVault = 0;
        for (uint i = 0; i != numberOfActivePoolIds; i++) {
            uint256 stakeDelegatedToPool = getStakeDelegatedToPool(activePoolIds[i].poolId);
            uint256 stakeHeldByPoolOperator = getActivatedAndUndelegatedStake(getPoolOperator(activePoolIds[i].poolId));
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
            _recordDepositInRewardVault(activePoolIds[i].poolId, reward);
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
            _depositIntoRewardVault(totalRewardsRecordedInVault);
        }

        // Notify finalization
        emit EpochFinalized(
            numberOfActivePoolIds,
            totalRewards,
            totalRewardsRecordedInVault
        );
    }
}
