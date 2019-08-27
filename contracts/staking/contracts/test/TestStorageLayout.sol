

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

pragma solidity ^0.5.5;

import "../src/immutable/MixinStorage.sol";
import "../src/interfaces/IStructs.sol";


contract TestStorageLayout is
    MixinStorage
{
    function assertExpectedStorageLayout()
        public
        view
    {
        assembly {
            function revertIncorrectStorageSlot() {
                // Revert with `Error("INCORRECT_STORAGE_SLOT")`
                mstore(0, 0x504fe8ef00000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x00000016494e434f52524543545f53544f524147455f534c4f54000000000000)
                mstore(96, 0)
            }
            if sub(owner_slot, 0) { revertIncorrectStorageSlot() }
            if sub(stakingContract_slot, 1) { revertIncorrectStorageSlot() }
            if sub(stakeByOwner_slot, 2) { revertIncorrectStorageSlot() }
            if sub(activatedStakeByOwner_slot, 3) { revertIncorrectStorageSlot() }
            if sub(timeLockedStakeByOwner_slot, 4) { revertIncorrectStorageSlot() }
            if sub(delegatedStakeByOwner_slot, 5) { revertIncorrectStorageSlot() }
            if sub(delegatedStakeToPoolByOwner_slot, 6) { revertIncorrectStorageSlot() }
            if sub(delegatedStakeByPoolId_slot, 7) { revertIncorrectStorageSlot() }
            if sub(totalActivatedStake_slot, 8) { revertIncorrectStorageSlot() }
            if sub(nextPoolId_slot, 9) { revertIncorrectStorageSlot() }
            if sub(poolById_slot, 10) { revertIncorrectStorageSlot() }
            if sub(poolIdByMakerAddress_slot, 11) { revertIncorrectStorageSlot() }
            if sub(makerAddressesByPoolId_slot, 12) { revertIncorrectStorageSlot() }
            if sub(currentEpoch_slot, 13) { revertIncorrectStorageSlot() }
            if sub(currentEpochStartTimeInSeconds_slot, 14) { revertIncorrectStorageSlot() }
            if sub(currentTimeLockPeriod_slot, 15) { revertIncorrectStorageSlot() }
            if sub(currentTimeLockPeriodStartEpoch_slot, 16) { revertIncorrectStorageSlot() }
            if sub(protocolFeesThisEpochByPool_slot, 17) { revertIncorrectStorageSlot() }
            if sub(activePoolsThisEpoch_slot, 18) { revertIncorrectStorageSlot() }
            if sub(shadowRewardsByPoolId_slot, 19) { revertIncorrectStorageSlot() }
            if sub(shadowRewardsInPoolByOwner_slot, 20) { revertIncorrectStorageSlot() }
            if sub(validExchanges_slot, 21) { revertIncorrectStorageSlot() }
            if sub(zrxVault_slot, 22) { revertIncorrectStorageSlot() }
            if sub(rewardVault_slot, 23) { revertIncorrectStorageSlot() }
        }
    }
}