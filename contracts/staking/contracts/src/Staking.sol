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

pragma solidity ^0.5.9;

import "./core/MixinConstants.sol";
import "./core/MixinStorage.sol";
import "./core/MixinStake.sol";
import "./core/MixinPools.sol";
import "./core/MixinEpoch.sol";


contract Staking is
    //IStaking,
    //IStakingEvents,
    MixinConstants,
    MixinStorage,
    MixinEpoch,
    MixinStake,
    MixinPools
{

    ///// STAKE /////

    function deposit(uint256 amount)
        external
    {
        _deposit(msg.sender, amount);
    }

    function depositAndStake(uint256 amount)
        external
    {
        _depositAndStake(msg.sender, amount);
    }

    function depositAndDelegate(bytes32 poolId, uint256 amount)
        external
    {
        _depositAndDelegate(msg.sender, poolId, amount);
    }

    function activateStake(uint256 amount)
        external
    {
        _activateStake(msg.sender, amount);
    }

    function activateAndDelegateStake(bytes32 poolId, uint256 amount)
        external
    {
        _activateAndDelegateStake(msg.sender, poolId, amount);
    }

    function deactivateAndTimelockStake(uint256 amount)
        external
    {
        _deactivateAndTimelockStake(msg.sender, amount);
    }

    function deactivateAndTimelockDelegatedStake(bytes32 poolId, uint256 amount)
        external
    {
        _deactivateAndTimelockDelegatedStake(msg.sender, poolId, amount);
    }

    function withdraw(uint256 amount)
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
        external
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

    ///// EPOCHS /////

    // @TODO - MixinAuthorizable
    function goToNextEpoch()
        external
    {
        _goToNextEpoch();
    }

    function getEpochPeriodInSeconds()
        external
        view
        returns (uint64)
    {
        return _getEpochPeriodInSeconds();
    }

    function getTimelockPeriodInEpochs()
        external
        view
        returns (uint64)
    {
        return _getTimelockPeriodInEpochs();
    }

    function getCurrentEpochStartTimeInSeconds()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpochStartTimeInSeconds();
    }

    function getCurrentTimelockPeriodStartEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriodStartEpoch();
    }

    function getCurrentEpochEndTimeInSeconds()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpochEndTimeInSeconds();
    }

    function getCurrentTimelockPeriodEndEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriodEndEpoch();
    }

    function getCurrentEpoch()
        external
        view
        returns (uint64)
    {
        return _getCurrentEpoch();
    }

    function getCurrentTimelockPeriod()
        external
        view
        returns (uint64)
    {
        return _getCurrentTimelockPeriod();
    }

    ///// SETTERS /////

    function setZrxVault(address _zrxVault)
        external
    {
        zrxVault = IVault(_zrxVault);
    }
}
