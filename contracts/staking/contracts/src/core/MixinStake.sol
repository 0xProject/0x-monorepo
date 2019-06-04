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
import "../interfaces/IStakingEvents.sol";
import "./StakingBalances.sol";


contract MixinStake is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinStakeBalances
{
    using LibZrxToken for uint256;

    function _deposit(address owner, uint256 amount)
        internal
    {
        _mintStake(owner, amount);
    }

    function _depositAndStake(address owner, uint256 amount)
        internal
    {
        _mintStake(owner, amount);
        _activateStake(owner, amount);
    }

    function _depositAndDelegate(address owner, bytes32 poolId, uint256 amount)
        internal
    {
        _depositAndStake(owner, amount);
        _delegateStake(owner, poolId, amount);
    }

    function _activateStake(address owner, uint256 amount)
        internal
    {
        _syncTimelockedStake();

        Timelock memory ownerTimelock = timelocksByOwner[owner];
        require(
           ownerTimelock.availableBalance >= amount,
           "INSUFFICIENT_BALANCE"
        );
        ownerTimelock.sub(amount);
        timelocksByOwner[owner] = ownerTimelock;

        _activateStake(owner, amount);
    }

    function _activateAndDelegateStake(address owner, bytes32 poolId, uint256 amount)
        internal
    {
        _activateStake(owner, amount);
        _delegateStake(owner, poolId, amount);
    }

    function _deactivateAndTimelockStake(address owner, uint256 amount)
        internal
    {
        Timelock memory ownerTimelock = timelocksByOwner[owner];
        ownerTimelock.add(amount);
        timelocksByOwner[owner] = ownerTimelock;

        activeStakeByOwner[owner] = _safeSub(activeStakeByOwner[owner], amount);
    }

    function _deactivateAndTimelockDelegatedStake(address owner, bytes32 poolId, uint256 amount)
        internal
    {
        _deactivateStake(owner, amount);
        _undelegateStake(owner, poolId, amount);
    }

    function _withdraw(address owner, uint256 amount)
        internal
    {
        Timelock memory ownerTimelock = timelocksByOwner[owner];
        require(
           ownerTimelock.availableBalance >= amount,
           "INSUFFICIENT_BALANCE"
        );
        ownerTimelock.sub(amount);
        timelocksByOwner[owner] = ownerTimelock;

        // burn stake
        _burnStake(owner, amount);
    }

    ///// PRIVATE HELPERS /////

    function _mintStake(address owner, uint256 amount)
        private
    {
        // deposit equivalent amount of ZRX into vault
        zrxVault.depositFrom(owner, amount);

        // mint stake
        stakeByOwner[owner] = _safeAdd(stakeByOwner[owner], amount);

        // emit stake event
        emit StakeMinted(
            owner,
            amount
        );
    }

    function _burnStake(address owner, uint256 amount)
        private
    {
        // burn stake
        stakeByOwner[owner] = _safeSub(stakeByOwner[owner], amount);

        // withdraw equivalent amount of ZRX from vault
        zrxVault.withdrawFrom(owner, amount);

        // emit stake event
        emit StakeBurned(
            owner,
            amount
        );
    }

    function _activateStake(address owner, uint256 amount)
        private
    {
        activeStakeByOwner[owner] = _safeAdd(activeStakeByOwner[owner], amount);
    }

    function _delegateStake(address owner, bytes32 poolId, uint256 amount)
        private
    {
        // increment how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _safeAdd(stakeByOwner[owner], amount);

        // increment how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _safeAdd(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // increment how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _safeAdd(delegatedStakeByPoolId[poolId], amount);
    }

    function _undelegateStake(address owner, bytes32 poolId, uint256 amount)
        private
    {
        // decrement how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _safeSub(stakeByOwner[owner], amount);

        // decrement how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _safeSub(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // decrement how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _safeSub(delegatedStakeByPoolId[poolId], amount);
    }

    // Epoch | lockedAt  | total | pending | current | timelock() | withdraw() | available()
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
        private
    {
        Timelock memory ownerTimelock = _getSynchronizedTimelock(owner, amount);
        ownerTimelock.total = _safeAdd(ownerTimelock.total, amount);
         timelocksByOwner[owner] = ownerTimelock;
    }

    function _syncTimelockedStake(address owner, uint256 amount)
        private
    {
        timelocksByOwner[owner] = _getSynchronizedTimelock(owner, amount);
    }

    function _getSynchronizedTimelock(address owner, uint256 amount)
        private
        returns (Timelock memory ownerTimelock)
    {
        Timelock memory ownerTimelock = timelocksByOwner[owner];
        uint64 currentTimelockPeriod = getCurrentTimelockPeriod();
        if (currentTimelockPeriod == _safeAdd(ownerTimelock.lockedAt, 1)) {
            // shift one period
            ownerTimelock.current = ownerTimelock.pending;
            ownerTimelock.pending = ownerTimelock.total;
        } else if (currentTimelockPeriod > ownerTimelock.lockedAt) {
            // shift n periods
            ownerTimelock.current = ownerTimelock.total;
            ownerTimelock.pending = ownerTimelock.total;
        } else {
            // do nothing
        }
        return ownerTimelock;
    }
}
