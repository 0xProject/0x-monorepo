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

import "../libs/LibSafeMath.sol";
import "../libs/LibRewardMath.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinZrxVault.sol";
import "./MixinStakingPoolRewardVault.sol";
import "./MixinScheduler.sol";
import "./MixinStakeBalances.sol";
import "./MixinTimelockedStake.sol";
import "./MixinStake.sol";


contract MixinDelegatedStake is
    IMixinScheduler,
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinZrxVault,
    MixinOwnable,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakeBalances,
    MixinTimelockedStake,
    MixinStake
{

    using LibSafeMath for uint256;

    function depositAndDelegate(bytes32 poolId, uint256 amount)
        external
    {
        address owner = msg.sender;
        _mintStake(owner, amount);
        activateStake(amount);
        _delegateStake(owner, poolId, amount);
    }

    function activateAndDelegateStake(
        bytes32 poolId,
        uint256 amount
    )
        public
    {
        activateStake(amount);
        address owner = msg.sender;
        _delegateStake(owner, poolId, amount);
    }

    function deactivateAndTimelockDelegatedStake(bytes32 poolId, uint256 amount)
        public
    {
        deactivateAndTimelockStake(amount);
        address payable owner = msg.sender;
        _undelegateStake(owner, poolId, amount);
    }

    function _delegateStake(address owner, bytes32 poolId, uint256 amount)
        private
    {
        // take snapshot of parameters before any computation
        uint256 _delegatedStakeByOwner = delegatedStakeByOwner[owner];
        uint256 _delegatedStakeToPoolByOwner = delegatedStakeToPoolByOwner[owner][poolId];
        uint256 _delegatedStakeByPoolId = delegatedStakeByPoolId[poolId];

        // increment how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _delegatedStakeByOwner._add(amount);

        // increment how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _delegatedStakeToPoolByOwner._add(amount);

        // increment how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _delegatedStakeByPoolId._add(amount);

        // update delegator's share of reward pool
        // note that this uses the snapshot parameters
        uint256 poolBalance = getBalanceOfMembersInStakingPoolRewardVault(poolId);
        uint256 buyIn = LibRewardMath._computeBuyInDenominatedInShadowAsset(
            amount,
            _delegatedStakeByPoolId,
            shadowRewardsByPoolId[poolId],
            poolBalance
        );
        if (buyIn > 0) {
            shadowRewardsInPoolByOwner[owner][poolId] = shadowRewardsInPoolByOwner[owner][poolId]._add(buyIn);
            shadowRewardsByPoolId[poolId] = shadowRewardsByPoolId[poolId]._add(buyIn);
        }
    }

    // question - should we then return the amount withdrawn?
    function _undelegateStake(address payable owner, bytes32 poolId, uint256 amount)
        private
    {
        // take snapshot of parameters before any computation
        uint256 _delegatedStakeByOwner = delegatedStakeByOwner[owner];
        uint256 _delegatedStakeToPoolByOwner = delegatedStakeToPoolByOwner[owner][poolId];
        uint256 _delegatedStakeByPoolId = delegatedStakeByPoolId[poolId];

        // decrement how much stake the owner has delegated
        delegatedStakeByOwner[owner] = _delegatedStakeByOwner._sub(amount);

        // decrement how much stake the owner has delegated to the input pool
        delegatedStakeToPoolByOwner[owner][poolId] = _delegatedStakeToPoolByOwner._sub(amount);

        // decrement how much stake has been delegated to pool
        delegatedStakeByPoolId[poolId] = _delegatedStakeByPoolId._sub(amount);

        // get payout
        uint256 poolBalance = getBalanceOfMembersInStakingPoolRewardVault(poolId);
        uint256 payoutInRealAsset;
        uint256 payoutInShadowAsset;
        if (_delegatedStakeToPoolByOwner == amount) {
            // full payout
            payoutInShadowAsset = shadowRewardsInPoolByOwner[owner][poolId];
            payoutInRealAsset = LibRewardMath._computePayoutDenominatedInRealAsset(
                amount,
                _delegatedStakeByPoolId,
                payoutInShadowAsset,
                shadowRewardsByPoolId[poolId],
                poolBalance
            );
        } else {
            // partial payout
            (payoutInRealAsset, payoutInShadowAsset) = LibRewardMath._computePartialPayout(
                amount,
                _delegatedStakeToPoolByOwner,
                _delegatedStakeByPoolId,
                shadowRewardsInPoolByOwner[owner][poolId],
                shadowRewardsByPoolId[poolId],
                poolBalance
            );
        }
        shadowRewardsInPoolByOwner[owner][poolId] = shadowRewardsInPoolByOwner[owner][poolId]._sub(payoutInShadowAsset);
        shadowRewardsByPoolId[poolId] = shadowRewardsByPoolId[poolId]._sub(payoutInShadowAsset);

        // withdraw payout for delegator
        if (payoutInRealAsset > 0) {
            _withdrawFromMemberInStakingPoolRewardVault(poolId, payoutInRealAsset);
            owner.transfer(payoutInRealAsset);
        }
    }
}
