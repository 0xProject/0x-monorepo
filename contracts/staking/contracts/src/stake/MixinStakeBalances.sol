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
        returns (uint256)
    {
        return _syncBalanceDestructive(activeStakeByOwner[owner]).current;
    }

    /// @dev Returns the deactivated stake for a given owner.
    /// This stake is in the "Deactivated & TimeLocked" OR "Deactivated & Withdrawable" states.
    /// @param owner to query.
    /// @return Deactivated stake for owner.
    function getInactiveStake(address owner)
        public
        view
        returns (uint256)
    {
        return _syncBalanceDestructive(inactiveStakeByOwner[owner]).current;
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
        return uint256(withdrawableStake[owner]);
    }

    /// @dev Returns the stake delegated by a given owner.
    /// This stake is in the "Activated & Delegated" state.
    /// @param owner to query.
    /// @return Delegated stake for owner.
    function getStakeDelegatedByOwner(address owner)
        public
        view
        returns (uint256)
    {
        return _syncBalanceDestructive(delegatedStakeByOwner[owner]).current;
    }

    /// @dev Returns the stake delegated to a specific staking pool, by a given owner.
    /// This stake is in the "Activated & Delegated" state.
    /// @param owner to query.
    /// @param poolId Unique Id of pool.
    /// @return Stake delegaated to pool by owner.
    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return _syncBalanceDestructive(delegatedStakeToPoolByOwner[owner][poolId]).current;
    }

    /// @dev Returns the total stake delegated to a specific staking pool, across all members.
    /// This stake is in the "Activated & Delegated" state.
    /// @param poolId Unique Id of pool.
    /// @return Total stake delegaated to pool.
    function getTotalStakeDelegatedToPool(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return _syncBalanceDestructive(delegatedStakeByPoolId[poolId]).current;
    }

    function _syncBalanceDestructive(IStructs.StakeBalance memory balance)
        internal
        view
        returns (IStructs.StakeBalance memory)
    {
        uint64 currentEpoch = getCurrentEpoch();
        if (currentEpoch > balance.lastStored) {
            balance.lastStored = currentEpoch;
            balance.current = balance.next;
        }
        return balance;
    }

    function _moveStake(
        IStructs.StakeBalance storage fromPtr,
        IStructs.StakeBalance storage toPtr,
        uint96 amount
    )
        internal
    {
        IStructs.StakeBalance memory from = _syncBalanceDestructive(fromPtr);
        IStructs.StakeBalance memory to = _syncBalanceDestructive(toPtr);

        if (amount > from.next) {
            revert("@TODO - INSERT RICH REVERT");
        }

        from.next -= amount;
        to.next += amount;

        // update state
        _storeBalance(fromPtr, from);
        _storeBalance(toPtr, to);
    }

    function _storeBalance(
        IStructs.StakeBalance storage balancePtr,
        IStructs.StakeBalance memory balance
    )
        private
    {
        // @Note this is the cost of one sstore.
        balancePtr.lastStored = balance.lastStored;
        balancePtr.next = balance.next;
        balancePtr.current = balance.current;
    }
}
