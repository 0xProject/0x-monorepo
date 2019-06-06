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
import "./MixinEpoch.sol";


contract MixinStakeBalances is
    SafeMath,
    MixinConstants,
    MixinStorage,
    MixinEpoch
{

    function _getTotalStake(address owner)
        internal
        view
        returns (uint256)
    {
        return stakeByOwner[owner];
    }

    function _getActivatedStake(address owner)
        internal
        view
        returns (uint256)
    {
        return activeStakeByOwner[owner];
    }

    function _getDeactivatedStake(address owner)
        internal
        view
        returns (uint256)
    {
        return _safeSub(_getTotalStake(owner), _getActivatedStake(owner));
    }

    function _getActivatableStake(address owner)
        internal
        view
        returns (uint256)
    {
        return _safeSub(_getDeactivatedStake(owner), _getTimelockedStake(owner));
    }

    function _getWithdrawableStake(address owner)
        internal
        view
        returns (uint256)
    {
        return _getActivatableStake(owner);
    }

    function _getStakeDelegatedByOwner(address owner)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeByOwner[owner];
    }

    function _getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeToPoolByOwner[owner][poolId];
    }

    function _getStakeDelegatedToPool(bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return delegatedStakeByPoolId[poolId];
    }

    function _getTimelockedStake(address owner)
        internal
        view
        returns (uint256)
    {
        (Timelock memory timelock,) = _getSynchronizedTimelock(owner);
        return timelock.total;
    }

    function _getSynchronizedTimelock(address owner)
        internal
        view
        returns (
            Timelock memory ownerTimelock,
            bool isOutOfSync
        )
    {
        uint64 currentTimelockPeriod = _getCurrentTimelockPeriod();
        ownerTimelock = timelockedStakeByOwner[owner];
        isOutOfSync = false;
        if (currentTimelockPeriod == _safeAdd(ownerTimelock.lockedAt, 1)) {
            // shift n periods
            ownerTimelock.pending = ownerTimelock.total;
            isOutOfSync = true;
        } else if(currentTimelockPeriod > ownerTimelock.lockedAt) {
            // Timelock has expired - zero out
            ownerTimelock.lockedAt = 0;
            ownerTimelock.total = 0;
            ownerTimelock.pending = 0;
        }
        return (ownerTimelock, isOutOfSync);
    }
}
