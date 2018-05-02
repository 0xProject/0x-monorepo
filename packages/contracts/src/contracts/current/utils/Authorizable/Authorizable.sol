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

pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "./IAuthorizable.sol";
import "../Ownable/Ownable.sol";

contract Authorizable is
    Ownable,
    IAuthorizable
{

    /// @dev Only authorized addresses can invoke functions with this modifier.
    modifier onlyAuthorized {
        require(
            authorized[msg.sender],
            "Sender not authorized to call this method."
        );
        _;
    }

    modifier targetAuthorized(address target) {
        require(
            authorized[target],
            "Target address not authorized to call this method."
        );
        _;
    }

    modifier targetNotAuthorized(address target) {
        require(
            !authorized[target],
            "Target must not already be authorized to call this method."
        );
        _;
    }

    mapping (address => bool) public authorized;
    address[] public authorities;

    /*
     * Public functions
     */

    /// @dev Authorizes an address.
    /// @param target Address to authorize.
    function addAuthorizedAddress(address target)
        public
        onlyOwner
        targetNotAuthorized(target)
    {
        authorized[target] = true;
        authorities.push(target);
        emit AuthorizedAddressAdded(target, msg.sender);
    }

    /// @dev Removes authorizion of an address.
    /// @param target Address to remove authorization from.
    function removeAuthorizedAddress(address target)
        public
        onlyOwner
        targetAuthorized(target)
    {
        delete authorized[target];
        for (uint i = 0; i < authorities.length; i++) {
            if (authorities[i] == target) {
                authorities[i] = authorities[authorities.length - 1];
                authorities.length -= 1;
                break;
            }
        }
        emit AuthorizedAddressRemoved(target, msg.sender);
    }

    /// @dev Removes authorizion of an address.
    /// @param target Address to remove authorization from.
    /// @param index Index of target in authorities array.
    function removeAuthorizedAddressAtIndex(address target, uint256 index)
        public
    {
        require(
            index < authorities.length,
            "Specified index is out of bounds."
        );
        require(
            authorities[index] == target,
            "Address found at index does not match target address."
        );
        delete authorized[target];
        authorities[index] = authorities[authorities.length - 1];
        authorities.length -= 1;
        emit AuthorizedAddressRemoved(target, msg.sender);
    }

    /*
     * Public constant functions
     */

    /// @dev Gets all authorized addresses.
    /// @return Array of authorized addresses.
    function getAuthorizedAddresses()
        public view
        returns (address[] memory)
    {
        return authorities;
    }
}
