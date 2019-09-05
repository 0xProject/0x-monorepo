/*

  Copyright 2019 ZeroEx Intl.

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
    MixinConstants,
    MixinStorage,
    MixinScheduler
{
    using LibSafeMath for uint256;
    using LibSafeDowncast for uint256;

    /// @dev Moves stake between states: 'active', 'inactive' or 'delegated'.
    ///      This change comes into effect next epoch.
    /// @param fromPtr pointer to storage location of `from` stake.
    /// @param toPtr pointer to storage location of `to` stake.
    /// @param amount of stake to move.
    function _moveStake(
        IStructs.StoredBalance storage fromPtr,
        IStructs.StoredBalance storage toPtr,
        uint256 amount
    )
        internal
    {
        // do nothing if pointers are equal
        if (_arePointersEqual(fromPtr, toPtr)) {
            return;
        }

        // load balance from storage and synchronize it
        IStructs.StoredBalance memory from = _loadAndSyncBalance(fromPtr);
        IStructs.StoredBalance memory to = _loadAndSyncBalance(toPtr);

        // sanity check on balance
        if (amount > from.nextEpochBalance) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InsufficientBalanceError(
                    amount,
                    from.nextEpochBalance
                )
            );
        }

        // move stake for next epoch
        from.nextEpochBalance = uint256(from.nextEpochBalance).safeSub(amount).downcastToUint96();
        to.nextEpochBalance = uint256(to.nextEpochBalance).safeAdd(amount).downcastToUint96();

        // update state in storage
        _storeBalance(fromPtr, from);
        _storeBalance(toPtr, to);
    }

    /// @dev Loads a balance from storage and synchronizes its current/next fields.
    ///      The structs `current` field is set to `next` if the
    ///      current epoch is greater than the epoch in which the struct
    ///      was stored.
    /// @param balancePtr to load and sync.
    /// @return synchronized balance.
    function _loadAndSyncBalance(IStructs.StoredBalance storage balancePtr)
        internal
        view
        returns (IStructs.StoredBalance memory balance)
    {
        // load from storage
        balance = balancePtr;
        // sync
        uint256 currentEpoch = getCurrentEpoch();
        if (currentEpoch > balance.currentEpoch) {
            balance.currentEpoch = currentEpoch.downcastToUint64();
            balance.currentEpochBalance = balance.nextEpochBalance;
        }
        return balance;
    }

    /// @dev Loads a balance from storage without synchronizing its fields.
    /// This function exists so that developers will have to explicitly
    /// communicate that they're loading a synchronized or unsynchronized balance.
    /// These balances should never be accessed directly.
    /// @param balancePtr to load.
    /// @return unsynchronized balance.
    function _loadUnsyncedBalance(IStructs.StoredBalance storage balancePtr)
        internal
        view
        returns (IStructs.StoredBalance memory balance)
    {
        balance = balancePtr;
        return balance;
    }

    /// @dev Increments both the `current` and `next` fields.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to mint.
    function _incrementCurrentAndNextBalance(IStructs.StoredBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredBalance memory balance = _loadAndSyncBalance(balancePtr);
        balance.nextEpochBalance = uint256(balance.nextEpochBalance).safeAdd(amount).downcastToUint96();
        balance.currentEpochBalance = uint256(balance.currentEpochBalance).safeAdd(amount).downcastToUint96();

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Decrements both the `current` and `next` fields.
    /// @param balancePtr storage pointer to balance.
    /// @param amount to mint.
    function _decrementCurrentAndNextBalance(IStructs.StoredBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredBalance memory balance = _loadAndSyncBalance(balancePtr);
        balance.nextEpochBalance = uint256(balance.nextEpochBalance).safeSub(amount).downcastToUint96();
        balance.currentEpochBalance = uint256(balance.currentEpochBalance).safeSub(amount).downcastToUint96();

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Increments the `next` field (but not the `current` field).
    /// @param balancePtr storage pointer to balance.
    /// @param amount to increment by.
    function _incrementNextBalance(IStructs.StoredBalance storage balancePtr, uint256 amount)
        internal
    {
        // Add stake to balance
        IStructs.StoredBalance memory balance = _loadAndSyncBalance(balancePtr);
        balance.nextEpochBalance = uint256(balance.nextEpochBalance).safeAdd(amount).downcastToUint96();

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Decrements the `next` field (but not the `current` field).
    /// @param balancePtr storage pointer to balance.
    /// @param amount to decrement by.
    function _decrementNextBalance(IStructs.StoredBalance storage balancePtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredBalance memory balance = _loadAndSyncBalance(balancePtr);
        balance.nextEpochBalance = uint256(balance.nextEpochBalance).safeSub(amount).downcastToUint96();

        // update state
        _storeBalance(balancePtr, balance);
    }

    /// @dev Stores a balance in storage.
    /// @param balancePtr points to where `balance` will be stored.
    /// @param balance to save to storage.
    function _storeBalance(
        IStructs.StoredBalance storage balancePtr,
        IStructs.StoredBalance memory balance
    )
        private
    {
        // note - this compresses into a single `sstore` when optimizations are enabled,
        // since the StakeBalance struct occupies a single word of storage.
        balancePtr.currentEpoch = balance.currentEpoch;
        balancePtr.nextEpochBalance = balance.nextEpochBalance;
        balancePtr.currentEpochBalance = balance.currentEpochBalance;
    }

    /// @dev Returns true iff storage pointers resolve to same storage location.
    /// @param balancePtrA first storage pointer.
    /// @param balancePtrB second storage pointer.
    /// @return true iff pointers are equal.
    function _arePointersEqual(
        // solhint-disable-next-line no-unused-vars
        IStructs.StoredBalance storage balancePtrA,
        // solhint-disable-next-line no-unused-vars
        IStructs.StoredBalance storage balancePtrB
    )
        private
        pure
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
