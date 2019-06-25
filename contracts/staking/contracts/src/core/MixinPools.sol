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
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "../libs/LibSignatureValidator.sol";
import "../libs/LibEIP712Hash.sol";

import "../interfaces/IStructs.sol";
import "../interfaces/IStakingEvents.sol";

import "../immutable/MixinConstants.sol";
import "../immutable/MixinStorage.sol";

import "./MixinRewardVault.sol";


contract MixinPools is
    // libraries
    SafeMath,
    // interfaces
    IStakingEvents,
    // immutables
    MixinConstants,
    MixinStorage,
    // standalone
    MixinRewardVault
{

     modifier onlyPoolOperator(bytes32 poolId) {
        require(
            msg.sender == getPoolOperator(poolId),
            "ONLY_CALLABLE_BY_POOL_OPERATOR"
        );

        _;
    }

    function createPool(uint8 operatorShare)
        external
        returns (bytes32 poolId)
    {
        address payable operatorAddress = msg.sender;
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
        _createPoolInRewardVault(poolId, operatorShare);

        // 
        emit PoolCreated(poolId, operatorAddress, operatorShare);
        return poolId;
    }

    function addMakerToPool(
        bytes32 poolId,
        address makerAddress,
        bytes calldata makerSignature
    )
        external
        onlyPoolOperator(poolId)
    {
        require(
            isValidMakerSignature(poolId, makerAddress, makerSignature),
            "INVALID_MAKER_SIGNATURE"
        );

        _recordMaker(poolId, makerAddress);
    }

    function removeMakerFromPool(
        bytes32 poolId,
        address makerAddress
    )
        external
        onlyPoolOperator(poolId)
    {
        _unrecordMaker(poolId, makerAddress);
    }

    function getNextPoolId()
        public
        returns (bytes32)
    {
        return nextPoolId;
    }

    function isValidMakerSignature(bytes32 poolId, address makerAddress, bytes memory makerSignature)
        public
        view
        returns (bool isValid)
    {
        bytes32 approvalHash = getStakingPoolApprovalMessageHash(poolId, makerAddress);
        isValid = LibSignatureValidator._isValidSignature(approvalHash, makerAddress, makerSignature);
        return isValid;
    }

    function getStakingPoolApprovalMessageHash(bytes32 poolId, address makerAddress)
        public
        view
        returns (bytes32 approvalHash)
    {
        StakingPoolApproval memory approval = StakingPoolApproval({
            poolId: poolId,
            makerAddress: makerAddress
        });

        // Hash approval message and check signer address
        address verifierAddress = address(this);
        approvalHash = LibEIP712Hash._hashStakingPoolApprovalMessage(approval, CHAIN_ID, verifierAddress);

        return approvalHash;
    }

    function getMakerPoolId(address makerAddress)
        public
        view
        returns (bytes32)
    {
        return poolIdByMakerAddress[makerAddress];
    }

    function getPoolOperator(bytes32 poolId)
        public
        view
        returns (address operatorAddress)
    {
        operatorAddress = poolById[poolId].operatorAddress;
    }

    function isMakerRegistered(address makerAddress)
        public
        view
        returns (bool)
    {
        return getMakerPoolId(makerAddress) != NIL_MAKER_ID;
    }

    function getMakerAddressesForPool(bytes32 poolId)
        public
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

    function _getPool(bytes32 poolId)
        internal
        view
        returns (Pool memory pool)
    {
        pool = poolById[poolId];
        return pool;
    }

    function _recordMaker(
        bytes32 poolId,
        address makerAddress
    )
        private
    {
        require(
            !isMakerRegistered(makerAddress),
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
            getMakerPoolId(makerAddress) == poolId,
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