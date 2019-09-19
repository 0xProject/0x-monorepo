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
import "../stake/MixinStakeBalances.sol";
import "../sys/MixinAbstract.sol";
import "../staking_pools/MixinStakingPool.sol";
import "./MixinExchangeManager.sol";


/// @dev This mixin contains the logic for 0x protocol fees.
///      Protocol fees are sent by 0x exchanges every time there is a trade.
///      If the maker has associated their address with a pool (see
///      MixinStakingPool.sol), then the fee will be attributed to their pool.
///      At the end of an epoch the maker and their pool will receive a rebate
///      that is proportional to (i) the fee volume attributed to their pool
///      over the epoch, and (ii) the amount of stake provided by the maker and
///      their delegators. Note that delegated stake (see MixinStake) is
///      weighted less than stake provided by directly by the maker; this is a
///      disincentive for market makers to monopolize a single pool that they
///      all delegate to.
contract MixinExchangeFees is
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    MixinDeploymentConstants,
    Ownable,
    MixinStorage,
    MixinStakingPoolModifiers,
    MixinExchangeManager,
    MixinScheduler,
    MixinStakeStorage,
    MixinStakingPoolMakers,
    MixinStakeBalances,
    MixinCumulativeRewards,
    MixinStakingPoolRewards,
    MixinStakingPool
{
    using LibSafeMath for uint256;

    /// @dev Pays a protocol fee in ETH or WETH.
    ///      Only a known 0x exchange can call this method. See
    ///      (MixinExchangeManager).
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

        // Transfer the protocol fee to this address if it should be paid in
        // WETH.
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

        uint256 poolStake =
            getTotalStakeDelegatedToPool(poolId).currentEpochBalance;
        // Ignore pools with dust stake.
        if (poolStake < minimumPoolStake) {
            return;
        }

        // Look up the pool for this epoch.
        uint256 currentEpoch = currentEpoch;
        mapping (bytes32 => IStructs.ActivePool) storage activePoolsThisEpoch =
            _getActivePoolsFromEpoch(currentEpoch);
        IStructs.ActivePool memory pool = activePoolsThisEpoch[poolId];

        // If the pool was previously inactive in this epoch, initialize it.
        if (pool.feesCollected == 0) {
            // Compute member and total weighted stake.
            (pool.membersStake, pool.weightedStake) =
                _computeMembersAndWeightedStake(poolId, poolStake);

            // Increase the total weighted stake.
            totalWeightedStakeThisEpoch =
                totalWeightedStakeThisEpoch.safeAdd(pool.weightedStake);

            // Increase the numberof active pools.
            numActivePoolsThisEpoch += 1;

            // Emit an event so keepers know what pools to pass into
            // `finalize()`.
            emit StakingPoolActivated(currentEpoch, poolId);
        }

        // Credit the fees to the pool.
        pool.feesCollected = pool.feesCollected.safeAdd(protocolFeePaid);

        // Increase the total fees collected this epoch.
        totalFeesCollectedThisEpoch = totalFeesCollectedThisEpoch.safeAdd(
            protocolFeePaid
        );

        // Store the pool.
        activePoolsThisEpoch[poolId] = pool;
    }

    /// @dev Returns the total amount of fees collected thus far, in the current
    ///      epoch.
    /// @return _totalFeesCollectedThisEpoch Total fees collected this epoch.
    function getTotalProtocolFeesThisEpoch()
        external
        view
        returns (uint256 _totalFeesCollectedThisEpoch)
    {
        _totalFeesCollectedThisEpoch = totalFeesCollectedThisEpoch;
    }

    /// @dev Returns the total balance of this contract, including WETH.
    /// @return totalBalance Total balance.
    function getTotalBalance()
        external
        view
        returns (uint256 totalBalance)
    {
        totalBalance = address(this).balance.safeAdd(
            IEtherToken(WETH_ADDRESS).balanceOf(address(this))
        );
    }

    /// @dev Get information on an active staking pool in this epoch.
    /// @param poolId Pool Id to query.
    /// @return pool ActivePool struct.
    function getActiveStakingPoolThisEpoch(bytes32 poolId)
        external
        view
        returns (IStructs.ActivePool memory pool)
    {
        pool = _getActivePoolFromEpoch(currentEpoch, poolId);
    }

    /// @dev Computes the members and weighted stake for a pool at the current
    ///      epoch.
    /// @param poolId ID of the pool.
    /// @param totalStake Total (unweighted) stake in the pool.
    /// @return membersStake Non-operator stake in the pool.
    /// @return weightedStake Weighted stake of the pool.
    function _computeMembersAndWeightedStake(
            bytes32 poolId,
            uint256 totalStake
    )
        private
        view
        returns (uint256 membersStake, uint256 weightedStake)
    {
        uint256 operatorStake = getStakeDelegatedToPoolByOwner(
            _poolById[poolId].operator,
            poolId
        ).currentEpochBalance;
        membersStake = totalStake.safeSub(operatorStake);
        weightedStake = operatorStake.safeAdd(
            membersStake
                .safeMul(rewardDelegatedStakeWeight)
                .safeDiv(PPM_DENOMINATOR)
        );
    }

    /// @dev Checks that the protocol fee passed into `payProtocolFee()` is
    ///      valid.
    /// @param protocolFeePaid The `protocolFeePaid` parameter to
    ///        `payProtocolFee.`
    function _assertValidProtocolFee(uint256 protocolFeePaid)
        private
        view
    {
        if (protocolFeePaid == 0 ||
                (msg.value != protocolFeePaid && msg.value != 0)) {
            LibRichErrors.rrevert(
                LibStakingRichErrors.InvalidProtocolFeePaymentError(
                    protocolFeePaid == 0 ?
                        LibStakingRichErrors
                            .ProtocolFeePaymentErrorCodes
                            .ZeroProtocolFeePaid :
                        LibStakingRichErrors
                            .ProtocolFeePaymentErrorCodes
                            .MismatchedFeeAndPayment,
                    protocolFeePaid,
                    msg.value
                )
            );
        }
    }
}
