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

import "../immutable/MixinStorage.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../immutable/MixinConstants.sol";
import "../interfaces/IStakingEvents.sol";

contract MixinPools is
    SafeMath,
    IStakingEvents,
    MixinConstants,
    MixinStorage
{

    function _getNextPoolId()
        internal
        returns (bytes32)
    {
        return nextPoolId;
    }

    function _createPool(address payable operatorAddress, uint8 operatorShare)
        internal
        returns (bytes32 poolId)
    {
        // validate input
        require(
            operatorShare <= 100,
            "OPERATOR_SHARE_MUST_BE_A_PERCENTAGE_BETWEEN_0_AND_100"
        );

        // 
        poolId = nextPoolId;
        nextPoolId = bytes32(_safeAdd(uint256(nextPoolId >> 128), 1) << 128);

        // 
        Pool memory pool = Pool({
            operatorAddress: operatorAddress,
            operatorShare: operatorShare
        });
        poolById[poolId] = pool;

        // create pool in reward vault
        rewardVault.createPool(
            poolId,
            operatorAddress,
            operatorShare
        );

        // 
        emit PoolCreated(poolId, operatorAddress, operatorShare);
        return poolId;
    }

    function _addMakerToPool(
        bytes32 poolId,
        address makerAddress,
        bytes memory makeSignature,
        address operatorAddress
    )
        internal
    {
        require(
            _getPoolOperator(poolId) == operatorAddress,
            "BAD_POOL_OPERATOR"
        );

        _recordMaker(poolId, makerAddress);
    }

    function _removeMakerFromPool(
        bytes32 poolId,
        address makerAddress,
        address operatorAddress
    )
        internal
    {
        require(
            _getPoolOperator(poolId) == operatorAddress,
            "BAD_POOL_OPERATOR"
        );

        _unrecordMaker(poolId, makerAddress);
    }

    /*
    function _isValidMakerSignature(address makerAddress, bytes memory makerSignature)
        internal
        returns (bool isValid)
    {

    }
    */

    function _getMakerPoolId(address makerAddress)
        internal
        view
        returns (bytes32)
    {
        return poolIdByMakerAddress[makerAddress];
    }

    function _getPoolOperator(bytes32 poolId)
        internal
        view
        returns (address operatorAddress)
    {
        operatorAddress = poolById[poolId].operatorAddress;
    }

    function _getPool(bytes32 poolId)
        internal
        view
        returns (Pool memory pool)
    {
        pool = poolById[poolId];
        return pool;
    }

    function _isMakerRegistered(address makerAddress)
        internal
        view
        returns (bool)
    {
        return _getMakerPoolId(makerAddress) != NIL_MAKER_ID;
    }

    function _getMakerAddressesForPool(bytes32 poolId)
        internal
        view
        returns (address[] memory _makerAddressesByPoolId)
    {
        // 
        address[] storage makerAddressesByPoolIdPtr = makerAddressesByPoolId[poolId];
        uint256 makerAddressesByPoolIdLength = makerAddressesByPoolIdPtr.length;

        // 
        _makerAddressesByPoolId = new address[](makerAddressesByPoolIdLength);
        for(uint i = 0; i < makerAddressesByPoolIdLength; ++i) {
            _makerAddressesByPoolId[i] = makerAddressesByPoolIdPtr[i];
        }

        return _makerAddressesByPoolId;
    }

    /*
    function _recordPoolOperator(bytes32 poolId, address operatorAddress)
        private
    {
        poolById[poolId] = 
    }*/

    function _recordMaker(
        bytes32 poolId,
        address makerAddress
    )
        private
    {
        require(
            !_isMakerRegistered(makerAddress),
            "MAKER_ADDRESS_ALREADY_REGISTERED"
        );

        poolIdByMakerAddress[makerAddress] = poolId;
        makerAddressesByPoolId[poolId].push(makerAddress);
    }

    function _unrecordMaker(
        bytes32 poolId,
        address makerAddress
    )
        private
    {
        require(
            _getMakerPoolId(makerAddress) == poolId,
            "MAKER_ADDRESS_ALREADY_REGISTERED"
        );

        //
        address[] storage makerAddressesByPoolIdPtr = makerAddressesByPoolId[poolId];
        uint256 makerAddressesByPoolIdLength = makerAddressesByPoolIdPtr.length;

        // 
        uint indexOfMakerAddress = 0;
        for(; indexOfMakerAddress < makerAddressesByPoolIdLength; ++indexOfMakerAddress) {
            if (makerAddressesByPoolIdPtr[indexOfMakerAddress] == makerAddress) {
                break;
            }
        }

        //
        makerAddressesByPoolIdPtr[indexOfMakerAddress] = makerAddressesByPoolIdPtr[makerAddressesByPoolIdLength - 1];
        makerAddressesByPoolIdPtr[indexOfMakerAddress] = NIL_ADDRESS;
        makerAddressesByPoolIdPtr.length -= 1;

        //
        poolIdByMakerAddress[makerAddress] = NIL_MAKER_ID;
    }
}