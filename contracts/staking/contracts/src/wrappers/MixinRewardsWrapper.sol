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

import "../core/MixinRewards.sol";
import "../utils/Modifiers.sol";


contract MixinRewardsWrapper is
    MixinRewards,
    Modifiers
{

     function computeRewardBalance(bytes32 poolId, address owner)
        external
        view
        returns (uint256)
    {
        return _computeRewardBalance(poolId, owner);
    }

    function getShadowBalanceByPoolId(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getShadowBalanceByPoolId(poolId);
    }

    function getShadowBalanceInPoolByOwner(address owner, bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getShadowBalanceInPoolByOwner(owner, poolId);
    }

    function withdrawOperatorReward(bytes32 poolId, uint256 amount)
        external
        onlyPoolOperator(poolId)
    {
        _withdrawOperatorReward(poolId, amount);
    }

    function withdrawReward(bytes32 poolId, uint256 amount)
        external
    {
        _withdrawReward(poolId, msg.sender, amount);
    }

    function withdrawTotalOperatorReward(bytes32 poolId)
        external
        onlyPoolOperator(poolId)
        returns (uint256)
    {
        return _withdrawTotalOperatorReward(poolId);
    }

    function withdrawTotalReward(bytes32 poolId)
        external
        returns (uint256)
    {
        return _withdrawTotalReward(poolId, msg.sender);
    }
}
