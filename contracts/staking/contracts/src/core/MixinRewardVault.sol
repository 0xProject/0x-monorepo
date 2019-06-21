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

import "../interfaces/IRewardVault.sol";
import "../immutable/MixinStorage.sol";


contract MixinRewardVault is
    MixinStorage
{

    function _setRewardVault(address payable _rewardVault)
        internal
    {
        rewardVault = IRewardVault(_rewardVault);
    }

    function _getRewardVault()
        internal
        view
        returns (address)
    {
        return address(rewardVault);
    }

    function _createPoolInRewardVault(bytes32 poolId, uint8 operatorShare)
        internal
    {
        rewardVault.createPool(
            poolId,
            operatorShare
        );
    }

     function _balanceInRewardVault(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return rewardVault.balanceOf(poolId);
    }

    function _balanceOfOperatorInRewardVault(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return rewardVault.balanceOfOperator(poolId);
    }

    function _balanceOfPoolInRewardVault(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return rewardVault.balanceOfPool(poolId);
    }

    function _withdrawFromPoolInRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawFromPool(poolId, amount);
    }

    function _withdrawFromOperatorInRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawFromOperator(poolId, amount);
    }

    function _depositIntoRewardVault(uint256 amountInWei)
        internal
    {
        address payable rewardVaultAddress = address(uint160(address(rewardVault)));
        rewardVaultAddress.transfer(amountInWei);
    }

    function _recordDepositInRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.recordDepositFor(poolId, amount);
    }
}
