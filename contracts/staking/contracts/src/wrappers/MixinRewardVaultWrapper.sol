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

import "../core/MixinRewardVault.sol";


contract MixinRewardVaultWrapper is
    MixinRewardVault
{

    // NOTE that some names differ slightly from the internal function names for simplicity of the API to outside clients.

    function setRewardVault(address payable _rewardVault)
        external
    {
        _setRewardVault(_rewardVault);
    }

    function getRewardVault()
        external
        view
        returns (address)
    {
        return _getRewardVault();
    }

    function getRewardBalance(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _balanceInRewardVault(poolId);
    }

    function getRewardBalanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _balanceOfOperatorInRewardVault(poolId);
    }

    function getRewardBalanceOfPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _balanceOfPoolInRewardVault(poolId);
    }
}
