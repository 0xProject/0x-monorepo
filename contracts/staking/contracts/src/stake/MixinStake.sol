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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibSafeDowncast.sol";
import "../staking_pools/MixinStakingPool.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IOnchainGov.sol";

contract MixinStake is
    MixinStakingPool
{
    using LibSafeMath for uint256;

    IOnchainGov onchain_goverence;

    /// @dev Stake ZRX tokens. Tokens are deposited into the ZRX Vault.
    ///      Unstake to retrieve the ZRX. Stake is in the 'Active' status.
    /// @param amount Amount of ZRX to stake.
    function stake(uint256 amount)
        external
    {
        address staker = msg.sender;

        // deposit equivalent amount of ZRX into vault
        getZrxVault().depositFrom(staker, amount);

        // mint stake
        _increaseCurrentAndNextBalance(
            _ownerStakeByStatus[uint8(IStructs.StakeStatus.UNDELEGATED)][staker],
            amount
        );

        // This stake starts as undelegated so we mint the full amount to the user
        _addGovPower(msg.sender, amount);

        // notify
        emit Stake(
            staker,
            amount
        );
    }

    /// @dev Unstake. Tokens are withdrawn from the ZRX Vault and returned to
    ///      the staker. Stake must be in the 'undelegated' status in both the
    ///      current and next epoch in order to be unstaked.
    /// @param amount Amount of ZRX to unstake.
    function unstake(uint256 amount)
        external
    {
        address staker = msg.sender;

        IStructs.StoredBalance memory undelegatedBalance =
            _loadCurrentBalance(_ownerStakeByStatus[uint8(IStructs.StakeStatus.UNDELEGATED)][staker]);

        // stake must be undelegated in current and next epoch to be withdrawn
        uint256 currentWithdrawableStake = LibSafeMath.min256(
            undelegatedBalance.currentEpochBalance,
            undelegatedBalance.nextEpochBalance
        );

        if (amount > currentWithdrawableStake) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InsufficientBalanceError(
                    amount,
                    currentWithdrawableStake
                )
            );
        }

        // burn undelegated stake
        _decreaseCurrentAndNextBalance(
            _ownerStakeByStatus[uint8(IStructs.StakeStatus.UNDELEGATED)][staker],
            amount
        );

        // Remove goverence power
        _removeGovPower(msg.sender, amount);

        // withdraw equivalent amount of ZRX from vault
        getZrxVault().withdrawFrom(staker, amount);

        // emit stake event
        emit Unstake(
            staker,
            amount
        );
    }

    /// @dev Moves stake between statuses: 'undelegated' or 'delegated'.
    ///      Delegated stake can also be moved between pools.
    ///      This change comes into effect next epoch.
    /// @param from Status to move stake out of.
    /// @param to Status to move stake into.
    /// @param amount Amount of stake to move.
    function moveStake(
        IStructs.StakeInfo calldata from,
        IStructs.StakeInfo calldata to,
        uint256 amount
    )
        external
    {
        address staker = msg.sender;

        // Sanity check: no-op if no stake is being moved.
        if (amount == 0) {
            return;
        }

        // Sanity check: no-op if moving stake from undelegated to undelegated.
        if (from.status == IStructs.StakeStatus.UNDELEGATED &&
            to.status == IStructs.StakeStatus.UNDELEGATED) {
            return;
        }

        // The staking pool has half of the voting power and
        // the staker has half, while the tokens are staked.
        uint256 votingPower = amount/2;

        // handle delegation
        if (from.status == IStructs.StakeStatus.DELEGATED) {
            _undelegateStake(
                from.poolId,
                staker,
                amount
            );
            // Burn voting power from the from pool
            _removeGovPower(getStakingPool(from.poolId).operator, votingPower);
        } else {
            // Remove half of the sender's power
            _removeGovPower(staker, votingPower);
        }

        if (to.status == IStructs.StakeStatus.DELEGATED) {
            _delegateStake(
                to.poolId,
                staker,
                amount
            );
            // Give the to staking pool half of 'amount' as voting power
            _addGovPower(getStakingPool(to.poolId).operator, votingPower);
        } else {
            // Add half to the sender's power as it is no longer in a pool.
            _addGovPower(staker, votingPower);
        }

        // execute move
        IStructs.StoredBalance storage fromPtr = _ownerStakeByStatus[uint8(from.status)][staker];
        IStructs.StoredBalance storage toPtr = _ownerStakeByStatus[uint8(to.status)][staker];
        _moveStake(
            fromPtr,
            toPtr,
            amount
        );

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

    /// @dev Alows a user to look up their staked balances and
    ///      synchronize thier voting power with the gov contract
    /// @param poolId Unique Id of pool.
    function synchronizeGovPower(bytes32 poolId) external {
        address staker = msg.sender;
        // We give the user thier voting power
        IStructs.StoredBalance memory undelegatedBalance =
            _loadCurrentBalance(_ownerStakeByStatus[uint8(IStructs.StakeStatus.UNDELEGATED)][staker]);
        IStructs.StoredBalance memory delegatedBalance =
            _loadCurrentBalance(_ownerStakeByStatus[uint8(IStructs.StakeStatus.DELEGATED)][staker]);
        // The user's gov power is thier next epoc unstaked balance + half of
        // their staked balance
        uint96 userGovPower = LibSafeDowncast.downcastToUint96(
            undelegatedBalance.nextEpochBalance + delegatedBalance.nextEpochBalance/2);
        // Call the goverance contracts and set the user power
        onchain_goverence.setVotingPower(msg.sender, userGovPower);
        
        // Now we refresh the voting power for the pool which is staked too.
        if (delegatedBalance.nextEpochBalance != 0) {
            IStructs.StoredBalance memory stakingGovPower = getTotalStakeDelegatedToPool(poolId);
            onchain_goverence.setVotingPower(LibSafeDowncast.downcastToUint96(stakingGovPower.nextEpochBalance));
        }
    }

    /// @dev Delegates a owners stake to a staking pool.
    /// @param poolId Id of pool to delegate to.
    /// @param staker Owner who wants to delegate.
    /// @param amount Amount of stake to delegate.
    function _delegateStake(
        bytes32 poolId,
        address staker,
        uint256 amount
    )
        private
    {
        // Sanity check the pool we're delegating to exists.
        _assertStakingPoolExists(poolId);

        _withdrawAndSyncDelegatorRewards(
            poolId,
            staker
        );

        // Increase how much stake the staker has delegated to the input pool.
        _increaseNextBalance(
            _delegatedStakeToPoolByOwner[staker][poolId],
            amount
        );

        // Increase how much stake has been delegated to pool.
        _increaseNextBalance(
            _delegatedStakeByPoolId[poolId],
            amount
        );

        // Increase next balance of global delegated stake.
        _increaseNextBalance(
            _globalStakeByStatus[uint8(IStructs.StakeStatus.DELEGATED)],
            amount
        );
    }

    /// @dev Un-Delegates a owners stake from a staking pool.
    /// @param poolId Id of pool to un-delegate from.
    /// @param staker Owner who wants to un-delegate.
    /// @param amount Amount of stake to un-delegate.
    function _undelegateStake(
        bytes32 poolId,
        address staker,
        uint256 amount
    )
        private
    {
        // sanity check the pool we're undelegating from exists
        _assertStakingPoolExists(poolId);

        _withdrawAndSyncDelegatorRewards(
            poolId,
            staker
        );

        // Decrease how much stake the staker has delegated to the input pool.
        _decreaseNextBalance(
            _delegatedStakeToPoolByOwner[staker][poolId],
            amount
        );

        // Decrease how much stake has been delegated to pool.
        _decreaseNextBalance(
            _delegatedStakeByPoolId[poolId],
            amount
        );

        // Decrease next balance of global delegated stake (aggregated across all stakers).
        _decreaseNextBalance(
            _globalStakeByStatus[uint8(IStructs.StakeStatus.DELEGATED)],
            amount
        );
    }

    function _addGovPower(address who, uint256 amount) internal {
        uint96 downcastAmount = LibSafeDowncast.downcastToUint96(amount);
        onchain_goverence.mint(who, downcastAmount);
    }

    function _removeGovPower(address who, uint256 amount) internal {
        uint96 downcastAmount = LibSafeDowncast.downcastToUint96(amount);
        onchain_goverence.burn(who, downcastAmount);
    }
}
