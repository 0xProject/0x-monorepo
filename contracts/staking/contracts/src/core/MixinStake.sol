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
import "./MixinRewardVault.sol";
import "./MixinEpoch.sol";
import "./MixinStakeBalances.sol";


contract MixinStake is
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinEpoch,
    MixinRewardVault,
    MixinZrxVault,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    function deposit(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
    }

    function depositAndStake(uint256 amount)
        external
    {
        _mintStake(msg.sender, amount);
        activateStake(amount);
    }

    function depositAndDelegate(bytes32 poolId, uint256 amount)
        external
    {
        address owner = msg.sender;
        _mintStake(owner, amount);
        activateStake(amount);
        _delegateStake(owner, poolId, amount);
    }

    function withdraw(uint256 amount)
        external
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            getDeactivatedStake(owner) >= amount,
            "INSUFFICIENT_BALANCE"
        );
        _burnStake(owner, amount);
    }

    function forceTimelockSync(address owner)
        external
    {
        _syncTimelockedStake(owner);
    }

    function activateStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            amount <= getActivatableStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activeStakeByOwner[owner] = activeStakeByOwner[owner]._add(amount);
        totalActivatedStake = totalActivatedStake._add(amount);
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

    function deactivateAndTimelockStake(uint256 amount)
        public
    {
        address owner = msg.sender;
        _syncTimelockedStake(owner);
        require(
            amount <= getActivatedStake(owner),
            "INSUFFICIENT_BALANCE"
        );
        activeStakeByOwner[owner] = activeStakeByOwner[owner]._sub(amount);
        totalActivatedStake = totalActivatedStake._sub(amount);
        _timelockStake(owner, amount);
    }

    function deactivateAndTimelockDelegatedStake(bytes32 poolId, uint256 amount)
        public
    {
        deactivateAndTimelockStake(amount);
        address payable owner = msg.sender;
        _undelegateStake(owner, poolId, amount);
    }

    function _mintStake(address owner, uint256 amount)
        private
    {
        // deposit equivalent amount of ZRX into vault
        _depositFromOwnerIntoZrxVault(owner, amount);

        // mint stake
        stakeByOwner[owner] = stakeByOwner[owner]._add(amount);

        // emit stake event
        emit StakeMinted(
            owner,
            amount
        );
    }

    function _burnStake(address owner, uint256 amount)
        private
    {
        // burn stake
        stakeByOwner[owner] = stakeByOwner[owner]._sub(amount);

        // withdraw equivalent amount of ZRX from vault
        _withdrawToOwnerFromZrxVault(owner, amount);

        // emit stake event
        emit StakeBurned(
            owner,
            amount
        );
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
        uint256 poolBalance = getBalanceOfPoolInRewardVault(poolId);
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
        // TODO -- not full balance, just balance that belongs to delegators.
        uint256 poolBalance = getBalanceOfPoolInRewardVault(poolId);
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
            _withdrawFromPoolInRewardVault(poolId, payoutInRealAsset);
            owner.transfer(payoutInRealAsset);
        }
    }

    // Epoch | lockedAt  | total | pending | deactivated | timelock() | withdraw() | available()
    // 0     | 0         | 0     | 0       | 0       |            |            | 0
    // 1     | 1         | 5     | 0       | 0       | +5         |            | 0
    // 2     | 1         | 5     | 0       | 0       |            |            | 0
    // 2     | 2         | 15    | 5       | 0       | +10        |            | 0
    // 3     | 2         | 15    | 5       | 0       |            |            | 5
    // 3     | 3         | 30    | 15      | 5       | +15        |            | 5
    // 4     | 3         | 30    | 15      | 5       |            |            | 15
    // 5     | 3         | 30    | 15      | 5       |            |            | 30
    // 5     | 5         | 30    | 30      | 30      | +0 *       |            | 30
    // 6     | 6         | 50    | 30      | 30      | +20        |            | 30
    // 6     | 6         | 20    | 0       | 0       |            | -30        | 0
    // 7     | 6         | 20    | 0       | 0       |            |            | 0
    // 8     | 6         | 20    | 0       | 0       |            |            | 20
    function _timelockStake(address owner, uint256 amount)
        private
    {
        (IStructs.Timelock memory ownerTimelock,) = _getSynchronizedTimelock(owner);
        uint96 downcastAmount = amount._downcastToUint96();
        ownerTimelock.total += downcastAmount;
        timelockedStakeByOwner[owner] = ownerTimelock;
    }

    function _syncTimelockedStake(address owner)
        private
    {
        (IStructs.Timelock memory ownerTimelock, bool isOutOfSync) = _getSynchronizedTimelock(owner);
        if (!isOutOfSync) {
            return;
        }
        timelockedStakeByOwner[owner] = ownerTimelock;
    }
}
