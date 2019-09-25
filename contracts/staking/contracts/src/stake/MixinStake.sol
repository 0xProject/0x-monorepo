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
import "../staking_pools/MixinStakingPool.sol";
import "../libs/LibStakingRichErrors.sol";


/// @dev This mixin contains logic for managing ZRX tokens and Stake.
contract MixinStake is
    MixinStakingPool
{
    using LibSafeMath for uint256;

    /// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault.
    ///      Unstake to retrieve the ZRX. Stake is in the 'Active' status.
    /// @param amount of ZRX to stake.
    function stake(uint256 amount)
        external
    {
        address payable staker = msg.sender;

        // deposit equivalent amount of ZRX into vault
        getZrxVault().depositFrom(staker, amount);

        // mint stake
        _incrementCurrentAndNextBalance(_activeStakeByOwner[staker], amount);

        // update global total of active stake
        _incrementCurrentAndNextBalance(globalStakeByStatus[uint8(IStructs.StakeStatus.ACTIVE)], amount);

        // notify
        emit Stake(
            staker,
            amount
        );
    }

    /// @dev Unstake. Tokens are withdrawn from the ZRX Vault and returned to
    ///      the staker. Stake must be in the 'inactive' status for at least
    ///      one full epoch to unstake.
    /// @param amount of ZRX to unstake.
    function unstake(uint256 amount)
        external
    {
        address payable staker = msg.sender;

        // sanity check
        uint256 currentWithdrawableStake = getWithdrawableStake(staker);
        if (amount > currentWithdrawableStake) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InsufficientBalanceError(
                    amount,
                    currentWithdrawableStake
                )
            );
        }

        // burn inactive stake
        _decrementCurrentAndNextBalance(_inactiveStakeByOwner[staker], amount);

        // update global total of inactive stake
        _decrementCurrentAndNextBalance(globalStakeByStatus[uint8(IStructs.StakeStatus.INACTIVE)], amount);

        // update withdrawable field
        _withdrawableStakeByOwner[staker] =
            currentWithdrawableStake.safeSub(amount);

        // withdraw equivalent amount of ZRX from vault
        getZrxVault().withdrawFrom(staker, amount);

        // emit stake event
        emit Unstake(
            staker,
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
        if (from.status != IStructs.StakeStatus.DELEGATED
            && from.status == to.status)
        {
            return;
        } else if (from.status == IStructs.StakeStatus.DELEGATED
            && from.poolId == to.poolId)
        {
            return;
        }

        address payable staker = msg.sender;

        // handle delegation; this must be done before moving stake as the
        // current (out-of-sync) status is used during delegation.
        if (from.status == IStructs.StakeStatus.DELEGATED) {
            _undelegateStake(
                from.poolId,
                staker,
                amount
            );
        }

        if (to.status == IStructs.StakeStatus.DELEGATED) {
            _delegateStake(
                to.poolId,
                staker,
                amount
            );
        }

        // cache the current withdrawal amount, which may change if we're
        // moving out of the inactive status.
        uint256 withdrawableStake =
            (from.status == IStructs.StakeStatus.INACTIVE)
            ? getWithdrawableStake(staker)
            : 0;

        // execute move
        IStructs.StoredBalance storage fromPtr = _getBalancePtrFromStatus(staker, from.status);
        IStructs.StoredBalance storage toPtr = _getBalancePtrFromStatus(staker, to.status);
        _moveStake(fromPtr, toPtr, amount);

        // update global total of stake in the statuses being moved between
        _moveStake(
            globalStakeByStatus[uint8(from.status)],
            globalStakeByStatus[uint8(to.status)],
            amount
        );

        // update withdrawable field, if necessary
        if (from.status == IStructs.StakeStatus.INACTIVE) {
            _withdrawableStakeByOwner[staker] =
                _computeWithdrawableStake(staker, withdrawableStake);
        }

        // notify
        emit MoveStake(
            staker,
            amount,
            uint8(from.status),
            from.poolId,
            uint8(to.status),
            to.poolId
        );
    }

    /// @dev Delegates a owners stake to a staking pool.
    /// @param poolId Id of pool to delegate to.
    /// @param staker Owner who wants to delegate.
    /// @param amount Amount of stake to delegate.
    function _delegateStake(
        bytes32 poolId,
        address payable staker,
        uint256 amount
    )
        private
    {
        // Sanity check the pool we're delegating to exists.
        _assertStakingPoolExists(poolId);

        // Cache amount delegated to pool by staker.
        IStructs.StoredBalance memory initDelegatedStakeToPoolByOwner =
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[staker][poolId]);

        // Increment how much stake the staker has delegated to the input pool.
        _incrementNextBalance(
            _delegatedStakeToPoolByOwner[staker][poolId],
            amount
        );

        // Increment how much stake has been delegated to pool.
        _incrementNextBalance(_delegatedStakeByPoolId[poolId], amount);

        // Synchronizes reward state in the pool that the owner is delegating
        // to.
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner =
            _loadSyncedBalance(_delegatedStakeToPoolByOwner[staker][poolId]);

        _withdrawAndSyncDelegatorRewards(
            poolId,
            staker,
            initDelegatedStakeToPoolByOwner,
            finalDelegatedStakeToPoolByOwner
        );
    }

    /// @dev Un-Delegates a owners stake from a staking pool.
    /// @param poolId Id of pool to un-delegate from.
    /// @param staker Owner who wants to un-delegate.
    /// @param amount Amount of stake to un-delegate.
    function _undelegateStake(
        bytes32 poolId,
        address payable staker,
        uint256 amount
    )
        private
    {
        // sanity check the pool we're undelegating from exists
        _assertStakingPoolExists(poolId);

        // cache amount delegated to pool by staker
        IStructs.StoredBalance memory initDelegatedStakeToPoolByOwner =
            _loadUnsyncedBalance(_delegatedStakeToPoolByOwner[staker][poolId]);

        // decrement how much stake the staker has delegated to the input pool
        _decrementNextBalance(
            _delegatedStakeToPoolByOwner[staker][poolId],
            amount
        );

        // decrement how much stake has been delegated to pool
        _decrementNextBalance(_delegatedStakeByPoolId[poolId], amount);

        // synchronizes reward state in the pool that the owner is undelegating
        // from
        IStructs.StoredBalance memory finalDelegatedStakeToPoolByOwner =
            _loadSyncedBalance(_delegatedStakeToPoolByOwner[staker][poolId]);

        _withdrawAndSyncDelegatorRewards(
            poolId,
            staker,
            initDelegatedStakeToPoolByOwner,
            finalDelegatedStakeToPoolByOwner
        );
    }

    /// @dev Returns a storage pointer to a user's stake in a given status.
    /// @param staker Owner of stake to query.
    /// @param status Status of user's stake to lookup.
    /// @return storage A storage pointer to the corresponding stake stake
    function _getBalancePtrFromStatus(
        address staker,
        IStructs.StakeStatus status
    )
        private
        view
        returns (IStructs.StoredBalance storage)
    {
        // lookup status
        if (status == IStructs.StakeStatus.ACTIVE) {
            return _activeStakeByOwner[staker];
        } else if (status == IStructs.StakeStatus.INACTIVE) {
            return _inactiveStakeByOwner[staker];
        } else if (status == IStructs.StakeStatus.DELEGATED) {
            return _delegatedStakeByOwner[staker];
        }

        // invalid status
        LibRichErrors.rrevert(
            LibStakingRichErrors.InvalidStakeStatusError(status)
        );

        // required to compile ~ we should never hit this.
        revert("INVALID_STATE");
    }
}
