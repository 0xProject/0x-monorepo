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

import "../interfaces/IStakingEvents.sol";

import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";


contract MixinExchange is
    // interfaces
    IStakingEvents,
    // immutables
    MixinConstants,
    MixinStorage
{

    modifier onlyExchange() {
        require(
            isValidExchangeAddress(msg.sender),
            "ONLY_CALLABLE_BY_EXCHANGE"
        );
        _;
    }

    function addExchangeAddress(address addr)
        external
        // @TODO - Only by 0x multi-sig
    {
        require(
            !validExchanges[addr],
            "EXCHANGE_ADDRESS_ALREADY_REGISTERED"
        );
        validExchanges[addr] = true;
        emit ExchangeAdded(addr);
    }

    function removeExchangeAddress(address addr)
        external
        // @TODO - Only by 0x multi-sig
    {
        require(
            validExchanges[addr],
            "EXCHANGE_ADDRESS_NOT_REGISTERED"
        );
        validExchanges[addr] = false;
        emit ExchangeRemoved(addr);
    }

    function isValidExchangeAddress(address addr)
        public
        view
        returns (bool)
    {
        return validExchanges[addr];
    }
}