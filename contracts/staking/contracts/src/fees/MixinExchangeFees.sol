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
import "../libs/LibFixedMath.sol";
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
    MixinConstants,
    Ownable,
    MixinStorage,
    MixinZrxVault,
    MixinExchangeManager,
    MixinStakingPoolRewardVault,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakeBalances,
    MixinStakingPoolRewards,
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
        // If the protocol fee payment is invalid, revert with a rich error.
        if (
            protocolFeePaid == 0 ||
            (msg.value != protocolFeePaid && msg.value != 0)
        ) {
            LibRichErrors.rrevert(LibStakingRichErrors.InvalidProtocolFeePaymentError(
                protocolFeePaid == 0 ?
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.ZeroProtocolFeePaid :
                    LibStakingRichErrors.ProtocolFeePaymentErrorCodes.MismatchedFeeAndPayment,
                protocolFeePaid,
                msg.value
            ));
        }

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

        // Only attribute the protocol fee payment to a pool if the maker is registered to a pool.
        if (poolId != NIL_POOL_ID) {
            uint256 poolStake = getTotalStakeDelegatedToPool(poolId).currentEpochBalance;
            // Ignore pools with dust stake.
            if (poolStake >= minimumPoolStake) {
                // Credit the pool.
                uint256 _feesCollectedThisEpoch = protocolFeesThisEpochByPool[poolId];
                protocolFeesThisEpochByPool[poolId] = _feesCollectedThisEpoch.safeAdd(amount);
                if (_feesCollectedThisEpoch == 0) {
                    activePoolsThisEpoch.push(poolId);
                }
            }
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

    /// @dev Withdraws the entire WETH balance of the contract.
    function _unwrapWETH()
        internal
    {
        uint256 wethBalance = IEtherToken(WETH_ADDRESS).balanceOf(address(this));

        // Don't withdraw WETH if the WETH balance is zero as a gas optimization.
        if (wethBalance != 0) {
            IEtherToken(WETH_ADDRESS).withdraw(wethBalance);
        }
    }

    /// @dev Pays rewards to market making pools that were active this epoch.
    /// Each pool receives a portion of the fees generated this epoch (see _cobbDouglas) that is
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
            uint256 stakeHeldByPoolOperator = getStakeDelegatedToPoolByOwner(rewardVault.operatorOf(poolId), poolId).currentEpochBalance;
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
            uint256 reward = _cobbDouglas(
                initialContractBalance,
                activePools[i].feesCollected,
                totalFeesCollected,
                totalWeightedStake != 0 ? activePools[i].weightedStake : 1, // only rewards are accounted for if no one has staked
                totalWeightedStake != 0 ? totalWeightedStake : 1, // this is to avoid divide-by-zero in cobb douglas
                cobbDouglasAlphaNumerator,
                cobbDouglasAlphaDenomintor
            );

            // record reward in vault
            (, uint256 membersPortion) = rewardVault.recordDepositFor(
                activePools[i].poolId,
                reward,
                activePools[i].delegatedStake == 0 // true -> reward is for operator only
            );
            totalRewardsPaid = totalRewardsPaid.safeAdd(reward);

            // sync cumulative rewards, if necessary.
            if (membersPortion > 0) {
                _recordRewardForDelegators(
                    activePools[i].poolId,
                    membersPortion,
                    activePools[i].delegatedStake,
                    currentEpoch
                );
            }

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

    /// @dev The cobb-douglas function used to compute fee-based rewards for staking pools in a given epoch.
    /// Note that in this function there is no limitation on alpha; we tend to get better rounding
    /// on the simplified versions below.
    /// @param totalRewards collected over an epoch.
    /// @param ownerFees Fees attributed to the owner of the staking pool.
    /// @param totalFees collected across all active staking pools in the epoch.
    /// @param ownerStake Stake attributed to the owner of the staking pool.
    /// @param totalStake collected across all active staking pools in the epoch.
    /// @param alphaNumerator Numerator of `alpha` in the cobb-dougles function.
    /// @param alphaDenominator Denominator of `alpha` in the cobb-douglas function.
    /// @return ownerRewards Rewards for the owner.
    function _cobbDouglas(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint256 alphaNumerator,
        uint256 alphaDenominator
    )
        internal
        pure
        returns (uint256 ownerRewards)
    {
        int256 feeRatio = LibFixedMath._toFixed(ownerFees, totalFees);
        int256 stakeRatio = LibFixedMath._toFixed(ownerStake, totalStake);
        if (feeRatio == 0 || stakeRatio == 0) {
            return ownerRewards = 0;
        }

        // The cobb-doublas function has the form:
        // `totalRewards * feeRatio ^ alpha * stakeRatio ^ (1-alpha)`
        // This is equivalent to:
        // `totalRewards * stakeRatio * e^(alpha * (ln(feeRatio / stakeRatio)))`
        // However, because `ln(x)` has the domain of `0 < x < 1`
        // and `exp(x)` has the domain of `x < 0`,
        // and fixed-point math easily overflows with multiplication,
        // we will choose the following if `stakeRatio > feeRatio`:
        // `totalRewards * stakeRatio / e^(alpha * (ln(stakeRatio / feeRatio)))`

        // Compute
        // `e^(alpha * (ln(feeRatio/stakeRatio)))` if feeRatio <= stakeRatio
        // or
        // `e^(ln(stakeRatio/feeRatio))` if feeRatio > stakeRatio
        int256 n = feeRatio <= stakeRatio ?
            LibFixedMath._div(feeRatio, stakeRatio) :
            LibFixedMath._div(stakeRatio, feeRatio);
        n = LibFixedMath._exp(
            LibFixedMath._mulDiv(
                LibFixedMath._ln(n),
                int256(alphaNumerator),
                int256(alphaDenominator)
            )
        );
        // Compute
        // `totalRewards * n` if feeRatio <= stakeRatio
        // or
        // `totalRewards / n` if stakeRatio > feeRatio
        n = feeRatio <= stakeRatio ?
            LibFixedMath._mul(stakeRatio, n) :
            LibFixedMath._div(stakeRatio, n);
        // Multiply the above with totalRewards.
        ownerRewards = LibFixedMath._uintMul(n, totalRewards);
    }
}
