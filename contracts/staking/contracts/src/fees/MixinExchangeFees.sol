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

import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibCobbDouglas.sol";
import "../immutable/MixinDeploymentConstants.sol";
import "../interfaces/IStructs.sol";
import "../staking_pools/MixinStakingPool.sol";
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
    MixinDeploymentConstants,
    MixinExchangeManager,
    MixinStakingPool
{
    using LibSafeMath for uint256;

    /// @dev Pays a protocol fee in ETH or WETH.
    ///      Only a known 0x exchange can call this method. See (MixinExchangeManager).
    /// @param makerAddress The address of the order's maker.
    /// @param payerAddress The address of the protocol fee payer.
    /// @param protocolFeePaid The protocol fee that should be paid.
    function payProtocolFee(
        address makerAddress,
        // solhint-disable-next-line
        address payerAddress,
        // solhint-disable-next-line
        uint256 protocolFeePaid
    )
        external
        payable
        onlyExchange
    {
        _assertValidProtocolFee(protocolFeePaid);

        // Transfer the protocol fee to this address if it should be paid in WETH.
        if (msg.value == 0) {
            wethAssetProxy.transferFrom(
                WETH_ASSET_DATA,
                payerAddress,
                address(this),
                protocolFeePaid
            );
        }

        // Get the pool id of the maker address.
        bytes32 poolId = getStakingPoolIdOfMaker(makerAddress);
        // Only attribute the protocol fee payment to a pool if the maker is
        // registered to a pool.
        if (poolId == NIL_POOL_ID) {
            return;
        }
        uint256 poolStake = getTotalStakeDelegatedToPool(poolId).currentEpochBalance;
        // Ignore pools with dust stake.
        if (poolStake < minimumPoolStake) {
            return;
        }
        // Look up the pool for this epoch. The epoch index is `currentEpoch % 2`
        // because we only need to remember state in the current epoch and the
        // epoch prior.
        uint256 currentEpoch = getCurrentEpoch();
        mapping (bytes32 => IStructs.ActivePool) activePoolsThisEpoch =
            activePoolsByEpoch[currentEpoch % 2];
        IStructs.ActivePool memory pool = activePoolsThisEpoch[poolId]
        // If the pool was previously inactive in this epoch, initialize it.
        if (pool.feesCollected) {
            // Compute weighted stake.
            uint256 operatorStake = getStakeDelegatedToPoolByOwner(
                rewardVault.operatorOf(poolId),
                poolId
            ).currentEpochBalance;
            pool.weightedStake = operatorStake.safeAdd(
                totalStakeDelegatedToPool
                    .safeSub(operatorStake)
                    .safeMul(delegatedStakeWeight)
                    .safeDiv(PPM_DENOMINATOR)
            );
            // Compute delegated (non-operator) stake.
            pool.delegatedStake = poolStake.safeSub(operatorStake);
            // Increase the total weighted stake.
            totalWeightedStakeThisEpoch = totalWeightedStakeThisEpoch.safeAdd(
                pool.weightedStake
            );
            // Increase the numberof active pools.
            numActivePoolsThisEpoch += 1;
            // Emit an event so keepers know what pools to pass into `finalize()`.
            emit StakingPoolActivated(currentEpoch, poolId);
        }
        // Credit the fees to the pool.
        pool.feesCollected = protocolFeePaid;
        // Increase the total fees collected this epoch.
        totalFeesCollectedThisEpoch = totalFeesCollectedThisEpoch.safeAdd(
            protocolFeePaid
        );
        // Store the pool.
        activePoolsThisEpoch[poolId] = pool;
    }

    /// @dev Pays the rebates for to market making pool that was active this epoch,
    /// then updates the epoch and other time-based periods via the scheduler
    /// (see MixinScheduler). This is intentionally permissionless, and may be called by anyone.
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
        external
        view
        returns (uint256)
    {
        uint256 wethBalance = IEtherToken(WETH_ADDRESS).balanceOf(address(this));
        return address(this).balance.safeAdd(wethBalance);
    }

    /// @dev Checks that the protocol fee passed into `payProtocolFee()` is valid.
    /// @param protocolFeePaid The `protocolFeePaid` parameter to `payProtocolFee.`
    function _assertValidProtocolFee(uint256 protocolFeePaid) private view {
        if (protocolFeePaid == 0 || (msg.value != protocolFeePaid && msg.value != 0)) {
            LibRichErrors.rrevert(LibStakingRichErrors.InvalidProtocolFeePaymentError(
                protocolFeePaid == 0 ?
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid :
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                protocolFeePaid,
                msg.value
            ));
        }
    }

    /// @dev Pays rewards to market making pools that were active this epoch.
    /// Each pool receives a portion of the fees generated this epoch (see LibCobbDouglas) that is
    /// proportional to (i) the fee volume attributed to their pool over the epoch, and
    /// (ii) the amount of stake provided by the maker and their delegators. Rebates are paid
    /// into the Reward Vault where they can be withdraw by makers and
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
        internal
        returns (
            uint256 totalActivePools,
            uint256 totalFeesCollected,
            uint256 totalWeightedStake,
            uint256 totalRewardsPaid,
            uint256 initialContractBalance,
            uint256 finalContractBalance
        )
    {
        // step 1/4 - withdraw the entire wrapped ether balance into this contract. WETH
        //            is unwrapped here to keep `payProtocolFee()` calls relatively cheap,
        //            and WETH is only withdrawn if this contract's WETH balance is nonzero.
        _unwrapWETH();

        // Initialize initial values
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

        // step 2/4 - compute stats for active maker pools
        IStructs.ActivePool[] memory activePools = new IStructs.ActivePool[](totalActivePools);
        uint32 delegatedStakeWeight = rewardDelegatedStakeWeight;
        for (uint256 i = 0; i != totalActivePools; i++) {
            bytes32 poolId = activePoolsThisEpoch[i];

            // compute weighted stake
            uint256 totalStakeDelegatedToPool = getTotalStakeDelegatedToPool(poolId).currentEpochBalance;
            uint256 stakeHeldByPoolOperator = getStakeDelegatedToPoolByOwner(poolById[poolId].operator, poolId).currentEpochBalance;
            uint256 weightedStake = stakeHeldByPoolOperator.safeAdd(
                totalStakeDelegatedToPool
                    .safeSub(stakeHeldByPoolOperator)
                    .safeMul(delegatedStakeWeight)
                    .safeDiv(PPM_DENOMINATOR)
            );

            // store pool stats
            activePools[i].poolId = poolId;
            activePools[i].feesCollected = protocolFeesThisEpochByPool[poolId];
            activePools[i].weightedStake = weightedStake;
            activePools[i].delegatedStake = totalStakeDelegatedToPool;

            // update cumulative amounts
            totalFeesCollected = totalFeesCollected.safeAdd(activePools[i].feesCollected);
            totalWeightedStake = totalWeightedStake.safeAdd(activePools[i].weightedStake);
        }

        // sanity check - this is a gas optimization that can be used because we assume a non-zero
        // split between stake and fees generated in the cobb-douglas computation (see below).
        if (totalFeesCollected == 0) {
            return (
                totalActivePools,
                totalFeesCollected,
                totalWeightedStake,
                totalRewardsPaid,
                initialContractBalance,
                finalContractBalance
            );
        }

        // step 3/4 - record reward for each pool
        for (uint256 i = 0; i != totalActivePools; i++) {
            // compute reward using cobb-douglas formula
            uint256 reward = LibCobbDouglas.cobbDouglas(
                initialContractBalance,
                activePools[i].feesCollected,
                totalFeesCollected,
                totalWeightedStake != 0 ? activePools[i].weightedStake : 1, // only rewards are accounted for if no one has staked
                totalWeightedStake != 0 ? totalWeightedStake : 1, // this is to avoid divide-by-zero in cobb douglas
                cobbDouglasAlphaNumerator,
                cobbDouglasAlphaDenominator
            );

            // pay reward to pool
            _handleStakingPoolReward(
                activePools[i].poolId,
                reward,
                activePools[i].delegatedStake,
                currentEpoch
            );

            // clear state for gas refunds
            protocolFeesThisEpochByPool[activePools[i].poolId] = 0;
            activePoolsThisEpoch[i] = 0;
        }
        activePoolsThisEpoch.length = 0;

        // step 4/4 send total payout to vault

        // Sanity check rewards calculation
        if (totalRewardsPaid > initialContractBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.MiscalculatedRewardsError(
                totalRewardsPaid,
                initialContractBalance
            ));
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
}
