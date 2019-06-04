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

import "./core/MixinStorage.sol";
import "./core/MixinStake.sol";
import "./core/MixinPools.sol";


contract Staking is
    //IStaking,
    //IStakingEvents,
    MixinStorage,
    MixinStake,
    MixinPools
{

    ///// STAKE /////

    function deposit(address owner, uint256 amount)
        external
    {
        _deposit(msg.sender, amount);
    }

    function depositAndStake(address owner, uint256 amount)
        external
    {
        _depositAndStake(msg.sender, amount);
    }

    function depositAndDelegate(address owner, bytes32 poolId, uint256 amount)
        external
    {
        _depositAndDelegate(owner, poolId, amount);
    }

    function activateStake(address owner, uint256 amount)
        external
    {
        _activateStake(msg.sender, amount);
    }

    function activateAndDelegateStake(address owner, bytes32 poolId, uint256 amount)
        external
    {
        _activateAndDelegateStake(msg.sender, poolId, amount);
    }

    function deactivateAndTimelockStake(address owner, uint256 amount)
        external
    {
        _deactivateAndTimelockStake(msg.sender, amount);
    }

    function deactivateAndTimelockDelegatedStake(address owner, bytes32 poolId, uint256 amount)
        external
    {
        _deactivateAndTimelockDelegatedStake(msg.sender, poolId, amount);
    }

    function withdraw(address owner, uint256 amount)
        external
    {
        _withdraw(msg.sender, amount);
    }

    ///// STAKE BALANCES /////

    function getTotalStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getTotalStake(owner);
    }

    function getActivatedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getActivatedStake(owner);
    }

    function getDeactivatedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getDeactivatedStake(owner);
    }

    function getWithdrawableStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getWithdrawableStake(owner);
    }

    function getTimelockedStake(address owner)
        external
        view
        returns (uint256)
    {
        return _getTimelockedStake(owner);
    }

    function getStakeDelegatedByOwner(address owner)
        external
        view
        returns (uint256)
    {
        return _getStakeDelegatedByOwner(owner);
    }

    function getStakeDelegatedToPoolByOwner(address owner, bytes32 poolId)
        internal
        view
        returns (uint256)
    {
        return _getStakeDelegatedToPoolByOwner(owner, poolId);
    }

    function getStakeDelegatedToPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return _getStakeDelegatedToPool(poolId);
    }

    ///// POOLS /////
    modifier onlyPoolOperator(bytes32 poolId) {
        require(
            msg.sender == _getPoolOperator(poolId),
            "ONLY_CALLABLE_BY_POOL_OPERATOR"
        );

        _;
    }
    
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

    ///// SETTERS /////

    function setZrxVault(address _zrxVault)
        external
    {
        zrxVault = IVault(_zrxVault);
    }
}
