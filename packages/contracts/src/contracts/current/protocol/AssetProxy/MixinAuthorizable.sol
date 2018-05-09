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

import "./mixins/MAuthorizable.sol";
import "../../utils/Ownable/Ownable.sol";

contract MixinAuthorizable is
    Ownable,
    MAuthorizable
{

    // Revert reasons
    string constant SENDER_NOT_AUTHORIZED = "Sender not authorized to call this method.";
    string constant TARGET_NOT_AUTHORIZED = "Target address must be authorized.";
    string constant TARGET_ALREADY_AUTHORIZED = "Target must not already be authorized.";
    string constant INDEX_OUT_OF_BOUNDS = "Specified array index is out of bounds.";
    string constant INDEX_ADDRESS_MISMATCH = "Address found at index does not match target address.";

    /// @dev Only authorized addresses can invoke functions with this modifier.
    modifier onlyAuthorized {
        require(
            authorized[msg.sender],
            SENDER_NOT_AUTHORIZED
        );
        _;
    }

    mapping (address => bool) public authorized;
    address[] public authorities;

    /// @dev Authorizes an address.
    /// @param target Address to authorize.
    function addAuthorizedAddress(address target)
        external
        onlyOwner
    {
        require(
            !authorized[target],
            TARGET_ALREADY_AUTHORIZED
        );

        authorized[target] = true;
        authorities.push(target);
        emit AuthorizedAddressAdded(target, msg.sender);
    }

    /// @dev Removes authorizion of an address.
    /// @param target Address to remove authorization from.
    function removeAuthorizedAddress(address target)
        external
        onlyOwner
    {
        require(
            authorized[target],
            TARGET_NOT_AUTHORIZED
        );

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
        external
    {
        require(
            index < authorities.length,
            INDEX_OUT_OF_BOUNDS
        );
        require(
            authorities[index] == target,
            INDEX_ADDRESS_MISMATCH
        );

        delete authorized[target];
        authorities[index] = authorities[authorities.length - 1];
        authorities.length -= 1;
        emit AuthorizedAddressRemoved(target, msg.sender);
    }

    /// @dev Gets all authorized addresses.
    /// @return Array of authorized addresses.
    function getAuthorizedAddresses()
        external
        view
        returns (address[] memory)
    {
        return authorities;
    }
}
