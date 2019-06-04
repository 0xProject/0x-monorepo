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
import "./MixinStorage.sol";
import "./MixinConstants.sol";


contract MixinStake is
    SafeMath,
    MixinConstants,
    MixinStorage,
{
    
    function _getTotalStake(address owner)
        internal
        view
        returns (uint256)
    {
        return stakeByOwner[owner];
    }

    function getActivatedStake(address owner)
        internal
        view
        returns (uint256)
    {
        return activeStakeByOwner[owner];
    }

    function getDeactivatedStake(address owner)
        internal
        view
        returns (uint256)
    {
        return _safeSub(_getTotalStake(owner), getActivatedStake(owner));
    }

    function getStakeAvailableForActivation()

    function getWithdrawableStake(address owner)
        internal
        view
        returns (uint256)
    {
        
    }

    function getTimelockedStake(address owner)
        internal
        view
        returns (uint256)
    {
        return timelockedStakeByOwner[owner].total;
    }

    function getStakeDelegatedByOwner(address owner)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeByOwner[owner];
    }

    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeToPoolByOwner[owner][poolId];
    }

    function getStakeDelegatedToPool(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeByPoolId[poolId];
    }
}
