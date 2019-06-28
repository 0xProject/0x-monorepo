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

    /// @dev This mixin contains logic for timelocking stake.
    /// **** Read MixinStake before continuing ****
    /// When stake moves from an Activated state it must first go to
    /// the Deactivated & Timelocked state. The stake will be timelocked
    /// for a period of time, called a Timelock Period, which is measured in epochs.
    /// (see MixinScheduler).
    /// Stake remains timelocked for at least one full Timelock Period; so,
    /// if your stake is locked sometime during Timelock Period #1 then it will
    /// be un-timelocked at Timelock Period #3.
    /// Note that no action is required by the user to un-timelock their stake, and
    /// when stake is un-timelocked it is moved to the state Deactivated & Withdrawable.
    /// (see MixinStake).
    ///
    /// -- The Timelocking Data Structure --
    /// Three fields are used to represent a timelock:
    ///     1. Total timelocked stake (called `total`)
    ///     2. Timelocked stake pending removal of timelock, on next Timelock Period (called `pending`)
    ///     3. The most recent Timelock Period in which stake was timelocked. (called `lockedAt`)
    ///
    /// Each user has exactly one instance of this timelock struct, which manages all of
    /// their timelocked stake. This data structure is defined in `IStructs.Timelock`.
    /// This data structure was designed to fit into one word of storage, as a gas optimization.
    /// Its fields are updated only when a user interacts with their stake.
    /// ------------------------------------
    ///
    /// -- Timelocking Example --
    /// In the example below, the user executes a series of actions on their stake (`Action`) during `Timelock Period` N.
    /// The fields of the user's timelocked struct (`lockedAt`, `total`, `pending`) are illustrated exactly as
    /// they would be represented in storage.
    /// The field `un-timelocked` is the amount of un-timelocked stake, as represented *in storage*; however, because
    /// state is only updated when the user interacts with their stake, this field may lag.
    /// The field `un-timelocked (virtual)` is the true amount of un-timelocked stake, as represented in the system;
    /// the value in this field represents stake that has moved from the state
    /// "Deactivated & Timelocke" to "Deactivated & Withdrawable" (see MixinStake).
    /// 
    /// |   Action    | Timelock Period | lockedAt  |  total   | pending | un-timelocked  | un-timelocked (virtual) |
    /// |             |        0        |     0     |    0     |    0    |       0        |          0              |
    /// |   lock(5)   |        1        |     1     |    5     |    0    |       0        |          0              |
    /// |             |        2        |     1     |    5     |    0    |       0        |          0              |
    /// |   lock(10)  |        2        |     2     |    15    |    5    |       0        |          0              |
    /// |             |        3        |     2     |    15    |    5    |       0        |          5              |
    /// |   lock(15)  |        3        |     3     |    30    |    15   |       5        |          5              |
    /// |             |        4        |     3     |    30    |    15   |       5        |          15             |
    /// |             |        5        |     3     |    30    |    15   |       5        |          30             |
    /// |   lock(0)   |        5        |     5     |    30    |    30   |       30       |          30             |
    /// |   lock(20)  |        6        |     6     |    50    |    30   |       30       |          30             |
    /// |  unlock(30) |        6        |     6     |    20    |    0    |       0        |          0              |
    /// |             |        7        |     6     |    20    |    0    |       0        |          0              |
    /// |             |        8        |     6     |    20    |    0    |       0        |          20             |
    /// -------------------------------------------------------------------------------------------------------------
    
    using LibSafeMath for uint256;

    /// @dev Forces the timelock data structure to sync to state.
    /// This is not necessary but may optimize some subsequent calls.
    /// @param owner of Stake.
    function forceTimelockSync(address owner)
        external
    {
        _syncTimelockedStake(owner);
    }

    /// @dev Timelocks Stake
    /// This moves state into the Deactivated & Timelocked state.
    /// @param owner of Stake.
    /// @param amount of Stake to timelock.
    function _timelockStake(address owner, uint256 amount)
        internal
    {
        (IStructs.Timelock memory ownerTimelock,) = _getSynchronizedTimelock(owner);
        uint96 downcastAmount = amount._downcastToUint96();
        ownerTimelock.total += downcastAmount;
        timelockedStakeByOwner[owner] = ownerTimelock;
    }

    /// @dev Updates storage to reflect the most up-to-date timelock data structure for a given owner.
    /// @param owner of Stake.
    function _syncTimelockedStake(address owner)
        internal
    {
        (IStructs.Timelock memory ownerTimelock, bool isOutOfSync) = _getSynchronizedTimelock(owner);
        if (!isOutOfSync) {
            return;
        }
        timelockedStakeByOwner[owner] = ownerTimelock;
    }

    /// @dev Returns the most up-to-date timelock data structure for a given owner.
    /// @param owner of Stake.
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
