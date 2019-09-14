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
import "../staking_pools/MixinStakingPoolRewards.sol";
import "../libs/LibStakingRichErrors.sol";


/// @dev This mixin contains logic for managing ZRX tokens and Stake.
contract MixinStake is
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

    /// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault. Unstake to retrieve the ZRX.
    ///      Stake is in the 'Active' status.
    /// @param amount of ZRX to stake.
    function stake(uint256 amount)
        external
    {
        address payable owner = msg.sender;

        // deposit equivalent amount of ZRX into vault
        _depositFromOwnerIntoZrxVault(owner, amount);

        // mint stake
        _incrementCurrentAndNextBalance(activeStakeByOwner[owner], amount);

        // notify
        emit Stake(
            owner,
            amount
        );
    }

    /// @dev Unstake. Tokens are withdrawn from the ZRX Vault and returned to the owner.
    ///      Stake must be in the 'inactive' status for at least one full epoch to unstake.
    /// @param amount of ZRX to unstake.
    function unstake(uint256 amount)
        external
    {
        address payable owner = msg.sender;

        // sanity check
        uint256 currentWithdrawableStake = getWithdrawableStake(owner);
        if (amount > currentWithdrawableStake) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InsufficientBalanceError(
                    amount,
                    currentWithdrawableStake
                )
            );
        }

        // burn inactive stake
        _decrementCurrentAndNextBalance(inactiveStakeByOwner[owner], amount);

        // update withdrawable field
        withdrawableStakeByOwner[owner] = currentWithdrawableStake.safeSub(amount);

        // withdraw equivalent amount of ZRX from vault
        _withdrawToOwnerFromZrxVault(owner, amount);

        // emit stake event
        emit Unstake(
            owner,
            amount
        );
    }

    /// @dev Moves stake between statuses: 'active', 'inactive' or 'delegated'.
    ///      This change comes into effect next epoch.
    /// @param from status to move stake out of.
    /// @param to status to move stake into.
    /// @param amount of stake to move.
    function moveStake(
        IStructs.StakeInfo calldata from,
        IStructs.StakeInfo calldata to,
        uint256 amount
    )
        external
    {
        // sanity check - do nothing if moving stake between the same status
        if (from.status != IStructs.StakeStatus.DELEGATED && from.status == to.status) {
            return;
        } else if (from.status == IStructs.StakeStatus.DELEGATED && from.poolId == to.poolId) {
            return;
        }

        address payable owner = msg.sender;

        // handle delegation; this must be done before moving stake as the current
        // (out-of-sync) status is used during delegation.
        if (from.status == IStructs.StakeStatus.DELEGATED) {
            _undelegateStake(
                from.poolId,
                owner,
                amount
            );
        }

        if (to.status == IStructs.StakeStatus.DELEGATED) {
            _delegateStake(
                to.poolId,
                owner,
                amount
            );
        }

        // cache the current withdrawal amount, which may change if we're moving out of the inactive status.
        uint256 withdrawableStake = (from.status == IStructs.StakeStatus.INACTIVE)
            ? getWithdrawableStake(owner)
            : 0;

        // execute move
        IStructs.StoredBalance storage fromPtr = _getBalancePtrFromStatus(owner, from.status);
        IStructs.StoredBalance storage toPtr = _getBalancePtrFromStatus(owner, to.status);
        _moveStake(fromPtr, toPtr, amount);

        // update withdrawable field, if necessary
        if (from.status == IStructs.StakeStatus.INACTIVE) {
            withdrawableStakeByOwner[owner] = _computeWithdrawableStake(owner, withdrawableStake);
        }

        // notify
        emit MoveStake(
            owner,
            amount,
            uint8(from.status),
            from.poolId,
            uint8(to.status),
            to.poolId
        );
    }

    /// @dev Delegates a owners stake to a staking pool.
    /// @param poolId Id of pool to delegate to.
    /// @param owner who wants to delegate.
    /// @param amount of stake to delegate.
    function _delegateStake(
        bytes32 poolId,
        address payable owner,
        uint256 amount
    )
        private
    {
        // cache amount delegated to pool by owner
        IStructs.StoredBalance memory initDelegatedStakeToPoolByOwner = _loadUnsyncedBalance(delegatedStakeToPoolByOwner[owner][poolId]);

        // increment how much stake the owner has delegated to the input pool
        _incrementNextBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // increment how much stake has been delegated to pool
        _incrementNextBalance(delegatedStakeByPoolId[poolId], amount);

        // synchronizes reward state in the pool that the staker is delegating to
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner = _loadAndSyncBalance(delegatedStakeToPoolByOwner[owner][poolId]);
        _syncRewardsForDelegator(poolId, owner, initDelegatedStakeToPoolByOwner, finalDelegatedStakeToPoolByOwner);
    }

    /// @dev Un-Delegates a owners stake from a staking pool.
    /// @param poolId Id of pool to un-delegate to.
    /// @param owner who wants to un-delegate.
    /// @param amount of stake to un-delegate.
    function _undelegateStake(
        bytes32 poolId,
        address payable owner,
        uint256 amount
    )
        private
    {
        // cache amount delegated to pool by owner
        IStructs.StoredBalance memory initDelegatedStakeToPoolByOwner = _loadUnsyncedBalance(delegatedStakeToPoolByOwner[owner][poolId]);

        // decrement how much stake the owner has delegated to the input pool
        _decrementNextBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // decrement how much stake has been delegated to pool
        _decrementNextBalance(delegatedStakeByPoolId[poolId], amount);

        // synchronizes reward state in the pool that the staker is undelegating from
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner = _loadAndSyncBalance(delegatedStakeToPoolByOwner[owner][poolId]);
        _syncRewardsForDelegator(poolId, owner, initDelegatedStakeToPoolByOwner, finalDelegatedStakeToPoolByOwner);
    }

    /// @dev Returns a storage pointer to a user's stake in a given status.
    /// @param owner of stake to query.
    /// @param status of user's stake to lookup.
    /// @return a storage pointer to the corresponding stake stake
    function _getBalancePtrFromStatus(address owner, IStructs.StakeStatus status)
        private
        view
        returns (IStructs.StoredBalance storage)
    {
        // lookup status
        if (status == IStructs.StakeStatus.ACTIVE) {
            return activeStakeByOwner[owner];
        } else if (status == IStructs.StakeStatus.INACTIVE) {
            return inactiveStakeByOwner[owner];
        } else if (status == IStructs.StakeStatus.DELEGATED) {
            return delegatedStakeByOwner[owner];
        }

        // invalid status
        LibRichErrors.rrevert(
            LibStakingRichErrors.InvalidStakeStatusError(uint256(status))
        );

        // required to compile ~ we should never hit this.
        revert("INVALID_STATE");
    }
}
