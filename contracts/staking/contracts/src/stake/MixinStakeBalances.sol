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
import "./MixinStakeStorage.sol";


/// @dev This mixin contains logic for querying stake balances.
/// **** Read MixinStake before continuing ****
contract MixinStakeBalances is
    MixinStakeStorage
{
    using LibSafeMath for uint256;

    /// @dev Returns the total active stake across the entire staking system.
    /// @return Global active stake.
    function getGlobalActiveStake()
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(
            globalStakeByStatus[uint8(IStructs.StakeStatus.ACTIVE)]
        );
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the total inactive stake across the entire staking system.
    /// @return Global inactive stake.
    function getGlobalInactiveStake()
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(
            globalStakeByStatus[uint8(IStructs.StakeStatus.INACTIVE)]
        );
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the total stake delegated across the entire staking system.
    /// @return Global delegated stake.
    function getGlobalDelegatedStake()
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(
            globalStakeByStatus[uint8(IStructs.StakeStatus.DELEGATED)]
        );
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the total stake for a given staker.
    /// @param staker of stake.
    /// @return Total active stake for staker.
    function getTotalStake(address staker)
        external
        view
        returns (uint256)
    {
        return getZrxVault().balanceOf(staker);
    }

    /// @dev Returns the active stake for a given staker.
    /// @param staker of stake.
    /// @return Active stake for staker.
    function getActiveStake(address staker)
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(_activeStakeByOwner[staker]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the inactive stake for a given staker.
    /// @param staker of stake.
    /// @return Inactive stake for staker.
    function getInactiveStake(address staker)
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(_inactiveStakeByOwner[staker]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the stake delegated by a given staker.
    /// @param staker of stake.
    /// @return Delegated stake for staker.
    function getStakeDelegatedByOwner(address staker)
        external
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(_delegatedStakeByOwner[staker]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the amount stake that can be withdrawn for a given staker.
    /// @param staker of stake.
    /// @return Withdrawable stake for staker.
    function getWithdrawableStake(address staker)
        public
        view
        returns (uint256)
    {
        return _computeWithdrawableStake(staker, _withdrawableStakeByOwner[staker]);
    }

    /// @dev Returns the stake delegated to a specific staking pool, by a given staker.
    /// @param staker of stake.
    /// @param poolId Unique Id of pool.
    /// @return Stake delegaated to pool by staker.
    function getStakeDelegatedToPoolByOwner(address staker, bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(_delegatedStakeToPoolByOwner[staker][poolId]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the total stake delegated to a specific staking pool,
    ///      across all members.
    /// @param poolId Unique Id of pool.
    /// @return Total stake delegated to pool.
    function getTotalStakeDelegatedToPool(bytes32 poolId)
        public
        view
        returns (IStructs.StakeBalance memory balance)
    {
        IStructs.StoredBalance memory storedBalance = _loadSyncedBalance(_delegatedStakeByPoolId[poolId]);
        return IStructs.StakeBalance({
            currentEpochBalance: storedBalance.currentEpochBalance,
            nextEpochBalance: storedBalance.nextEpochBalance
        });
    }

    /// @dev Returns the stake that can be withdrawn for a given staker.
    /// @param staker to query.
    /// @param lastStoredWithdrawableStake The amount of withdrawable stake
    ///        that was last stored.
    /// @return Withdrawable stake for staker.
    function _computeWithdrawableStake(
        address staker,
        uint256 lastStoredWithdrawableStake
    )
        internal
        view
        returns (uint256)
    {
        // stake cannot be withdrawn if it has been reallocated for the `next` epoch;
        // so the upper bound of withdrawable stake is always limited by the value of `next`.
        IStructs.StoredBalance memory storedBalance = _loadUnsyncedBalance(_inactiveStakeByOwner[staker]);
        if (storedBalance.currentEpoch == currentEpoch) {
            return LibSafeMath.min256(
                storedBalance.nextEpochBalance,
                lastStoredWithdrawableStake
            );
        } else if (uint256(storedBalance.currentEpoch).safeAdd(1) == currentEpoch) {
            return LibSafeMath.min256(
                storedBalance.nextEpochBalance,
                storedBalance.currentEpochBalance
            );
        } else {
            return storedBalance.nextEpochBalance;
        }
    }
}
