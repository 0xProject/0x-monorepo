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


/// @dev This mixin contains the logic for 0x protocol fees.
/// Protocol fees are sent by 0x exchanges every time there is a trade.
/// If the maker has associated their address with a pool (see MixinStakingPool.sol), then
/// the fee will be attributed to their pool. At the end of an epoch the maker and
/// their pool will receive a rebate that is proportional to (i) the fee volume attributed
/// to their pool over the epoch, and (ii) the amount of stake provided by the maker and
/// their delegators. Note that delegated stake (see MixinStake) is weighted less than
/// stake provided by directly by the maker; this is a disincentive for market makers to
/// monopolize a single pool that they all delegate to.
contract MixinExchangeFees is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinScheduler,
    MixinOwnable,
    MixinExchangeManager,
    MixinStakingPoolRewardVault,
    MixinZrxVault,
    MixinStakeStorage,
    MixinStakingPool,
    MixinStakeBalances
{

    using LibSafeMath for uint256;

    /// @dev Pays a protocol fee in ETH.
    ///      Only a known 0x exchange can call this method. See (MixinExchangeManager).
    /// @param makerAddress The address of the order's maker.
    function payProtocolFee(address makerAddress)
        external
        payable
        onlyExchange
    {
        uint256 amount = msg.value;
        bytes32 poolId = getStakingPoolIdOfMaker(makerAddress);
        uint256 _feesCollectedThisEpoch = protocolFeesThisEpochByPool[poolId];
        protocolFeesThisEpochByPool[poolId] = _feesCollectedThisEpoch._add(amount);
        if (_feesCollectedThisEpoch == 0) {
            activePoolsThisEpoch.push(poolId);
        }
    }

    /// @dev Pays the rebates for to market making pool that was active this epoch,
    /// then updates the epoch and other time-based periods via the scheduler (see MixinScheduler).
    /// This is intentionally permissionless, and may be called by anyone.
    function finalizeFees()
        external
    {
        // distribute fees to market maker pools as a reward
        (uint256 totalActivePools,
        uint256 totalFeesCollected,
        uint256 totalWeightedStake,
        uint256 totalRewardsPaid,
        uint256 initialContractBalance,
        uint256 finalContractBalance) = _distributeFeesAmongMakerPools();
        emit RewardsPaid(
            totalActivePools,
            totalFeesCollected,
            totalWeightedStake,
            totalRewardsPaid,
            initialContractBalance,
            finalContractBalance
        );

        _goToNextEpoch();
    }

    /// @dev Returns the total amount of fees collected thus far, in the current epoch.
    /// @return Amount of fees.
    function getTotalProtocolFeesThisEpoch()
        public
        view
        returns (uint256)
    {
        return address(this).balance;
    }

    /// @dev Returns the amount of fees attributed to the input pool.
    /// @param poolId Pool Id to query.
    /// @return Amount of fees.
    function getProtocolFeesThisEpochByPool(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return protocolFeesThisEpochByPool[poolId];
    }

    /// @dev Pays rewards to market making pools that were active this epoch.
    /// Each pool receives a portion of the fees generated this epoch (see LibFeeMath) that is
    /// proportional to (i) the fee volume attributed to their pool over the epoch, and
    /// (ii) the amount of stake provided by the maker and their delegators. Rebates are paid
    /// into the Reward Vault (see MixinStakingPoolRewardVault) where they can be withdraw by makers and
    /// the members of their pool. There will be a small amount of ETH leftover in this contract
    /// after paying out the rebates; at present, this rolls over into the next epoch. Eventually,
    /// we plan to deposit this leftover into a DAO managed by the 0x community.
    /// @return totalActivePools Total active pools this epoch.
    /// @return totalFeesCollected Total fees collected this epoch, across all active pools.
    /// @return totalWeightedStake Total weighted stake attributed to each pool. Delegated stake is weighted less.
    /// @return totalRewardsPaid Total rewards paid out across all active pools.
    /// @return initialContractBalance Balance of this contract before paying rewards.
    /// @return finalContractBalance Balance of this contract after paying rewards.
    function _distributeFeesAmongMakerPools()
        private
        returns (
            uint256 totalActivePools,
            uint256 totalFeesCollected,
            uint256 totalWeightedStake,
            uint256 totalRewardsPaid,
            uint256 initialContractBalance,
            uint256 finalContractBalance
        )
    {
        // initialize return values
        uint256 epoch = getCurrentEpoch();
        totalActivePools = activePoolsThisEpoch.length;
        totalFeesCollected = 0;
        totalWeightedStake = 0;
        totalRewardsPaid = 0;
        initialContractBalance = address(this).balance;
        finalContractBalance = initialContractBalance;

        // sanity check - is there a balance to payout and were there any active pools?
        if (initialContractBalance == 0 || totalActivePools == 0) {
            return (
                totalActivePools,
                totalFeesCollected,
                totalWeightedStake,
                totalRewardsPaid,
                initialContractBalance,
                finalContractBalance
            );
        }

        // step 1/3 - compute stats for active maker pools
        IStructs.ActivePool[] memory activePools = new IStructs.ActivePool[](totalActivePools);
        for (uint256 i = 0; i != totalActivePools; i++) {
            bytes32 poolId = activePoolsThisEpoch[i];

            // compute weighted stake
            uint256 totalStakeDelegatedToPool = getTotalStakeDelegatedToPool(poolId).current;
            uint256 stakeHeldByPoolOperator = getActiveStake(getStakingPoolOperator(poolId)).current; // @TODO Update
            uint256 weightedStake = stakeHeldByPoolOperator._add(
                totalStakeDelegatedToPool
                ._mul(REWARD_PAYOUT_DELEGATED_STAKE_PERCENT_VALUE)
                ._div(100)
            );

            // store pool stats
            activePools[i].poolId = poolId;
            activePools[i].feesCollected = protocolFeesThisEpochByPool[poolId];
            activePools[i].weightedStake = weightedStake;
            activePools[i].delegatedStake = totalStakeDelegatedToPool;

            // update cumulative amounts
            totalFeesCollected = totalFeesCollected._add(activePools[i].feesCollected);
            totalWeightedStake = totalWeightedStake._add(activePools[i].weightedStake);
        }

        // sanity check - this is a gas optimization that can be used because we assume a non-zero
        // split between stake and fees generated in the cobb-douglas computation (see below).
        if (totalFeesCollected == 0 || totalWeightedStake == 0) {
            return (
                totalActivePools,
                totalFeesCollected,
                totalWeightedStake,
                totalRewardsPaid,
                initialContractBalance,
                finalContractBalance
            );
        }

        // step 2/3 - record reward for each pool
        for (uint256 i = 0; i != totalActivePools; i++) {
            // compute reward using cobb-douglas formula
            uint256 reward = LibFeeMath._cobbDouglasSuperSimplified(
                initialContractBalance,
                activePools[i].feesCollected,
                totalFeesCollected,
                activePools[i].weightedStake,
                totalWeightedStake
            );

            // NOTE THIS SHOULD BE THE DELEGATOR PORTION OF REWARD @TODO
            if (activePools[i].delegatedStake == 0) {
                // @TODO fees go to operator
            } else {
                uint256 lastKnownEpoch = rewardRatioSumsLastUpdated[activePools[i].poolId];
                rewardRatioSums[activePools[i].poolId][epoch].numerator = (rewardRatioSums[activePools[i].poolId][lastKnownEpoch].numerator * activePools[i].delegatedStake + reward * rewardRatioSums[activePools[i].poolId][lastKnownEpoch].denominator) / 10**18;
                rewardRatioSums[activePools[i].poolId][epoch].denominator = (rewardRatioSums[activePools[i].poolId][lastKnownEpoch].denominator * activePools[i].delegatedStake) / 10**18;
                rewardRatioSumsLastUpdated[activePools[i].poolId] = epoch;
            }

            // record reward in vault
            rewardVault.recordDepositFor(activePools[i].poolId, reward);
            totalRewardsPaid = totalRewardsPaid._add(reward);

            // clear state for gas refunds
            protocolFeesThisEpochByPool[activePools[i].poolId] = 0;
            activePoolsThisEpoch[i] = 0;
        }
        activePoolsThisEpoch.length = 0;

        // step 3/3 send total payout to vault
        require(
            totalRewardsPaid <= initialContractBalance,
            "MISCALCULATED_REWARDS"
        );
        if (totalRewardsPaid > 0) {
            _depositIntoStakingPoolRewardVault(totalRewardsPaid);
        }
        finalContractBalance = address(this).balance;

        return (
            totalActivePools,
            totalFeesCollected,
            totalWeightedStake,
            totalRewardsPaid,
            initialContractBalance,
            finalContractBalance
        );
    }



    struct Reward {
        bytes32 poolId;
        uint256 reward;
    }


    function testFinalizeFees(Reward[] memory rewards)
        public
        payable
    {

        uint256 epoch = getCurrentEpoch();

        for (uint i = 0; i != rewards.length; i++) {
            uint256 totalStakeDelegatedToPool = getTotalStakeDelegatedToPool(rewards[i].poolId).current;
            bytes32 poolId = rewards[i].poolId;

            uint256 lastKnownEpoch = rewardRatioSumsLastUpdated[poolId];
            if (totalStakeDelegatedToPool != 0) {
                rewardRatioSums[poolId][epoch].numerator = (rewardRatioSums[poolId][lastKnownEpoch].numerator * totalStakeDelegatedToPool + rewards[i].reward * rewardRatioSums[poolId][lastKnownEpoch].denominator) / 10**18;
                rewardRatioSums[poolId][epoch].denominator = (rewardRatioSums[poolId][lastKnownEpoch].denominator * totalStakeDelegatedToPool) / 10**18;
                rewardRatioSumsLastUpdated[poolId] = epoch;
            }

            // record reward in vault
            rewardVault.recordDepositFor(rewards[i].poolId, rewards[i].reward);
        }

        if (address(this).balance > 0) {
            _depositIntoStakingPoolRewardVault(address(this).balance);
        }

        _goToNextEpoch();
    }
}
