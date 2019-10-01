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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "../src/Staking.sol";


contract TestStorageLayoutAndConstants is
    Staking
{
    using LibBytes for bytes;

    /// @dev Construction will fail if the storage layout or the deployment constants are incompatible
    ///      with the V1 staking proxy.
    constructor() public {
        _assertDeploymentConstants();
        _assertStorageLayout();
    }

    /// @dev This function will fail if the deployment constants change to the point where they
    ///      are considered "invalid".
    function _assertDeploymentConstants()
        internal
        view
    {
        require(
            address(getWethContract()) != address(0),
            "WETH_MUST_BE_SET"
        );

        require(
            address(getZrxVault()) != address(0),
            "ZRX_VAULT_MUST_BE_SET"
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

            /// Authorizable

            assertSlotAndOffset(
                authorized_slot,
                authorized_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                authorities_slot,
                authorities_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            /// MixinStorage

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
                globalStakeByStatus_slot,
                globalStakeByStatus_offset,
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
                _poolJoinedByMakerAddress_slot,
                _poolJoinedByMakerAddress_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _poolById_slot,
                _poolById_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                rewardsByPoolId_slot,
                rewardsByPoolId_offset,
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
                _cumulativeRewardsByPool_slot,
                _cumulativeRewardsByPool_offset,
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
            slot := add(slot, 0x1)
            offset := 0x0

            assertSlotAndOffset(
                totalFeesCollectedThisEpoch_slot,
                totalFeesCollectedThisEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                totalWeightedStakeThisEpoch_slot,
                totalWeightedStakeThisEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                _activePoolsByEpoch_slot,
                _activePoolsByEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                numActivePoolsThisEpoch_slot,
                numActivePoolsThisEpoch_offset,
                slot,
                offset
            )
            slot := add(slot, 0x1)

            assertSlotAndOffset(
                unfinalizedState_slot,
                unfinalizedState_offset,
                slot,
                offset
            )
            slot := add(slot, 0x5)

            assertSlotAndOffset(
                wethReservedForPoolRewards_slot,
                wethReservedForPoolRewards_offset,
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
