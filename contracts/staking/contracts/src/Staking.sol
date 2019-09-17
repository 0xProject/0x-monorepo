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

import "./interfaces/IStaking.sol";
import "./sys/MixinParams.sol";
import "./stake/MixinStake.sol";
import "./staking_pools/MixinStakingPool.sol";
import "./fees/MixinExchangeFees.sol";


contract Staking is
    IStaking,
    MixinParams,
    MixinStake,
    MixinStakingPool,
    MixinExchangeFees
{
    constructor()
        public
    {
        assembly {
            let storage_offset := 0x0

            /// Ownable

            if iszero(eq(owner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            /// MixinStorage

            if iszero(eq(wethAssetProxy_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(stakingContract_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(readOnlyProxy_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(readOnlyProxyCallee_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_activeStakeByOwner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_inactiveStakeByOwner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_delegatedStakeByOwner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_delegatedStakeToPoolByOwner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_delegatedStakeByPoolId_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_withdrawableStakeByOwner_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(nextPoolId_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(poolJoinedByMakerAddress_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(numMakersByPoolId_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(currentEpoch_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(currentEpochStartTimeInSeconds_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(protocolFeesThisEpochByPool_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(activePoolsThisEpoch_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_cumulativeRewardsByPool_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_cumulativeRewardsByPoolReferenceCounter_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(_cumulativeRewardsByPoolLastStored_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(validExchanges_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(zrxVault_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(ethVault_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(rewardVault_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(epochDurationInSeconds_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(rewardDelegatedStakeWeight_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(minimumPoolStake_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(maximumMakersInPool_slot, storage_offset)) { revert(0x0, 0x0) }
            storage_offset := add(storage_offset, 0x1)

            if iszero(eq(cobbDouglasAlphaNumerator_slot, storage_offset)) { revert(0x0, 0x0) }
            if iszero(eq(cobbDouglasAlphaNumerator_offset, 0x0)) { revert(0x0, 0x0) }

            // This number will be tightly packed into the previous values storage slot since
            // they are both `uint32`. Because of this tight packing, the offset of this value
            // must be 4, since the previous value is a 4 byte number.
            if iszero(eq(cobbDouglasAlphaDenominator_slot, storage_offset)) { revert(0x0, 0x0) }
            if iszero(eq(cobbDouglasAlphaDenominator_offset, 0x4)) { revert(0x0, 0x0) }
        }
    }

    // this contract can receive ETH
    // solhint-disable no-empty-blocks
    function ()
        external
        payable
    {}

    /// @dev Initialize storage owned by this contract.
    ///      This function should not be called directly.
    ///      The StakingProxy contract will call it in `attachStakingContract()`.
    /// @param _wethProxyAddress The address that can transfer WETH for fees.
    /// @param _ethVaultAddress Address of the EthVault contract.
    /// @param _rewardVaultAddress Address of the StakingPoolRewardVault contract.
    /// @param _zrxVaultAddress Address of the ZrxVault contract.
    function init(
        address _wethProxyAddress,
        address _ethVaultAddress,
        address payable _rewardVaultAddress,
        address _zrxVaultAddress
    )
        external
        onlyOwner
    {
        // DANGER! When performing upgrades, take care to modify this logic
        // to prevent accidentally clearing prior state.
        _initMixinScheduler();
        _initMixinParams(
            _wethProxyAddress,
            _ethVaultAddress,
            _rewardVaultAddress,
            _zrxVaultAddress
        );
    }
}
