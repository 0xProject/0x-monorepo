/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.19;

import { IOwnable_v1 as IOwnable } from "../../../previous/Ownable/IOwnable_v1.sol";

/// @title TokenTransferProxy - Transfers tokens on behalf of contracts that have been approved via decentralized governance.
/// @author Amir Bandeali - <amir@0xProject.com>, Will Warren - <will@0xProject.com>
contract ITokenTransferProxy is IOwnable {
  
    function authorized(address addr)
        public view
        returns (bool);
    
    function authorities(uint256 index)
        public view
        returns (address);
    
    /// @dev Gets all authorized addresses.
    /// @return Array of authorized addresses.
    function getAuthorizedAddresses()
        public view
        returns (address[]);

    /// @dev Authorizes an address.
    /// @param target Address to authorize.
    function addAuthorizedAddress(address target)
        public;

    /// @dev Removes authorizion of an address.
    /// @param target Address to remove authorization from.
    function removeAuthorizedAddress(address target)
        public;

    /// @dev Calls into ERC20 Token contract, invoking transferFrom.
    /// @param token Address of token to transfer.
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param value Amount of token to transfer.
    /// @return Success of transfer.
    function transferFrom(
        address token,
        address from,
        address to,
        uint value)
        public
        returns (bool);
    
    event LogAuthorizedAddressAdded(
        address indexed target,
        address indexed caller);
    
    event LogAuthorizedAddressRemoved(
        address indexed target,
        address indexed caller);
}
