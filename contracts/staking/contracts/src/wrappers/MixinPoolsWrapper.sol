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

import "../core/MixinPools.sol";
import "../utils/Modifiers.sol";


contract MixinPoolsWrapper is
    MixinPools,
    Modifiers
{

    function getNextPoolId()
        external
        returns (bytes32 nextPoolId)
    {
        nextPoolId = _getNextPoolId();
        return nextPoolId;
    }
    
    function createPool(uint8 operatorShare)
        external
        returns (bytes32 poolId)
    {
        poolId = _createPool(msg.sender, operatorShare);
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
        _addMakerToPool(
            poolId,
            makerAddress,
            makerSignature,
            msg.sender
        );
    }

    function removeMakerFromPool(bytes32 poolId, address makerAddress)
        external
        onlyPoolOperator(poolId)
    {
        _removeMakerFromPool(
            poolId,
            makerAddress,
            msg.sender
        );
    }

    function getMakerPoolId(address makerAddress)
        external
        view
        returns (bytes32 makerId)
    {
        makerId = _getMakerPoolId(makerAddress);
        return makerId;
    }

    function getMakerAddressesForPool(bytes32 makerId)
        external
        view
        returns (address[] memory makerAddresses)
    {
        makerAddresses = _getMakerAddressesForPool(makerId);
        return makerAddresses;
    }
}
