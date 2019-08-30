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
pragma experimental ABIEncoderV2;

import "../libs/LibSafeMath.sol";
import "../interfaces/IStructs.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../sys/MixinScheduler.sol";
import "./MixinZrxVault.sol";


/// @dev This mixin contains logic for querying stake balances.
/// **** Read MixinStake before continuing ****
contract MixinStakeBalances is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinOwnable,
    MixinZrxVault
{

    using LibSafeMath for uint256;

    /// @dev Returns the total activated stake across all owners.
    /// This stake is in the "Activated" OR "Activated & Delegated" states.
    /// @return Total active stake.
    function getActivatedStakeAcrossAllOwners()
        public
        view
        returns (uint256)
    {
        return totalActivatedStake;
    }

    /// @dev Returns the total stake for a given owner.
    /// This stake can be in any state.
    /// @param owner to query.
    /// @return Total active stake for owner.
    function getTotalStake(address owner)
        public
        view
        returns (uint256)
    {
        return _balanceOfOwnerInZrxVault(owner);
    }

    /// @dev Returns the activated stake for a given owner.
    /// This stake is in the "Activated" OR "Activated & Delegated" states.
    /// @param owner to query.
    /// @return Activated stake for owner.
    function getActiveStake(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredStakeBalance memory storedBalance = _syncBalanceDestructive(activeStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the deactivated stake for a given owner.
    /// This stake is in the "Deactivated & TimeLocked" OR "Deactivated & Withdrawable" states.
    /// @param owner to query.
    /// @return Deactivated stake for owner.
    function getInactiveStake(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredStakeBalance memory storedBalance = _syncBalanceDestructive(inactiveStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the stake that can be withdrawn for a given owner.
    /// This stake is in the "Deactivated & Withdrawable" state.
    /// @param owner to query.
    /// @return Withdrawable stake for owner.
    function getWithdrawableStake(address owner)
        public
        view
        returns (uint256)
    {
        uint256 cachedWithdrawableStakeByOwner = withdrawableStakeByOwner[owner];
        return _computeWithdrawableStake(owner, cachedWithdrawableStakeByOwner);
    }

    /// @dev Returns the stake delegated by a given owner.
    /// This stake is in the "Activated & Delegated" state.
    /// @param owner to query.
    /// @return Delegated stake for owner.
    function getStakeDelegatedByOwner(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredStakeBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the stake delegated to a specific staking pool, by a given owner.
    /// This stake is in the "Activated & Delegated" state.
    /// @param owner to query.
    /// @param poolId Unique Id of pool.
    /// @return Stake delegaated to pool by owner.
    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredStakeBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeToPoolByOwner[owner][poolId]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the total stake delegated to a specific staking pool, across all members.
    /// This stake is in the "Activated & Delegated" state.
    /// @param poolId Unique Id of pool.
    /// @return Total stake delegaated to pool.
    function getTotalStakeDelegatedToPool(bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredStakeBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeByPoolId[poolId]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    function _syncBalanceDestructive(IStructs.StoredStakeBalance memory balance)
        internal
        view
        returns (IStructs.StoredStakeBalance memory)
    {
        uint64 currentEpoch = getCurrentEpoch();
        if (currentEpoch > balance.lastStored) {
            balance.lastStored = currentEpoch;
            balance.current = balance.next;
        }
        return balance;
    }

    function _moveStake(
        IStructs.StoredStakeBalance storage fromPtr,
        IStructs.StoredStakeBalance storage toPtr,
        uint256 amount
    )
        internal
    {
        if (_arePointersEqual(fromPtr, toPtr)) {
            return;
        }
        IStructs.StoredStakeBalance memory from = _syncBalanceDestructive(fromPtr);
        IStructs.StoredStakeBalance memory to = _syncBalanceDestructive(toPtr);

        if (amount > from.next) {
            revert("@TODO - INSERT RICH REVERT");
        }

        from.next = LibSafeMath._downcastToUint96(uint256(from.next)._sub(amount));
        to.next = LibSafeMath._downcastToUint96(uint256(to.next)._add(amount));

        // update state
        _storeBalance(fromPtr, from);
        _storeBalance(toPtr, to);
    }

    function _mintBalance(IStructs.StoredStakeBalance storage fromPtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredStakeBalance memory from = _syncBalanceDestructive(fromPtr);
        from.next = LibSafeMath._downcastToUint96(uint256(from.next)._add(amount));
        from.current = LibSafeMath._downcastToUint96(uint256(from.current)._add(amount));

        // update state
        _storeBalance(fromPtr, from);
    }

    function _burnBalance(IStructs.StoredStakeBalance storage fromPtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredStakeBalance memory from = _syncBalanceDestructive(fromPtr);
        from.next = LibSafeMath._downcastToUint96(uint256(from.next)._sub(amount));
        from.current = LibSafeMath._downcastToUint96(uint256(from.current)._sub(amount));

        // update state
        _storeBalance(fromPtr, from);
    }

    function _arePointersEqual(
        IStructs.StoredStakeBalance storage fromPtr,
        IStructs.StoredStakeBalance storage toPtr
    )
        private
        returns (bool areEqual)
    {
        assembly {
            areEqual := and(eq(fromPtr_slot, toPtr_slot), eq(fromPtr_offset, toPtr_offset))
        }
        return areEqual;
    }


    function _incrementBalance(IStructs.StoredStakeBalance storage fromPtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredStakeBalance memory from = _syncBalanceDestructive(fromPtr);
        from.next = LibSafeMath._downcastToUint96(uint256(from.next)._add(amount));

        // update state
        _storeBalance(fromPtr, from);
    }

    function _decrementBalance(IStructs.StoredStakeBalance storage fromPtr, uint256 amount)
        internal
    {
        // Remove stake from balance
        IStructs.StoredStakeBalance memory from = _syncBalanceDestructive(fromPtr);
        from.next = LibSafeMath._downcastToUint96(uint256(from.next)._sub(amount));

        // update state
        _storeBalance(fromPtr, from);
    }

    function _storeBalance(
        IStructs.StoredStakeBalance storage balancePtr,
        IStructs.StoredStakeBalance memory balance
    )
        private
    {
        // This is compressed into a single `sstore` when optimizations are enabled,
        // since the StakeBalance struct occupies a single word of storage.
        balancePtr.lastStored = balance.lastStored;
        balancePtr.next = balance.next;
        balancePtr.current = balance.current;
    }

    /// @dev Returns the stake that can be withdrawn for a given owner.
    /// This stake is in the "Deactivated & Withdrawable" state.
    /// @param owner to query.
    /// @return Withdrawable stake for owner.
    function _computeWithdrawableStake(address owner, uint256 cachedWithdrawableStakeByOwner)
        internal
        view
        returns (uint256)
    {
        // Stake cannot be withdrawn if it has been reallocated for the `next` epoch.
        // So the upper bound of withdrawable stake is always limited by the value of `next`.
        IStructs.StoredStakeBalance memory storedBalance = inactiveStakeByOwner[owner];
        uint256 storedWithdrawableBalance = withdrawableStakeByOwner[owner];
        if (storedBalance.lastStored == currentEpoch) {
            return storedBalance.next < cachedWithdrawableStakeByOwner ? storedBalance.next : cachedWithdrawableStakeByOwner;
        } else if(storedBalance.lastStored + 1 == currentEpoch) {
            return storedBalance.next < storedBalance.current ? storedBalance.next : storedBalance.current;
        } else {
            return storedBalance.next;
        }
    }
}
