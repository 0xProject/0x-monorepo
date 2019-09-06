/*

  Copyright 2019 ZeroEx Intl.

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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
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
    MixinConstants,
    MixinStorage,
    MixinZrxVault,
    MixinScheduler,
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
        IStructs.StoredBalance memory storedBalance = _loadAndSyncBalance(activeStakeByOwner[owner]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
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
        IStructs.StoredBalance memory storedBalance = _loadAndSyncBalance(inactiveStakeByOwner[owner]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
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
        return _computeWithdrawableStake(owner, withdrawableStakeByOwner[owner]);
    }

    /// @dev Returns the stake delegated by a given owner.
    /// @param owner of stake.
    /// @return Delegated stake for owner.
    function getStakeDelegatedByOwner(address owner)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadAndSyncBalance(delegatedStakeByOwner[owner]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
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
        IStructs.StoredBalance memory storedBalance = _loadAndSyncBalance(delegatedStakeToPoolByOwner[owner][poolId]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
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
        IStructs.StoredBalance memory storedBalance = _loadAndSyncBalance(delegatedStakeByPoolId[poolId]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the stake that can be withdrawn for a given owner.
    /// @param owner to query.
    /// @param lastStoredWithdrawableStake The amount of withdrawable stake that was last stored.
    /// @return Withdrawable stake for owner.
    function _computeWithdrawableStake(address owner, uint256 lastStoredWithdrawableStake)
        internal
        view
        returns (uint256)
    {
        // stake cannot be withdrawn if it has been reallocated for the `next` epoch;
        // so the upper bound of withdrawable stake is always limited by the value of `next`.
        IStructs.StoredBalance memory storedBalance = _loadUnsyncedBalance(inactiveStakeByOwner[owner]);
        if (storedBalance.currentEpoch == currentEpoch) {
            return LibSafeMath.min256(storedBalance.nextEpochBalance, lastStoredWithdrawableStake);
        } else if (uint256(storedBalance.currentEpoch).safeAdd(1) == currentEpoch) {
            return LibSafeMath.min256(storedBalance.nextEpochBalance, storedBalance.currentEpochBalance);
        } else {
            return storedBalance.nextEpochBalance;
        }
    }
}
