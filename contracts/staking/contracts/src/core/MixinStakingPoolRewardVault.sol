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

import "../interfaces/IStakingPoolRewardVault.sol";
import "../immutable/MixinStorage.sol";


contract MixinStakingPoolRewardVault is
    MixinStorage
{

    function setStakingPoolRewardVault(address payable _rewardVault)
        external
        // onlyOwner
    {
        rewardVault = IStakingPoolRewardVault(_rewardVault);
    }

    function getStakingPoolRewardVault()
        public
        view
        returns (address)
    {
        return address(rewardVault);
    }

    function getBalanceInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOf(poolId);
    }

    function getBalanceOfOperatorInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOfOperator(poolId);
    }

    function getBalanceOfPoolInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOfPool(poolId);
    }

    function _createPoolInStakingPoolRewardVault(bytes32 poolId, uint8 operatorShare)
        internal
    {
        rewardVault.createPool(
            poolId,
            operatorShare
        );
    }

    function _withdrawFromPoolInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawFromPool(poolId, amount);
    }

    function _withdrawFromOperatorInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawFromOperator(poolId, amount);
    }

    function _depositIntoStakingPoolRewardVault(uint256 amountInWei)
        internal
    {
        address payable rewardVaultAddress = address(uint160(address(rewardVault)));
        rewardVaultAddress.transfer(amountInWei);
    }

    function _recordDepositInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.recordDepositFor(poolId, amount);
    }
}
