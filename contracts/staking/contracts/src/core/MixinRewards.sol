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
import "./MixinPools.sol";

contract MixinRewards is
    // libraries
    SafeMath,
    LibRewards,
    // immutables
    MixinConstants,
    MixinStorage,
    // standalones
    MixinRewardVault,
    // logic
    MixinStakeBalances,
    MixinPools
{

    function withdrawOperatorReward(bytes32 poolId, uint256 amount)
        external
        onlyPoolOperator(poolId)
    {
        _withdrawFromOperatorInRewardVault(poolId, amount);
        poolById[poolId].operatorAddress.transfer(amount);
    }

    function withdrawReward(bytes32 poolId, uint256 amount)
        external
    {
        address payable owner = msg.sender;
        uint256 ownerBalance = computeRewardBalance(poolId, owner);
        require(
            amount <= ownerBalance,
            "INVALID_AMOUNT"
        );

        shadowRewardsInPoolByOwner[owner][poolId] = _safeAdd(shadowRewardsInPoolByOwner[owner][poolId], amount);
        shadowRewardsByPoolId[poolId] = _safeAdd(shadowRewardsByPoolId[poolId], amount);

        _withdrawFromPoolInRewardVault(poolId, amount);
        owner.transfer(amount);
    }

    function withdrawTotalOperatorReward(bytes32 poolId)
        external
        onlyPoolOperator(poolId)
        returns (uint256)
    {
        uint256 amount = getBalanceOfOperatorInRewardVault(poolId);
        _withdrawFromOperatorInRewardVault(poolId, amount);
        poolById[poolId].operatorAddress.transfer(amount);

        return amount;
    }

    function withdrawTotalReward(bytes32 poolId)
        external
        returns (uint256)
    {
        address payable owner = msg.sender;
        uint256 amount = computeRewardBalance(poolId, owner);

        shadowRewardsInPoolByOwner[owner][poolId] = _safeAdd(shadowRewardsInPoolByOwner[owner][poolId], amount);
        shadowRewardsByPoolId[poolId] = _safeAdd(shadowRewardsByPoolId[poolId], amount);

        _withdrawFromPoolInRewardVault(poolId, amount);
        owner.transfer(amount);

        return amount;
    }

    function computeRewardBalance(bytes32 poolId, address owner)
        public
        view
        returns (uint256)
    {
        uint256 poolBalance = getBalanceOfPoolInRewardVault(poolId);
        return _computePayoutDenominatedInRealAsset(
            delegatedStakeToPoolByOwner[owner][poolId],
            delegatedStakeByPoolId[poolId],
            shadowRewardsInPoolByOwner[owner][poolId],
            shadowRewardsByPoolId[poolId],
            poolBalance
        );
    }

    function getShadowBalanceByPoolId(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return shadowRewardsByPoolId[poolId];
    }

    function getShadowBalanceInPoolByOwner(address owner, bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return shadowRewardsInPoolByOwner[owner][poolId];
    }

    function getRewardBalance(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceInRewardVault(poolId);
    }

    function getRewardBalanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceOfOperatorInRewardVault(poolId);
    }

    function getRewardBalanceOfPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceOfPoolInRewardVault(poolId);
    }
}
