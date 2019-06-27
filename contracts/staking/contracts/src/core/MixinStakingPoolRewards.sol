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

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "./MixinStakeBalances.sol";
import "./MixinStakingPoolRewardVault.sol";
import "./MixinStakingPool.sol";


contract MixinStakingPoolRewards is
    MixinConstants,
    MixinStorage,
    MixinStakingPoolRewardVault,
    MixinStakeBalances,
    MixinStakingPool
{

    using LibSafeMath for uint256;

    /// @dev This mixin contains logic for managing the rewards belonging to a staking pool.
    ///  

    function withdrawOperatorReward(bytes32 poolId, uint256 amount)
        external
        onlyPoolOperator(poolId)
    {
        _withdrawFromOperatorInStakingPoolRewardVault(poolId, amount);
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

        shadowRewardsInPoolByOwner[owner][poolId] = shadowRewardsInPoolByOwner[owner][poolId]._add(amount);
        shadowRewardsByPoolId[poolId] = shadowRewardsByPoolId[poolId]._add(amount);

        _withdrawFromPoolInStakingPoolRewardVault(poolId, amount);
        owner.transfer(amount);
    }

    function withdrawTotalOperatorReward(bytes32 poolId)
        external
        onlyPoolOperator(poolId)
        returns (uint256)
    {
        uint256 amount = getBalanceOfOperatorInStakingPoolRewardVault(poolId);
        _withdrawFromOperatorInStakingPoolRewardVault(poolId, amount);
        poolById[poolId].operatorAddress.transfer(amount);

        return amount;
    }

    function withdrawTotalReward(bytes32 poolId)
        external
        returns (uint256)
    {
        address payable owner = msg.sender;
        uint256 amount = computeRewardBalance(poolId, owner);

        shadowRewardsInPoolByOwner[owner][poolId] = shadowRewardsInPoolByOwner[owner][poolId]._add(amount);
        shadowRewardsByPoolId[poolId] = shadowRewardsByPoolId[poolId]._add(amount);

        _withdrawFromPoolInStakingPoolRewardVault(poolId, amount);
        owner.transfer(amount);

        return amount;
    }

    function getRewardBalance(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceInStakingPoolRewardVault(poolId);
    }

    function getRewardBalanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceOfOperatorInStakingPoolRewardVault(poolId);
    }

    function getRewardBalanceOfPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return getBalanceOfPoolInStakingPoolRewardVault(poolId);
    }

    function computeRewardBalance(bytes32 poolId, address owner)
        public
        view
        returns (uint256)
    {
        uint256 poolBalance = getBalanceOfPoolInStakingPoolRewardVault(poolId);
        return LibRewardMath._computePayoutDenominatedInRealAsset(
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
}
