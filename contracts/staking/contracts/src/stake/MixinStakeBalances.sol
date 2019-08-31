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
import "./MixinStakeStorage.sol";


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
    MixinZrxVault,
    MixinStakeStorage
{

    using LibSafeMath for uint256;

    /// @dev Returns the total stake for a given owner.
    /// @param owner of stake.
    /// @return Total active stake for owner.
    function getTotalStake(address owner)
        public
        view
        returns (uint256)
    {
        return _balanceOfOwnerInZrxVault(owner);
    }

    /// @dev Returns the active stake for a given owner.
    /// @param owner of stake.
    /// @return Active stake for owner.
    function getActiveStake(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.DelayedBalance memory storedBalance = _syncBalanceDestructive(activeStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the inactive stake for a given owner.
    /// @param owner of stake.
    /// @return Inactive stake for owner.
    function getInactiveStake(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.DelayedBalance memory storedBalance = _syncBalanceDestructive(inactiveStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the amount stake that can be withdrawn for a given owner.
    /// @param owner of stake.
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
    /// @param owner of stake.
    /// @return Delegated stake for owner.
    function getStakeDelegatedByOwner(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.DelayedBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeByOwner[owner]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the stake delegated to a specific staking pool, by a given owner.
    /// @param owner of stake.
    /// @param poolId Unique Id of pool.
    /// @return Stake delegaated to pool by owner.
    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.DelayedBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeToPoolByOwner[owner][poolId]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the total stake delegated to a specific staking pool, across all members.
    /// @param poolId Unique Id of pool.
    /// @return Total stake delegated to pool.
    function getTotalStakeDelegatedToPool(bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.DelayedBalance memory storedBalance = _syncBalanceDestructive(delegatedStakeByPoolId[poolId]);
        return IStructs.StakeBalance({
            current: storedBalance.current,
            next: storedBalance.next
        });
    }

    /// @dev Returns the stake that can be withdrawn for a given owner.
    /// This stake is in the "Deactive & Withdrawable" state.
    /// @param owner to query.
    /// @return Withdrawable stake for owner.
    function _computeWithdrawableStake(address owner, uint256 cachedWithdrawableStakeByOwner)
        internal
        view
        returns (uint256)
    {
        // stake cannot be withdrawn if it has been reallocated for the `next` epoch;
        // so the upper bound of withdrawable stake is always limited by the value of `next`.
        IStructs.DelayedBalance memory storedBalance = inactiveStakeByOwner[owner];
        uint256 storedWithdrawableBalance = withdrawableStakeByOwner[owner];
        if (storedBalance.lastStored == currentEpoch) {
            return storedBalance.next < cachedWithdrawableStakeByOwner ? storedBalance.next : cachedWithdrawableStakeByOwner;
        } else if(storedBalance.lastStored._add(1) == currentEpoch) {
            return storedBalance.next < storedBalance.current ? storedBalance.next : storedBalance.current;
        } else {
            return storedBalance.next;
        }
    }
}
