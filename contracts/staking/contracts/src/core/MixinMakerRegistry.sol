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

import "./MixinStorage.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../libs/LibConstants.sol";

contract MixinMakerRegistry is
    SafeMath,
    LibConstants,
    MixinStorage
{

    constructor()
        internal
    {
        // the upper 128 bits are used for maker id
        nextMakerId = 0x0000000000000000000000000000000080000000000000000000000000000000; // LibConstants.INITIAL_MAKER_ID
    }

    function _createMakerId(address makerAddress)
        internal
        returns (bytes32 makerId)
    {
        // 
        makerId = nextMakerId;
        nextMakerId = bytes32(_safeAdd(uint256(nextMakerId), 1));

        //
        _recordMakerAddress(makerId, makerAddress);
        return makerId;
    }

    function _addMakerAddress(
        bytes32 makerId,
        address makerAddress,
        bytes memory makeSignature,
        address requestingMakerAddress
    )
        internal
    {
        require(
            _getMakerId(requestingMakerAddress) == makerId,
            "MAKER_ID_NOT_ASSOCIATED_WITH_REQUESTING_ADDRESS"
        );

        _recordMakerAddress(makerId, makerAddress);
    }

    function _removeMakerAddress(
        bytes32 makerId,
        address makerAddress,
        address requestingMakerAddress
    )
        internal
    {
        require(
            _getMakerId(requestingMakerAddress) == makerId,
            "MAKER_ID_NOT_ASSOCIATED_WITH_REQUESTING_ADDRESS"
        );

        _unrecordMakerAddress(makerId, makerAddress);
    }

    /*
    function _isValidMakerSignature(address makerAddress, bytes memory makerSignature)
        internal
        returns (bool isValid)
    {
        
    }
    */

    function _getMakerId(address makerAddress)
        internal
        view
        returns (bytes32)
    {
        return makerIds[makerAddress];
    }

    function _isMakerAddressRegistered(address makerAddress)
        internal
        view
        returns (bool)
    {
        return _getMakerId(makerAddress) != 0x0;
    }

    function _getMakerAddresses(bytes32 makerId)
        internal
        view
        returns (address[] memory _makerAddresses)
    {
        // 
        address[] storage makerAddressesPtr = makerAddresses[makerId];
        uint256 makerAddressesLength = makerAddressesPtr.length;

        // 
        _makerAddresses = new address[](makerAddressesLength);
        for(uint i = 0; i < makerAddressesLength; ++i) {
            _makerAddresses[i] = makerAddressesPtr[i];
        }

        return _makerAddresses;
    }

    function _recordMakerAddress(
        bytes32 makerId,
        address makerAddress
    )
        private
    {
        require(
            !_isMakerAddressRegistered(makerAddress),
            "MAKER_ADDRESS_ALREADY_REGISTERED"
        );

        makerIds[makerAddress] = makerId;
        makerAddresses[makerId].push(makerAddress);
    }

    function _unrecordMakerAddress(
        bytes32 makerId,
        address makerAddress
    )
        private
    {
        require(
            _getMakerId(makerAddress) == makerId,
            "MAKER_ADDRESS_ALREADY_REGISTERED"
        );

        //
        address[] storage makerAddressesPtr = makerAddresses[makerId];
        uint256 makerAddressesLength = makerAddressesPtr.length;

        // 
        uint indexOfMakerAddress = 0;
        for(; indexOfMakerAddress < makerAddressesLength; ++indexOfMakerAddress) {
            if (makerAddressesPtr[indexOfMakerAddress] == makerAddress) {
                break;
            }
        }

        //
        makerAddressesPtr[indexOfMakerAddress] = makerAddressesPtr[makerAddressesLength - 1];
        makerAddressesPtr[indexOfMakerAddress] = NIL_ADDRESS;
        makerAddressesPtr.length -= 1;

        //
        makerIds[makerAddress] = LibConstants.NIL_MAKER_ID;
    }
}