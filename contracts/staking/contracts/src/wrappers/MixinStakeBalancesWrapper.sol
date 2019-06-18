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

import "../core/MixinStakeBalances.sol";


contract MixinStakeBalancesWrapper is
    MixinStakeBalances
{

    function getTotalStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getTotalStake(owner);
    }

    function getActivatedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getActivatedStake(owner);
    }

    function getDeactivatedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getDeactivatedStake(owner);
    }

    function getActivatableStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getActivatableStake(owner);
    }

    function getWithdrawableStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getWithdrawableStake(owner);
    }

    function getTimelockedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getTimelockedStake(owner);
    }

    function getStakeDelegatedByOwner(address owner)
        external
        view
        returns (uint256)
    {
        return _getStakeDelegatedByOwner(owner);
    }

    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getStakeDelegatedToPoolByOwner(owner, poolId);
    }

    function getStakeDelegatedToPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getStakeDelegatedToPool(poolId);
    }
}
