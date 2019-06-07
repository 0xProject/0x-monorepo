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


contract MixinExchange is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage
{

    function _isValidExchangeAddress(address addr)
        internal
        view
        returns (bool)
    {
        return validExchanges[addr];
    }

    function _addExchangeAddress(address addr)
        internal
    {
        require(
            !validExchanges[addr],
            "EXCHANGE_ADDRESS_ALREADY_REGISTERED"
        );
        validExchanges[addr] = true;
        emit ExchangeAdded(addr);
    }

    function _removeExchangeAddress(address addr)
        internal
    {
        require(
            validExchanges[addr],
            "EXCHANGE_ADDRESS_NOT_REGISTERED"
        );
        validExchanges[addr] = false;
        emit ExchangeRemoved(addr);
    }
}