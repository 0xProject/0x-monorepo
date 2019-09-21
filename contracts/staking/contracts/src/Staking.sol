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

import "./fees/MixinExchangeFees.sol";
import "./interfaces/IStaking.sol";
import "./sys/MixinParams.sol";
import "./sys/MixinFinalizer.sol";
import "./stake/MixinStake.sol";
import "./staking_pools/MixinStakingPool.sol";
import "./sys/MixinParams.sol";


contract Staking is
    IStaking,
    IStakingEvents,
    MixinAbstract,
    MixinConstants,
    MixinDeploymentConstants,
    Ownable,
    MixinStorage,
    MixinStakingPoolModifiers,
    MixinExchangeManager,
    MixinScheduler,
    MixinParams,
    MixinStakeStorage,
    MixinStakingPoolMakers,
    MixinStakeBalances,
    MixinCumulativeRewards,
    MixinStakingPoolRewards,
    MixinFinalizer,
    MixinStakingPool,
    MixinStake,
    MixinExchangeFees
{
    /// @dev This constructor will ensure that the storage layout of this contract
    ///      is compatible with the original staking storage layout.
    constructor()
        public
    {
        _assertStorageLayout();
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
        onlyAuthorized
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

    /// @dev This function will fail if the storage layout of this contract deviates from
    ///      the original staking contract's storage. The use of this function provides assurance
    ///      that regressions from the original storage layout will not occur.
    function _assertStorageLayout()
        internal
        pure
    {
        assembly {
            let slot := 0x0
            let offset := 0x0

            /// Ownable

            assertSlotAndOffset(
                owner_slot,
                owner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            /// MixinStorage

            assertSlotAndOffset(
                wethAssetProxy_slot,
                wethAssetProxy_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                stakingContract_slot,
                stakingContract_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                readOnlyProxy_slot,
                readOnlyProxy_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                readOnlyProxyCallee_slot,
                readOnlyProxyCallee_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _activeStakeByOwner_slot,
                _activeStakeByOwner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _inactiveStakeByOwner_slot,
                _inactiveStakeByOwner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _delegatedStakeByOwner_slot,
                _delegatedStakeByOwner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _delegatedStakeToPoolByOwner_slot,
                _delegatedStakeToPoolByOwner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _delegatedStakeByPoolId_slot,
                _delegatedStakeByPoolId_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _withdrawableStakeByOwner_slot,
                _withdrawableStakeByOwner_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                nextPoolId_slot,
                nextPoolId_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                poolJoinedByMakerAddress_slot,
                poolJoinedByMakerAddress_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                numMakersByPoolId_slot,
                numMakersByPoolId_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                currentEpoch_slot,
                currentEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                currentEpochStartTimeInSeconds_slot,
                currentEpochStartTimeInSeconds_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                protocolFeesThisEpochByPool_slot,
                protocolFeesThisEpochByPool_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                activePoolsThisEpoch_slot,
                activePoolsThisEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _cumulativeRewardsByPool_slot,
                _cumulativeRewardsByPool_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _cumulativeRewardsByPoolReferenceCounter_slot,
                _cumulativeRewardsByPoolReferenceCounter_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _cumulativeRewardsByPoolLastStored_slot,
                _cumulativeRewardsByPoolLastStored_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                validExchanges_slot,
                validExchanges_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                zrxVault_slot,
                zrxVault_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                ethVault_slot,
                ethVault_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                rewardVault_slot,
                rewardVault_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                epochDurationInSeconds_slot,
                epochDurationInSeconds_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                rewardDelegatedStakeWeight_slot,
                rewardDelegatedStakeWeight_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                minimumPoolStake_slot,
                minimumPoolStake_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                maximumMakersInPool_slot,
                maximumMakersInPool_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                cobbDouglasAlphaNumerator_slot,
                cobbDouglasAlphaNumerator_offset,
                slot,
                offset
            )
            offset := add(offset, 0x4)

            // This number will be tightly packed into the previous values storage slot since
            // they are both `uint32`. Because of this tight packing, the offset of this value
            // must be 4, since the previous value is a 4 byte number.
            assertSlotAndOffset(
                cobbDouglasAlphaDenominator_slot,
                cobbDouglasAlphaDenominator_offset,
                slot,
                offset
            )

            // This assembly function will assert that the actual values for `_slot` and `_offset` are
            // correct and will revert with a rich error if they are different than the expected values.
            function assertSlotAndOffset(
                actual_slot,
                actual_offset,
                expected_slot,
                expected_offset
            ) {
                // If expected_slot is not equal to actual_slot, revert with a rich error.
                if iszero(eq(expected_slot, actual_slot)) {
                    mstore(0x0, 0x213eb13400000000000000000000000000000000000000000000000000000000) // Rich error selector
                    mstore(0x4, 0x0)                                                                // Unexpected slot error code
                    mstore(0x24, expected_slot)                                                     // Expected slot
                    mstore(0x44, actual_slot)                                                       // Actual slot
                    revert(0x0, 0x64)
                }

                // If expected_offset is not equal to actual_offset, revert with a rich error.
                if iszero(eq(expected_offset, actual_offset)) {
                    mstore(0x0, 0x213eb13400000000000000000000000000000000000000000000000000000000) // Rich error selector
                    mstore(0x4, 0x1)                                                                // Unexpected offset error code
                    mstore(0x24, expected_offset)                                                   // Expected offset
                    mstore(0x44, actual_offset)                                                     // Actual offset
                    revert(0x0, 0x64)
                }
            }
        }
    }
}
