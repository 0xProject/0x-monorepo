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
        mapping (bytes32 => IStructs.ActivePool) storage activePoolsThisEpoch =
            activePoolsByEpoch[currentEpoch % 2];
        IStructs.ActivePool memory pool = activePoolsThisEpoch[poolId];
        // If the pool was previously inactive in this epoch, initialize it.
        if (pool.feesCollected == 0) {
            // Compute weighted stake.
            uint256 operatorStake = getStakeDelegatedToPoolByOwner(
                rewardVault.operatorOf(poolId),
                poolId
            ).currentEpochBalance;
            pool.weightedStake = operatorStake.safeAdd(
                poolStake
                    .safeSub(operatorStake)
                    .safeMul(rewardDelegatedStakeWeight)
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

    /// @dev Returns the total amount of fees collected thus far, in the current epoch.
    /// @return _totalFeesCollectedThisEpoch Total fees collected this epoch.
    function getTotalProtocolFeesThisEpoch()
        external
        view
        returns (uint256 _totalFeesCollectedThisEpoch)
    {
        _totalFeesCollectedThisEpoch = totalFeesCollectedThisEpoch;
    }

    /// @dev Returns the amount of fees attributed to the input pool this epoch.
    /// @param poolId Pool Id to query.
    /// @return feesCollectedByPool Amount of fees collected by the pool this epoch.
    function getProtocolFeesThisEpochByPool(bytes32 poolId)
        external
        view
        returns (uint256 feesCollected)
    {
        uint256 currentEpoch = getCurrentEpoch();
        // Look up the pool for this epoch. The epoch index is `currentEpoch % 2`
        // because we only need to remember state in the current epoch and the
        // epoch prior.
        IStructs.ActivePool memory pool = activePoolsByEpoch[getCurrentEpoch() % 2][poolId];
        feesCollected = pool.feesCollected;
    }

    /// @dev Checks that the protocol fee passed into `payProtocolFee()` is valid.
    /// @param protocolFeePaid The `protocolFeePaid` parameter to `payProtocolFee.`
    function _assertValidProtocolFee(uint256 protocolFeePaid)
        private
        view
    {
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
}
