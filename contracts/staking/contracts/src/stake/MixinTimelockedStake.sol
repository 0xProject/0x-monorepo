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
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../sys/MixinScheduler.sol";


contract MixinTimelockedStake is
    IMixinScheduler,
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinScheduler
{

    using LibSafeMath for uint256;

    function forceTimelockSync(address owner)
        external
    {
        _syncTimelockedStake(owner);
    }

    // Epoch | lockedAt  | total | pending | deactivated | timelock() | withdraw() | available()
    // 0     | 0         | 0     | 0       | 0       |            |            | 0
    // 1     | 1         | 5     | 0       | 0       | +5         |            | 0
    // 2     | 1         | 5     | 0       | 0       |            |            | 0
    // 2     | 2         | 15    | 5       | 0       | +10        |            | 0
    // 3     | 2         | 15    | 5       | 0       |            |            | 5
    // 3     | 3         | 30    | 15      | 5       | +15        |            | 5
    // 4     | 3         | 30    | 15      | 5       |            |            | 15
    // 5     | 3         | 30    | 15      | 5       |            |            | 30
    // 5     | 5         | 30    | 30      | 30      | +0 *       |            | 30
    // 6     | 6         | 50    | 30      | 30      | +20        |            | 30
    // 6     | 6         | 20    | 0       | 0       |            | -30        | 0
    // 7     | 6         | 20    | 0       | 0       |            |            | 0
    // 8     | 6         | 20    | 0       | 0       |            |            | 20
    function _timelockStake(address owner, uint256 amount)
        internal
    {
        (IStructs.Timelock memory ownerTimelock,) = _getSynchronizedTimelock(owner);
        uint96 downcastAmount = amount._downcastToUint96();
        ownerTimelock.total += downcastAmount;
        timelockedStakeByOwner[owner] = ownerTimelock;
    }

    function _syncTimelockedStake(address owner)
        internal
    {
        (IStructs.Timelock memory ownerTimelock, bool isOutOfSync) = _getSynchronizedTimelock(owner);
        if (!isOutOfSync) {
            return;
        }
        timelockedStakeByOwner[owner] = ownerTimelock;
    }

    function _getSynchronizedTimelock(address owner)
        internal
        view
        returns (
            IStructs.Timelock memory ownerTimelock,
            bool isOutOfSync
        )
    {
        uint64 currentTimelockPeriod = getCurrentTimelockPeriod();
        ownerTimelock = timelockedStakeByOwner[owner];
        isOutOfSync = false;
        if (currentTimelockPeriod == ownerTimelock.lockedAt._add(1)) {
            // shift n periods
            ownerTimelock.pending = ownerTimelock.total;
            isOutOfSync = true;
        } else if (currentTimelockPeriod > ownerTimelock.lockedAt) {
            // Timelock has expired - zero out
            ownerTimelock.lockedAt = 0;
            ownerTimelock.total = 0;
            ownerTimelock.pending = 0;
        }
        return (ownerTimelock, isOutOfSync);
    }
}
