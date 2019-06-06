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

import "../interfaces/IVault.sol";
import "../libs/LibZrxToken.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinStorage.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";
import "./MixinStakeBalances.sol";
import "./MixinEpoch.sol";
import "./MixinPools.sol";


contract MixinFees is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinEpoch,
    MixinStakeBalances,
    MixinPools
{

    function _payFee(address makerAddress, uint256 amount)
        internal
    {
        bytes32 poolId = _getMakerPoolId(makerAddress);
        uint256 _feesCollectedThisEpoch = feesCollectedThisEpochByPoolId[poolId];
        feesCollectedThisEpochByPoolId[poolId] = _safeAdd(_feesCollectedThisEpoch, amount);
        if (_feesCollectedThisEpoch == 0) {
            activePoolIdsThisEpoch.append(poolId);
        }
    }

    function _payRebates()
    {
        
    }
}