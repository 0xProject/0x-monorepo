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

import "../src/interfaces/IStructs.sol";
import "./TestStakingNoWETH.sol";


contract TestMixinStake is
    TestStakingNoWETH
{
    event ZrxVaultDepositFrom(
        address staker,
        uint256 amount
    );

    event ZrxVaultWithdrawFrom(
        address staker,
        uint256 amount
    );

    event MoveStakeStorage(
        bytes32 fromBalanceSlot,
        bytes32 toBalanceSlot,
        uint256 amount
    );

    event IncreaseCurrentAndNextBalance(
        bytes32 balanceSlot,
        uint256 amount
    );

    event DecreaseCurrentAndNextBalance(
        bytes32 balanceSlot,
        uint256 amount
    );

    event IncreaseNextBalance(
        bytes32 balanceSlot,
        uint256 amount
    );

    event DecreaseNextBalance(
        bytes32 balanceSlot,
        uint256 amount
    );

    event WithdrawAndSyncDelegatorRewards(
        bytes32 poolId,
        address delegator
    );

    /// @dev Advance the epoch counter.
    function advanceEpoch() external {
        currentEpoch += 1;
    }

    /// @dev `IZrxVault.depositFrom`
    function depositFrom(address staker, uint256 amount) external {
        emit ZrxVaultDepositFrom(staker, amount);
    }

    /// @dev `IZrxVault.withdrawFrom`
    function withdrawFrom(address staker, uint256 amount) external {
        emit ZrxVaultWithdrawFrom(staker, amount);
    }

    function getDelegatedStakeByPoolIdSlot(bytes32 poolId)
        external
        view
        returns (bytes32 slot)
    {
        return _getPtrSlot(_delegatedStakeByPoolId[poolId]);
    }

    function getDelegatedStakeToPoolByOwnerSlot(bytes32 poolId, address staker)
        external
        view
        returns (bytes32 slot)
    {
        return _getPtrSlot(_delegatedStakeToPoolByOwner[staker][poolId]);
    }

    function getGlobalStakeByStatusSlot(IStructs.StakeStatus status)
        external
        view
        returns (bytes32 slot)
    {
        return _getPtrSlot(_globalStakeByStatus[uint8(status)]);
    }

    function getOwnerStakeByStatusSlot(address owner, IStructs.StakeStatus status)
        external
        view
        returns (bytes32 slot)
    {
        return _getPtrSlot(_ownerStakeByStatus[uint8(status)][owner]);
    }

    /// @dev Set `_ownerStakeByStatus`
    function setOwnerStakeByStatus(
        address owner,
        IStructs.StakeStatus status,
        IStructs.StoredBalance memory stake
    )
        public
    {
        _ownerStakeByStatus[uint8(status)][owner] = stake;
    }

    /// @dev Overridden to use this contract as the ZRX vault.
    function getZrxVault()
        public
        view
        returns (IZrxVault zrxVault)
    {
        return IZrxVault(address(this));
    }

    /// @dev Overridden to only emit an event.
    function _withdrawAndSyncDelegatorRewards(
        bytes32 poolId,
        address member
    )
        internal
    {
        emit WithdrawAndSyncDelegatorRewards(poolId, member);
    }

    /// @dev Overridden to only emit an event.
    function _moveStake(
        IStructs.StoredBalance storage fromPtr,
        IStructs.StoredBalance storage toPtr,
        uint256 amount
    )
        internal
    {
        emit MoveStakeStorage(
            _getPtrSlot(fromPtr),
            _getPtrSlot(toPtr),
            amount
        );
    }

    /// @dev Overridden to only emit an event.
    function _increaseCurrentAndNextBalance(
        IStructs.StoredBalance storage balancePtr,
        uint256 amount
    )
        internal
    {
        emit IncreaseCurrentAndNextBalance(
            _getPtrSlot(balancePtr),
            amount
        );
    }

    /// @dev Overridden to only emit an event.
    function _decreaseCurrentAndNextBalance(
        IStructs.StoredBalance storage balancePtr,
        uint256 amount
    )
        internal
    {
        emit DecreaseCurrentAndNextBalance(
            _getPtrSlot(balancePtr),
            amount
        );
    }

    /// @dev Overridden to only emit an event.
    function _increaseNextBalance(
        IStructs.StoredBalance storage balancePtr,
        uint256 amount
    )
        internal
    {
        emit IncreaseNextBalance(
            _getPtrSlot(balancePtr),
            amount
        );
    }

    /// @dev Overridden to only emit an event.
    function _decreaseNextBalance(
        IStructs.StoredBalance storage balancePtr,
        uint256 amount
    )
        internal
    {
        emit DecreaseNextBalance(
            _getPtrSlot(balancePtr),
            amount
        );
    }

    /// @dev Overridden to just return the input.
    function _loadCurrentBalance(IStructs.StoredBalance storage balancePtr)
        internal
        view
        returns (IStructs.StoredBalance memory balance)
    {
        balance = balancePtr;
    }

    /// @dev Throws if poolId == 0x0
    function _assertStakingPoolExists(bytes32 poolId)
        internal
        view
    {
        require(poolId != bytes32(0), "INVALID_POOL");
    }

    // solhint-disable-next-line
    function _getPtrSlot(IStructs.StoredBalance storage ptr)
        private
        pure
        returns (bytes32 offset)
    {
        assembly {
            offset := ptr_slot
        }
    }
}
