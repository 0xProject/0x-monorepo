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

pragma solidity ^0.5.5;

import "../libs/LibSafeMath.sol";
import "../libs/LibFeeMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "../interfaces/IStructs.sol";
import "../stake/MixinStakeBalances.sol";
import "../sys/MixinScheduler.sol";
import "../staking_pools/MixinStakingPool.sol";
import "../staking_pools/MixinStakingPoolRewardVault.sol";
import "./MixinExchangeManager.sol";


contract MixinExchangeFees is
    IStakingEvents,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinOwnable,
    MixinExchangeManager,
    MixinScheduler,
    MixinStakingPoolRewardVault,
    MixinStakingPool,
    MixinTimelockedStake,
    MixinStakeBalances
{

    /// @dev This mixin contains the logic for 0x protocol fees.
    /// Protocol fees are sent by 0x exchanges every time there is a trade.
    /// If the maker has associated their address with a pool (see MixinStakingPool.sol), then
    /// the fee will be attributed to their pool. At the end of an epoch the maker and
    /// their pool will receive a rebate that is proportional to (i) the fee volume attributed
    /// to their pool over the epoch, and (ii) the amount of stake provided by the maker and
    /// their delegators. Note that delegated stake (see MixinStake) is weighted less than
    /// stake provided by directly by the maker; this is a disincentive for market makers to
    /// monopolize a single pool that they all delegate to.

    using LibSafeMath for uint256;

    /// @dev Pays a protocol fee in ETH.
    ///      Only a known 0x exchange can call this method. See (MixinExchangeManager).
    /// @param makerAddress The address of the order's maker.
    function payProtocolFee(address makerAddress)
        external
        payable
        onlyExchange
    {
        require(
            msg.value != 0,
            "ZERO_PROTOCOL_FEE"
        );

        bytes32 poolId = getStakingPoolIdOfMaker(makerAddress);
        IStructs.ActivePool storage pool = _activePoolsByEpoch[_currentEpoch % 2][poolId];
        IStructs.ActivePoolState poolState = pool.state;
        uint256 feesCollected = 0;

        if (poolState == IStructs.ActivePoolState.DEFAULT) {
            // This pool wasn't active two epochs ago or has already been activated.
            // If the pool wasn't active two epochs ago, `pool.feesCollected` will be zero.
            feesCollected = pool.feesCollected;
        } else if (poolState == IStructs.ActivePoolState.FINALIZED) {
            // Recoup some gas by reseting these states.
            pool.state = IStructs.ActivePoolState.DEFAULT; // 0
            pool.weightedStake = 0;
        } else {
            // We should not have gotten here.
            assert(false);
        }
        if (feesCollected == 0) {
            // Pool hasn't been activated for this epoch.
            pool.feesCollected = msg.value;
            emit StakingPoolActivated(_currentEpoch, poolId);
        } else {
            pool.feesCollected = feesCollected._add(msg.value);
        }
    }

    /// @dev Ends an epoch, marking all pools that were active during the current
    ///      epoch ready for finalization through `preFinalizePools()` and `finalizePools()`,
    ///      then advances the epoch.
    ///      This will fail if all pools in the previous epoch have not been completely finalized.
    ///      If there are were no active pools this epoch, the epoch will be immediately
    ///      finalized.
    function endEpoch()
        external
    {
        // Make sure that the last epoch was fully finalized.
        require(
            _unfinalizedPoolsRemaining == 0,
            "LAST_EPOCH_NOT_FINALIZED"
        );

        // Populate end-of-epoch state variables.
        _unfinalizedRewardsAvailable = address(this).balance;
        _unfinalizedPoolsRemaining = _numActivePools;
        _numPreFinalizedPools = 0;
        _unfinalizedTotalWeightedStake = 0;
        _unfinalizedTotalFeesCollected = 0;
        _rewardsPaidLastEpoch = 0;

        // Reset new epoch state variables.
        _numActivePools = 0;

        // If there are no pools to finalize, we can just finalize the epoch now.
        if (_unfinalizedPoolsRemaining == 0) {
            emit EpochFinalized(
                _currentEpoch,
                0, // No rewards were paid out.
                address(this).balance
            );
        }
        _goToNextEpoch();
    }

    /// @dev Prepares pools for finalization after a call to `endEpoch()`.
    ///      Pools that weren't active in the last epoch or have already been
    ///      pre-finalized will be ignored.
    /// @param poolIds Array of active pool IDs to finalize.
    /// @return poolsRemaining How many pools are remaining to be pre-finalized.
    function preFinalizePools(bytes32[] calldata poolIds)
        external
        returns (uint256 poolsRemaining)
    {
        poolsRemaining = _unfinalizedPoolsRemaining._sub(_numPreFinalizedPools);
        if (poolsRemaining == 0) {
            // All pools already finalized.
            return 0;
        }

        uint256 epoch = _currentEpoch - 1;
        mapping(bytes32 => IStructs.ActivePool) storage pools = _activePoolsByEpoch[epoch % 2];
        uint256 numPools = poolIds.length;
        for (uint256 i = 0; i != numPools; i++) {
            bytes32 poolId = poolIds[i];
            IStructs.ActivePool storage pool = pools[poolId];
            if (pool.feesCollected == 0 || pool.state != IStructs.ActivePoolState.DEFAULT) {
                // Pool is not eligible.
                continue;
            }
            pool.state = IStructs.ActivePoolState.PRE_FINALIZED;
            poolsRemaining -= 1;

            // Computed weighted stake.
            uint256 weightedStake = _getPoolWeightedStake(poolId);

            pool.weightedStake = weightedStake;
            _unfinalizedTotalWeightedStake = _unfinalizedTotalWeightedStake._add(weightedStake);
            _unfinalizedTotalFeesCollected = _unfinalizedTotalFeesCollected._add(pool.feesCollected);
        }
        _numPreFinalizedPools = _unfinalizedPoolsRemaining._sub(poolsRemaining);
        return poolsRemaining;
    }

    /// @dev Finalizes pools, paying out their rewards.
    ///      All active pools must first have been passed through `preFinalizePools()`.
    /// @param poolIds Array of pre-finalized pool IDs to finalize.
    /// @return poolsRemaining How many pools are remaining to be finalized.
    function finalizePools(bytes32[] calldata poolIds)
        external
        returns (uint256 poolsRemaining)
    {
        poolsRemaining = _unfinalizedPoolsRemaining;
        // Make sure we've pre-finalized all pools first.
        require(
            poolsRemaining == _numPreFinalizedPools,
            "ALL_POOLS_MUST_BE_PREFINALIZED"
        );
        // If we have no more pools to finalize, stop.
        if (poolsRemaining == 0) {
            return 0;
        }

        uint256 epoch = _currentEpoch - 1;
        mapping(bytes32 => IStructs.ActivePool) storage pools = _activePoolsByEpoch[epoch % 2];
        uint256 totalRewardsToPay = 0;
        uint256 numPools = poolIds.length;
        uint256 unfinalizedRewardsAvailable = _unfinalizedRewardsAvailable;
        uint256 unfinalizedTotalFeesCollected = _unfinalizedTotalFeesCollected;
        uint256 unfinalizedTotalWeightedStake = _unfinalizedTotalWeightedStake;
        for (uint256 i = 0; i < numPools; i++) {
            bytes32 poolId = poolIds[i];
            IStructs.ActivePool storage pool = pools[poolId];
            assert(pool.feesCollected != 0);
            if (pool.state != IStructs.ActivePoolState.PRE_FINALIZED) {
                // Pool is not eligible.
                continue;
            }
            pool.state = IStructs.ActivePoolState.FINALIZED;
            poolsRemaining -= 1;

            uint256 poolWeightedStake = pool.weightedStake;
            uint256 poolFeesCollected = pool.feesCollected;

            // Compute reward for this pool.
            uint256 reward = LibFeeMath._cobbDouglasSuperSimplified(
                unfinalizedRewardsAvailable,
                poolFeesCollected,
                unfinalizedTotalFeesCollected,
                poolWeightedStake,
                unfinalizedTotalWeightedStake
            );

            // Increase the amount we have to deposit into the reward vault
            // at the end of this loop.
            totalRewardsToPay = totalRewardsToPay._add(reward);
            // Credit the pool in the reward vault.
            (uint256 operatorReward, uint256 membersReward) = _splitPoolReward(poolId, reward);
            _recordDepositInStakingPoolRewardVault(
                poolId,
                operatorReward,
                membersReward
            );
            emit RewardDeposited(
                poolId,
                epoch,
                reward,
                poolWeightedStake,
                poolFeesCollected
            );
        }

        // Depost the total rewards into the reward vault.
        if (totalRewardsToPay != 0) {
            _rewardsPaidLastEpoch = _rewardsPaidLastEpoch._add(totalRewardsToPay);
            _depositIntoStakingPoolRewardVault(totalRewardsToPay);
        }

        // Keep `_unfinalizedPoolsRemaining` and `_numPreFinalizedPools` in sync.
        assert(poolsRemaining <= _unfinalizedPoolsRemaining);
        _unfinalizedPoolsRemaining = _numPreFinalizedPools = poolsRemaining;

        // If we've finalized all the pools, the epoch is finalized.
        if (poolsRemaining == 0) {
            assert(_rewardsPaidLastEpoch <= unfinalizedRewardsAvailable);
            emit EpochFinalized(
                epoch,
                _rewardsPaidLastEpoch,
                unfinalizedRewardsAvailable._sub(_rewardsPaidLastEpoch)
            );
        }
    }

    /// @dev Returns the amount of fees attributed to the given pool.
    /// @param poolId Pool Id to query.
    /// @return Amount of fees.
    function getProtocolFeesThisEpochByPool(bytes32 poolId)
        external
        view
        returns (uint256 feesCollected)
    {
        IStructs.ActivePool storage pool = _activePoolsByEpoch[_currentEpoch % 2][poolId];
        feesCollected = pool.feesCollected;
    }

    function _getPoolWeightedStake(bytes32 poolId)
        private
        view
        returns (uint256 weightedStake)
    {
        uint256 totalStakeDelegatedToPool = getTotalStakeDelegatedToPool(poolId);
        uint256 stakeHeldByPoolOperator = getActivatedAndUndelegatedStake(
            getStakingPoolOperator(poolId)
        );
        weightedStake = stakeHeldByPoolOperator._add(
            totalStakeDelegatedToPool
            ._mul(REWARD_PAYOUT_DELEGATED_STAKE_PERCENT_VALUE)
            ._div(TOKEN_MULTIPLIER)
        );
    }

    /// @dev Computes a split a reward between the operator and members of a pool,
    ///      based on the pool's `operatorShare`.
    /// @param poolId The pool's unique ID.
    /// @param reward The reward.
    function _splitPoolReward(
        bytes32 poolId,
        uint256 reward
    )
        private
        view
        returns (uint256 operatorReward, uint256 membersReward)
    {
        IStructs.Pool memory pool = _poolById[poolId];
        operatorReward = reward._getPartialAmountCeil(
            pool.operatorShare,
            TOKEN_MULTIPLIER
        );
        membersReward = reward._sub(operatorReward);
    }
}
