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
import "./MixinOwnable.sol";


contract MixinExchangeManager is
    IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinOwnable
{

    /// @dev This mixin contains logic for managing exchanges.
    /// Any exchange contract that connects to the staking contract
    /// must be added here. When an exchange contract is deprecated
    /// then it should be removed.

    /// @dev Asserts that the call is coming from a valid exchange.
    modifier onlyExchange() {
        require(
            isValidExchangeAddress(msg.sender),
            "ONLY_CALLABLE_BY_EXCHANGE"
        );
        _;
    }

    /// @dev Adds a new exchange address
    /// @param addr Address of exchange contract to add
    function addExchangeAddress(address addr)
        external
        onlyOwner
    {
        require(
            !validExchanges[addr],
            "EXCHANGE_ADDRESS_ALREADY_REGISTERED"
        );
        validExchanges[addr] = true;
        emit ExchangeAdded(addr);
    }

    /// @dev Removes an existing exchange address
    /// @param addr Address of exchange contract to remove
    function removeExchangeAddress(address addr)
        external
        onlyOwner
    {
        require(
            validExchanges[addr],
            "EXCHANGE_ADDRESS_NOT_REGISTERED"
        );
        validExchanges[addr] = false;
        emit ExchangeRemoved(addr);
    }

    /// @dev Returns true iff the address is a valid exchange.
    /// @param addr Address of exchange contract.
    /// @return True iff input address is a valid exchange.
    function isValidExchangeAddress(address addr)
        public
        view
        returns (bool)
    {
        return validExchanges[addr];
    }
}