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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./MixinStake.sol";
import "../staking_pools/MixinStakingPoolRewards.sol";
import "../staking_pools/MixinStakingPool.sol";


/// @dev This mixin contains logic for managing delegated stake.
/// **** Read MixinStake before continuing ****
/// Stake can be delegated to staking pools in order to trustlessly
/// leverage the weight of several stakers. The meaning of this
/// leverage depends on the context in which stake the is being utilized.
/// For example, the amount of fee-based rewards a market maker receives
/// is correlated to how much stake has been delegated to their pool (see MixinExchangeFees).
contract MixinDelegatedStake is
    MixinStakingPool,
    MixinStake,
    MixinStakingPoolRewards
{
    using LibSafeMath for uint256;

    /// @dev Deposit Zrx and mint stake in the "Activated & Delegated" state.
    /// Note that the sender must be payable, as they may receive rewards in ETH from their staking pool.
    /// @param poolId Unique Id of staking pool to delegate stake to.
    /// @param amount of Zrx to deposit / Stake to mint.
    function depositZrxAndDelegateToStakingPool(bytes32 poolId, uint256 amount)
        external
    {
        address payable owner = msg.sender;
        _mintStake(owner, amount);
        activateStake(amount);
        _delegateStake(owner, poolId, amount);
    }

    /// @dev Activates stake that is presently in the Deactivated & Withdrawable state.
    /// Note that the sender must be payable, as they may receive rewards in ETH from their staking pool.
    /// The newly activated stake is then delegated to a staking pool.
    /// @param poolId Unique Id of staking pool to delegate stake to.
    /// @param amount of Stake to activate & delegate.
    function activateAndDelegateStake(
        bytes32 poolId,
        uint256 amount
    )
        public
    {
        activateStake(amount);
        address payable owner = msg.sender;
        _delegateStake(owner, poolId, amount);
    }

    /// @dev Deactivate & TimeLock stake that is currently in the Activated & Delegated state.
    /// Note that the sender must be payable, as they may receive rewards in ETH from their staking pool.
    /// @param poolId Unique Id of staking pool that the Stake is currently delegated to.
    /// @param amount of Stake to deactivate and timeLock.
    function deactivateAndTimeLockDelegatedStake(bytes32 poolId, uint256 amount)
        public
    {
        deactivateAndTimeLockStake(amount);
        address payable owner = msg.sender;
        _undelegateStake(owner, poolId, amount);
    }

    /// @dev Delegates stake from `owner` to the staking pool with id `poolId`
    /// @param owner of Stake
    /// @param poolId Unique Id of staking pool to delegate stake to.
    /// @param amount of Stake to delegate.
    function _delegateStake(
        address payable owner,
        bytes32 poolId,
        uint256 amount
    )
        private
    {
        // take snapshot of parameters before any computation
        uint256 _delegatedStakeByOwner = delegatedStakeByOwner[owner];
        uint256 _delegatedStakeToPoolByOwner = delegatedStakeToPoolByOwner[owner][poolId];
        uint256 _delegatedStakeByPoolId = delegatedStakeByPoolId[poolId];

        // join staking pool
        _joinStakingPool(
            poolId,
            owner,
            amount,
            _delegatedStakeByPoolId
        );

        // increment how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _delegatedStakeByOwner.safeAdd(amount);

        // increment how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _delegatedStakeToPoolByOwner.safeAdd(amount);

        // increment how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _delegatedStakeByPoolId.safeAdd(amount);
    }

    /// @dev Undelegates stake of `owner` from the staking pool with id `poolId`
    /// @param owner of Stake
    /// @param poolId Unique Id of staking pool to undelegate stake from.
    /// @param amount of Stake to undelegate.
    function _undelegateStake(
        address payable owner,
        bytes32 poolId,
        uint256 amount
    )
        private
    {
        // take snapshot of parameters before any computation
        uint256 _delegatedStakeByOwner = delegatedStakeByOwner[owner];
        uint256 _delegatedStakeToPoolByOwner = delegatedStakeToPoolByOwner[owner][poolId];
        uint256 _delegatedStakeByPoolId = delegatedStakeByPoolId[poolId];

        // leave the staking pool
        _leaveStakingPool(
            poolId,
            owner,
            amount,
            _delegatedStakeToPoolByOwner,
            _delegatedStakeByPoolId
        );

        // decrement how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _delegatedStakeByOwner.safeSub(amount);

        // decrement how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _delegatedStakeToPoolByOwner.safeSub(amount);

        // decrement how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _delegatedStakeByPoolId.safeSub(amount);
    }
}
