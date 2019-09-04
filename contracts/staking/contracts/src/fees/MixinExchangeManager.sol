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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "../libs/LibStakingRichErrors.sol";
import "../interfaces/IStakingEvents.sol";
import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";


/// @dev This mixin contains logic for managing exchanges.
/// Any exchange contract that connects to the staking contract
/// must be added here. When an exchange contract is deprecated
/// then it should be removed.
contract MixinExchangeManager is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage
{
    /// @dev Asserts that the call is coming from a valid exchange.
    modifier onlyExchange() {
        if (!isValidExchangeAddress(msg.sender)) {
            LibRichErrors.rrevert(LibStakingRichErrors.OnlyCallableByExchangeError(
                msg.sender
            ));
        }
        _;
    }

    /// @dev Adds a new exchange address
    /// @param addr Address of exchange contract to add
    function addExchangeAddress(address addr)
        external
        onlyOwner
    {
        if (validExchanges[addr]) {
            LibRichErrors.rrevert(LibStakingRichErrors.ExchangeAddressAlreadyRegisteredError(
                addr
            ));
        }
        validExchanges[addr] = true;
        emit ExchangeAdded(addr);
    }

    /// @dev Removes an existing exchange address
    /// @param addr Address of exchange contract to remove
    function removeExchangeAddress(address addr)
        external
        onlyOwner
    {
        if (!validExchanges[addr]) {
            LibRichErrors.rrevert(LibStakingRichErrors.ExchangeAddressNotRegisteredError(
                addr
            ));
        }
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
