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

pragma solidity ^0.5.9;

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "../sys/MixinScheduler.sol";


/// @dev This mixin contains logic for timeLocking stake.
/// **** Read MixinStake before continuing ****
/// When stake moves from an Activated state it must first go to
/// the Deactivated & TimeLocked state. The stake will be timeLocked
/// for a period of time, called a TimeLock Period, which is measured in epochs.
/// (see MixinScheduler).
/// Stake remains timeLocked for at least one full TimeLock Period; so,
/// if your stake is locked sometime during TimeLock Period #1 then it will
/// be un-TimeLocked at TimeLock Period #3.
/// Note that no action is required by the user to un-TimeLock their stake, and
/// when stake is un-TimeLocked it is moved to the state Deactivated & Withdrawable.
/// (see MixinStake).
///
/// -- The TimeLocking Data Structure --
/// Three fields are used to represent a timeLock:
///     1. Total timeLocked stake (called `total`)
///     2. TimeLocked stake pending removal of timeLock, on next TimeLock Period (called `pending`)
///     3. The most recent TimeLock Period in which stake was timeLocked. (called `lockedAt`)
///
/// Each user has exactly one instance of this timeLock struct, which manages all of
/// their timeLocked stake. This data structure is defined in `IStructs.TimeLock`.
/// This data structure was designed to fit into one word of storage, as a gas optimization.
/// Its fields are updated only when a user interacts with their stake.
/// ------------------------------------
///
/// -- TimeLocking Example --
/// In the example below, the user executes a series of actions on their stake (`Action`) during `TimeLock Period` N.
/// The fields of the user's timeLocked struct (`lockedAt`, `total`, `pending`) are illustrated exactly as
/// they would be represented in storage.
/// The field `un-TimeLocked` is the amount of un-TimeLocked stake, as represented *in storage*; however, because
/// state is only updated when the user interacts with their stake, this field may lag.
/// The field `un-TimeLocked (virtual)` is the true amount of un-TimeLocked stake, as represented in the system;
/// the value in this field represents stake that has moved from the state
/// "Deactivated & TimeLocke" to "Deactivated & Withdrawable" (see MixinStake).
/// 
/// |   Action    | TimeLock Period | lockedAt  |  total   | pending | un-TimeLocked  | un-TimeLocked (virtual) |
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
contract MixinTimeLockedStake is
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinScheduler
{
    
    using LibSafeMath for uint256;

    /// @dev Forces the timeLock data structure to sync to state.
    /// This is not necessary but may optimize some subsequent calls.
    /// @param owner of Stake.
    function forceTimeLockSync(address owner)
        external
    {
        _syncTimeLockedStake(owner);
    }

    /// @dev TimeLocks Stake
    /// This moves state into the Deactivated & TimeLocked state.
    /// @param owner of Stake.
    /// @param amount of Stake to timeLock.
    function _timeLockStake(address owner, uint256 amount)
        internal
    {
        (IStructs.TimeLock memory ownerTimeLock,) = _getSynchronizedTimeLock(owner);
        uint96 downcastAmount = amount._downcastToUint96();
        ownerTimeLock.total += downcastAmount;
        timeLockedStakeByOwner[owner] = ownerTimeLock;
    }

    /// @dev Updates storage to reflect the most up-to-date timeLock data structure for a given owner.
    /// @param owner of Stake.
    function _syncTimeLockedStake(address owner)
        internal
    {
        (IStructs.TimeLock memory ownerTimeLock, bool isOutOfSync) = _getSynchronizedTimeLock(owner);
        if (!isOutOfSync) {
            return;
        }
        timeLockedStakeByOwner[owner] = ownerTimeLock;
    }

    /// @dev Returns the most up-to-date timeLock data structure for a given owner.
    /// @param owner of Stake.
    function _getSynchronizedTimeLock(address owner)
        internal
        view
        returns (
            IStructs.TimeLock memory ownerTimeLock,
            bool isOutOfSync
        )
    {
        uint64 currentTimeLockPeriod = getCurrentTimeLockPeriod();
        ownerTimeLock = timeLockedStakeByOwner[owner];
        isOutOfSync = false;
        if (currentTimeLockPeriod == ownerTimeLock.lockedAt._add(1)) {
            // shift n periods
            ownerTimeLock.pending = ownerTimeLock.total;
            isOutOfSync = true;
        } else if (currentTimeLockPeriod > ownerTimeLock.lockedAt) {
            // TimeLock has expired - zero out
            ownerTimeLock.lockedAt = 0;
            ownerTimeLock.total = 0;
            ownerTimeLock.pending = 0;
        }
        return (ownerTimeLock, isOutOfSync);
    }
}
