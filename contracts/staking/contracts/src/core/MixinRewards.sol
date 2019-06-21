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

import "../immutable/MixinStorage.sol";
import "../libs/LibRewards.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinStakeBalances.sol";
import "./MixinRewardVault.sol";

contract MixinRewards is
    SafeMath,
    LibRewards,
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinRewardVault,
    MixinStakeBalances
{
    // Pinciple - design any Mixin such that internal members are callable without messing up internal state
    //            any function that could mess up internal state should be private.

    // @TODO -- add a MixinZrxVault and a MixinRewardVault that interact with the vaults.

    function _computeRewardBalance(bytes32 poolId, address owner)
        internal
        view
        returns (uint256)
    {
        uint256 poolBalance = _balanceOfPoolInRewardVault(poolId);
        return _computePayoutDenominatedInRealAsset(
            delegatedStakeToPoolByOwner[owner][poolId],
            delegatedStakeByPoolId[poolId],
            shadowRewardsInPoolByOwner[owner][poolId],
            shadowRewardsByPoolId[poolId],
            poolBalance
        );
    }

    function _getShadowBalanceByPoolId(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return shadowRewardsByPoolId[poolId];
    }

    function _getShadowBalanceInPoolByOwner(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return shadowRewardsInPoolByOwner[owner][poolId];
    }

    function _withdrawOperatorReward(bytes32 poolId, uint256 amount)
        internal
    {
        _withdrawFromOperatorInRewardVault(poolId, amount);
        poolById[poolId].operatorAddress.transfer(amount);
    }

    function _withdrawReward(bytes32 poolId, address payable owner, uint256 amount)
        internal
    {
        uint256 ownerBalance = _computeRewardBalance(poolId, owner);
        require(
            amount <= ownerBalance,
            "INVALID_AMOUNT"
        );

        shadowRewardsInPoolByOwner[owner][poolId] = _safeAdd(shadowRewardsInPoolByOwner[owner][poolId], amount);
        shadowRewardsByPoolId[poolId] = _safeAdd(shadowRewardsByPoolId[poolId], amount);

        _withdrawFromPoolInRewardVault(poolId, amount);
        owner.transfer(amount);
    }

    function _withdrawTotalOperatorReward(bytes32 poolId)
        internal
        returns (uint256)
    {
        uint256 amount = _balanceOfOperatorInRewardVault(poolId);
        _withdrawFromOperatorInRewardVault(poolId, amount);
        poolById[poolId].operatorAddress.transfer(amount);

        return amount;
    }

    function _withdrawTotalReward(bytes32 poolId, address payable owner)
        internal
        returns (uint256)
    {
        uint256 amount = _computeRewardBalance(poolId, owner);

        shadowRewardsInPoolByOwner[owner][poolId] = _safeAdd(shadowRewardsInPoolByOwner[owner][poolId], amount);
        shadowRewardsByPoolId[poolId] = _safeAdd(shadowRewardsByPoolId[poolId], amount);

        _withdrawFromPoolInRewardVault(poolId, amount);
        owner.transfer(amount);

        return amount;
    }
}
