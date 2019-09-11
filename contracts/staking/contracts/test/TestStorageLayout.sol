

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

import "../src/immutable/MixinStorage.sol";
import "../src/interfaces/IStructs.sol";


contract TestStorageLayout is
    MixinConstants,
    Ownable,
    MixinStorage
{

    function assertExpectedStorageLayout()
        public
        pure
    {
        assembly {
            function revertIncorrectStorageSlot() {
                // Revert with `Error("INCORRECT_STORAGE_SLOT")`
                mstore(0, 0x504fe8ef00000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x00000016494e434f52524543545f53544f524147455f534c4f54000000000000)
                mstore(96, 0)
            }

            // The staking contract writes to state that's stored in the staking proxy contract; hence,
            // we require that slots do not change across upgrades to the staking contract. We expect
            // storage slots to match the ordering in MixinStorage.sol.

            let slot := 0

            if sub(owner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(stakingContract_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(activeStakeByOwner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(inactiveStakeByOwner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(delegatedStakeByOwner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(delegatedStakeToPoolByOwner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(delegatedStakeByPoolId_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(withdrawableStakeByOwner_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(nextPoolId_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(poolJoinedByMakerAddress_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(numMakersByPoolId_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(currentEpoch_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(currentEpochStartTimeInSeconds_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(protocolFeesThisEpochByPool_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(activePoolsThisEpoch_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(cumulativeRewardsByPool_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(cumulativeRewardsByPoolLastStored_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(validExchanges_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(zrxVault_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(rewardVault_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(epochDurationInSeconds_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(rewardDelegatedStakeWeight_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(minimumPoolStake_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(maximumMakersInPool_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(cobbDouglasAlphaNumerator_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)

            if sub(cobbDouglasAlphaDenomintor_slot, slot) { revertIncorrectStorageSlot() }
            slot := add(slot, 1)
        }
    }
}
