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
import "../libs/LibRewardMath.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinZrxVault.sol";
import "../staking_pools/MixinStakingPoolRewardVault.sol";
import "../staking_pools/MixinStakingPoolRewards.sol";
import "../sys/MixinScheduler.sol";
import "./MixinStakeBalances.sol";


/// @dev This mixin contains logic for managing ZRX tokens and Stake.
contract MixinStake is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinOwnable,
    MixinStakingPoolRewardVault,
    MixinZrxVault,
    MixinStakingPool,
    MixinStakeBalances,
    MixinStakingPoolRewards
{

    using LibSafeMath for uint256;

    /// @dev Deposit Zrx and mint stake in the activated stake.
    /// This is a convenience function, and can be used in-place of
    /// calling `depositZrxAndMintDeactivatedStake` and `activateStake`.
    /// This mints stake for the sender that is in the "Activated" state.
    /// @param amount of Zrx to deposit / Stake to mint.
    function stake(uint256 amount)
        external
    {
        // deposit equivalent amount of ZRX into vault
        _depositFromOwnerIntoZrxVault(msg.sender, amount);

        // mint stake
        _mintBalance(activeStakeByOwner[msg.sender], amount);

        // emit stake event
        emit StakeMinted(
            msg.sender,
            amount
        );
    }

    function unstake(uint256 amount)
        external
    {
        // sanity check
        uint256 currentWithdrawableStake = getWithdrawableStake(msg.sender);
        require(
            amount <= currentWithdrawableStake,
            "CANNOT_WITHDRAW"
        );

        // burn stake
        _burnBalance(inactiveStakeByOwner[msg.sender], amount);

        // update withdrawable field
        withdrawableStakeByOwner[msg.sender] = currentWithdrawableStake._sub(amount);

        // withdraw equivalent amount of ZRX from vault
        _withdrawToOwnerFromZrxVault(msg.sender, amount);

        // emit stake event
        emit StakeBurned(
            msg.sender,
            amount
        );
    }

    function moveStake(IStructs.StakeState calldata from, IStructs.StakeState calldata to, uint256 amount)
        external
    {
        if (from.id == IStructs.StakeStateId.DELEGATED) {
            _undelegateStake(
                from.poolId,
                msg.sender,
                amount
            );
        } else if (from.id == IStructs.StakeStateId.INACTIVE) {
            // update withdrawable field
            withdrawableStakeByOwner[msg.sender] = getWithdrawableStake(msg.sender);
        }

        if (to.id == IStructs.StakeStateId.DELEGATED) {
            _delegateStake(
                to.poolId,
                msg.sender,
                amount
            );
        }

        IStructs.StoredStakeBalance storage fromPtr = _getBalancePtrFromState(from);
        IStructs.StoredStakeBalance storage toPtr = _getBalancePtrFromState(to);
        _moveStake(fromPtr, toPtr, amount);

        if (from.id == IStructs.StakeStateId.INACTIVE) {
            // update withdrawable field
            withdrawableStakeByOwner[msg.sender] = getWithdrawableStake(msg.sender);
        }


        /*
            emit StakeMoved(
                getCurrentEpoch(),
                owner,
                fromState.id,
                toState.id,
            );
        */
    }

    function _getBalancePtrFromState(IStructs.StakeState memory state)
        private
        returns (IStructs.StoredStakeBalance storage)
    {
        if (state.id == IStructs.StakeStateId.ACTIVE) {
            return activeStakeByOwner[msg.sender];
        } else if(state.id == IStructs.StakeStateId.INACTIVE) {
            return inactiveStakeByOwner[msg.sender];
        } else if(state.id == IStructs.StakeStateId.DELEGATED) {
            return delegatedStakeByOwner[msg.sender];
        } else {
            revert("Illegal State");
        }
    }

    function _delegateStake(
        bytes32 poolId,
        address payable owner,
        uint256 amount
    )
        private
    {
       // syncRewardBalanceOfStakingPoolMember(poolId, owner);

        // decrement how much stake the owner has delegated to the input pool
        _incrementBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // increment how much stake has been delegated to pool
        _incrementBalance(delegatedStakeByPoolId[poolId], amount);
    }

    function _undelegateStake(
        bytes32 poolId,
        address payable owner,
        uint256 amount
    )
        private
    {
       // syncRewardBalanceOfStakingPoolMember(poolId, owner);

        // decrement how much stake the owner has delegated to the input pool
        _decrementBalance(delegatedStakeToPoolByOwner[owner][poolId], amount);

        // decrement how much stake has been delegated to pool
        _decrementBalance(delegatedStakeByPoolId[poolId], amount);
    }
}
