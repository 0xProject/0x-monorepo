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
pragma experimental ABIEncoderV2;

import "../libs/LibSafeMath.sol";
import "../interfaces/IStructs.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../sys/MixinScheduler.sol";
import "./MixinTimelockedStake.sol";


/// @dev This mixin contains logic for querying stake balances.
/// **** Read MixinStake before continuing ****
contract MixinStakeBalances is
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinTimelockedStake
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
        return stakeByOwner[owner];
    }

    /// @dev Returns the activated stake for a given owner.
    /// This stake is in the "Activated" OR "Activated & Delegated" states.
    /// @param owner to query.
    /// @return Activated stake for owner.
    function getActivatedStake(address owner)
        public
        view
        returns (uint256)
    {
        return activatedStakeByOwner[owner];
    }

    /// @dev Returns the deactivated stake for a given owner.
    /// This stake is in the "Deactivated & Timelocked" OR "Deactivated & Withdrawable" states.
    /// @param owner to query.
    /// @return Deactivated stake for owner.
    function getDeactivatedStake(address owner)
        public
        view
        returns (uint256)
    {
        return getTotalStake(owner)._sub(getActivatedStake(owner));
    }

    /// @dev Returns the activated & undelegated stake for a given owner.
    /// This stake is in the "Activated" state.
    /// @param owner to query.
    /// @return Activated stake for owner.
    function getActivatedAndUndelegatedStake(address owner)
        public
        view
        returns (uint256)
    {
        return activatedStakeByOwner[owner]._sub(getStakeDelegatedByOwner(owner));
    }

    /// @dev Returns the stake that can be activated for a given owner.
    /// This stake is in the "Deactivated & Withdrawable" state.
    /// @param owner to query.
    /// @return Activatable stake for owner.
    function getActivatableStake(address owner)
        public
        view
        returns (uint256)
    {
        return getDeactivatedStake(owner)._sub(getTimelockedStake(owner));
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
        return getActivatableStake(owner);
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
        return delegatedStakeByOwner[owner];
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
        return delegatedStakeToPoolByOwner[owner][poolId];
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
        return delegatedStakeByPoolId[poolId];
    }

    /// @dev Returns the timelocked stake for a given owner.
    /// This stake is in the "Deactivated & Timelocked" state.
    /// @param owner to query.
    /// @return Timelocked stake for owner.
    function getTimelockedStake(address owner)
        public
        view
        returns (uint256)
    {
        (IStructs.Timelock memory timelock,) = _getSynchronizedTimelock(owner);
        return timelock.total;
    }

    /// @dev Returns the starting Timelock Period of timelocked state for a given owner.
    /// This stake is in the "Deactivated & Timelocked" state.
    /// See MixinScheduling and MixinTimelock.
    /// @param owner to query.
    /// @return Start of timelock for owner's timelocked stake.
    function getTimelockStart(address owner)
        public
        view
        returns (uint256)
    {
        (IStructs.Timelock memory timelock,) = _getSynchronizedTimelock(owner);
        return timelock.lockedAt;
    }
}
