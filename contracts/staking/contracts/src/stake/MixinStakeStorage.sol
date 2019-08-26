/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;

import "../libs/LibSafeDowncast.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../interfaces/IStructs.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../sys/MixinScheduler.sol";
import "./MixinZrxVault.sol";


/// @dev This mixin contains logic for managing stake storage.
contract MixinStakeStorage is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinZrxVault,
    MixinScheduler
{

    using LibSafeMath for uint256;

    /// @dev Moves stake between states: 'active', 'inactive' or 'delegated'.
    ///      This change comes into effect next epoch.
    /// @param fromPtr pointer to storage location of `from` stake.
    /// @param toPtr pointer to storage location of `to` stake.
    /// @param amount of stake to move.
    function _moveStake(
        IStructs.DelayedBalance storage fromPtr,
        IStructs.DelayedBalance storage toPtr,
        uint256 amount
    )
        internal
    {
        // do nothing if pointers are equal
        if (_arePointersEqual(fromPtr, toPtr)) {
            return;
        }

        // load balance from storage and synchronize it
        IStructs.DelayedBalance memory from = _syncBalanceDestructive(fromPtr);
        IStructs.DelayedBalance memory to = _syncBalanceDestructive(toPtr);

        // sanity check on balance
        if (amount > from.next) {
            revert("Insufficient Balance");
        }

        // move stake for next epoch
        from.next = LibSafeDowncast.downcastToUint96(uint256(from.next).safeSub(amount));
        to.next = LibSafeDowncast.downcastToUint96(uint256(to.next).safeAdd(amount));

        // update state in storage
        _storeBalance(fromPtr, from);
        _storeBalance(toPtr, to);
    }

    /// @dev Synchronizes the fields of a stored balance.
    ///      The structs `current` field is set to `next` if the
    ///      current epoch is greater than the epoch in which the struct
    ///      was stored.
    /// @param balance to update. This will be equal to the return value after calling.
    /// @return synchronized balance.
    function _syncBalanceDestructive(IStructs.DelayedBalance memory balance)
        internal
        view
        returns (IStructs.DelayedBalance memory)
    {
        uint256 currentEpoch = getCurrentEpoch();
        if (currentEpoch > balance.lastStored) {
            balance.lastStored = LibSafeDowncast.downcastToUint64(currentEpoch);
            balance.current = balance.next;
        }
        return balance;
    }

    /// @dev Mints new value in a balance.
    ///      This causes both the `current` and `next` fields to increase immediately.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to mint.
    function _mintBalance(IStructs.DelayedBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.DelayedBalance memory balance = _syncBalanceDestructive(balancePtr);
        balance.next = LibSafeDowncast.downcastToUint96(uint256(balance.next).safeAdd(amount));
        balance.current = LibSafeDowncast.downcastToUint96(uint256(balance.current).safeAdd(amount));

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Burns existing value in a balance.
    ///      This causes both the `current` and `next` fields to decrease immediately.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to mint.
    function _burnBalance(IStructs.DelayedBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.DelayedBalance memory balance = _syncBalanceDestructive(balancePtr);
        balance.next = LibSafeDowncast.downcastToUint96(uint256(balance.next).safeSub(amount));
        balance.current = LibSafeDowncast.downcastToUint96(uint256(balance.current).safeSub(amount));

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Increments a balance.
    ///      Ths updates the `next` field but not the `current` field.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to increment by.
    function _incrementBalance(IStructs.DelayedBalance storage balancePtr, uint256 amount)
        internal
    {
        // Add stake to balance
        IStructs.DelayedBalance memory balance = _syncBalanceDestructive(balancePtr);
        balance.next = LibSafeDowncast.downcastToUint96(uint256(balance.next).safeAdd(amount));

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Decrements a balance.
    ///      Ths updates the `next` field but not the `current` field.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to decrement by.
    function _decrementBalance(IStructs.DelayedBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.DelayedBalance memory balance = _syncBalanceDestructive(balancePtr);
        balance.next = LibSafeDowncast.downcastToUint96(uint256(balance.next).safeSub(amount));

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Stores a balance in storage.
    /// @param balancePtr points to where `balance` will be stored.
    /// @param balance to save to storage.
    function _storeBalance(
        IStructs.DelayedBalance storage balancePtr,
        IStructs.DelayedBalance memory balance
    )
        private
    {
        // note - this compresses into a single `sstore` when optimizations are enabled,
        // since the StakeBalance struct occupies a single word of storage.
        balancePtr.lastStored = balance.lastStored;
        balancePtr.next = balance.next;
        balancePtr.current = balance.current;
    }

    /// @dev Returns true iff storage pointers resolve to same storage location.
    /// @param balancePtrA first storage pointer.
    /// @param balancePtrB second storage pointer.
    /// @return true iff pointers are equal.
    function _arePointersEqual(
        // solhint-disable-next-line no-unused-vars
        IStructs.DelayedBalance storage balancePtrA,
        // solhint-disable-next-line no-unused-vars
        IStructs.DelayedBalance storage balancePtrB
    )
        private
        returns (bool areEqual)
    {
        assembly {
            areEqual := and(
                eq(balancePtrA_slot, balancePtrB_slot),
                eq(balancePtrA_offset, balancePtrB_offset)
            )
        }
        return areEqual;
    }
}
