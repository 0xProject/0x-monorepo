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
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinZrxVault.sol";
import "../staking_pools/MixinStakingPoolRewardVault.sol";
import "../staking_pools/MixinStakingPoolRewards.sol";
import "../sys/MixinScheduler.sol";
import "../libs/LibStakingRichErrors.sol";
import "./MixinStakeBalances.sol";
import "./MixinStakeStorage.sol";


/// @dev This mixin contains logic for managing ZRX tokens and Stake.
contract MixinStake is
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinStakeBalances,
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

    /// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault. Unstake to retrieve the ZRX.
    ///      Stake is in the 'Active' state.
    /// @param amount of ZRX to stake.
    function stake(uint256 amount)
        external
    {
        address payable owner = msg.sender;

        // deposit equivalent amount of ZRX into vault
        _depositFromOwnerIntoZrxVault(owner, amount);

        // mint stake
        _mintBalance(activeStakeByOwner[owner], amount);

        // notify
        emit Stake(
            owner,
            amount
        );
    }

    /// @dev Unstake. Tokens are withdrawn from the ZRX Vault and returned to the owner.
    ///      Stake must be in the 'inactive' state for at least one full epoch to unstake.
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
        _burnBalance(inactiveStakeByOwner[owner], amount);

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

    /// @dev Moves stake between states: 'active', 'inactive' or 'delegated'.
    ///      This change comes into effect next epoch.
    /// @param from state to move stake out of.
    /// @param to state to move stake into.
    /// @param amount of stake to move.
    function moveStake(
        IStructs.StakeStateInfo calldata from,
        IStructs.StakeStateInfo calldata to,
        uint256 amount
    )
        external
    {
        // sanity check - do nothing if moving stake between the same state
        if (from.state != IStructs.StakeState.DELEGATED && from.state == to.state) {
            return;
        } else if (from.state == IStructs.StakeState.DELEGATED && from.poolId == to.poolId) {
            return;
        }

        address payable owner = msg.sender;

        // handle delegation; this must be done before moving stake as the current
        // (out-of-sync) state is used during delegation.
        if (from.state == IStructs.StakeState.DELEGATED) {
            _undelegateStake(
                from.poolId,
                owner,
                amount
            );
        }

        if (to.state == IStructs.StakeState.DELEGATED) {
            _delegateStake(
                to.poolId,
                owner,
                amount
            );
        }

        // cache the current withdrawal state if we're moving out of the inactive state.
        uint256 cachedWithdrawableStakeByOwner = (from.state == IStructs.StakeState.INACTIVE)
            ? getWithdrawableStake(owner)
            : 0;

        // execute move
        IStructs.DelayedBalance storage fromPtr = _getBalancePtrFromState(from.state);
        IStructs.DelayedBalance storage toPtr = _getBalancePtrFromState(to.state);
        _moveStake(fromPtr, toPtr, amount);

        // update withdrawable field, if necessary
        if (from.state == IStructs.StakeState.INACTIVE) {
            withdrawableStakeByOwner[owner] = _computeWithdrawableStake(owner, cachedWithdrawableStakeByOwner);
        }

        // notify
        emit MoveStake(
            owner,
            amount,
            uint8(from.state),
            from.poolId,
            uint8(to.state),
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
        // transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the delegator pool.
        _transferDelegatorsAccumulatedRewardsToEthVault(poolId, owner);

        // sync cumulative rewards that we'll need for future computations
        _syncCumulativeRewardsNeededByDelegator(poolId, currentEpoch);

        // increment how much stake the owner has delegated to the input pool
        _incrementBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // increment how much stake has been delegated to pool
        _incrementBalance(delegatedStakeByPoolId[poolId], amount);
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
        // transfer any rewards from the transient pool vault to the eth vault;
        // this must be done before we can modify the owner's portion of the delegator pool.
        _transferDelegatorsAccumulatedRewardsToEthVault(poolId, owner);

        // sync cumulative rewards that we'll need for future computations
        _syncCumulativeRewardsNeededByDelegator(poolId, currentEpoch);

        // decrement how much stake the owner has delegated to the input pool
        _decrementBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // decrement how much stake has been delegated to pool
        _decrementBalance(delegatedStakeByPoolId[poolId], amount);
    }

    /// @dev Returns a storage pointer to a user's stake in a given state.
    /// @param state of user's stake to lookup.
    /// @return a storage pointer to the corresponding stake stake
    function _getBalancePtrFromState(IStructs.StakeState state)
        private
        view
        returns (IStructs.DelayedBalance storage)
    {
        // lookup state
        address owner = msg.sender;
        if (state == IStructs.StakeState.ACTIVE) {
            return activeStakeByOwner[owner];
        } else if (state == IStructs.StakeState.INACTIVE) {
            return inactiveStakeByOwner[owner];
        } else if (state == IStructs.StakeState.DELEGATED) {
            return delegatedStakeByOwner[owner];
        }

        // invalid state
        LibRichErrors.rrevert(
            LibStakingRichErrors.InvalidStakeState(uint256(state))
        );

        // required to compile ~ we should never hit this.
        revert("INVALID_STATE");
    }
}
