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

import "../core/MixinFees.sol";
import "../utils/Modifiers.sol";


contract MixinFeesWrapper is
    MixinFees,
    Modifiers
{

    function payProtocolFee(address makerAddress)
        external
        payable
        onlyExchange
    {
        _payProtocolFee(makerAddress, msg.value);
    }

    function getProtocolFeesThisEpochByPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getProtocolFeesThisEpochByPool(poolId);
    }

    function getTotalProtocolFeesThisEpoch()
        external
        view
        returns (uint256)
    {
        return _getTotalProtocolFeesThisEpoch();
    }

    function finalizeFees()
        external
    {
        _finalizeFees();
    }
}
