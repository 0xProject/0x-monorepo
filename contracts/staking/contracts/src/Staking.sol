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

    ///// STAKING /////

    function stake(uint256 amount)
        external
        returns (uint256 amountOfStakeMinted)
    {
        amountOfStakeMinted = _stake(amount);
        return amountOfStakeMinted;
    }

    function unstake(uint256 amount)
        external
        returns (uint256 amountOfStakeBurned)
    {
        amountOfStakeBurned = _unstake(amount);
        return amountOfStakeBurned;
    }

    function getStakeBalance(address owner)
        external
        view
        returns (uint256 balance)
    {
        balance = _getStakeBalance(owner);
        return balance;
    }

    function delegateStake(bytes32 makerId, uint256 amount)
        external
        returns (uint256 amountOfStakeDelegated)
    {
        amountOfStakeDelegated = _delegateStake(makerId, amount);
        return amountOfStakeDelegated;
    }

    function undelegateStake(bytes32 makerId, uint256 amount)
        external
        returns (uint256 amountOfStakeUndelegated)
    {
        amountOfStakeUndelegated = _undelegateStake(makerId, amount);
        return amountOfStakeUndelegated;
    }

    function stakeAndDelegate(bytes32 makerId, uint256 amount)
        external
        returns (uint256 amountOfStakeMintedAndDelegated)
    {
        amountOfStakeMintedAndDelegated = _stakeAndDelegate(makerId, amount);
        return amountOfStakeMintedAndDelegated;
    }

    function undelegateAndUnstake(bytes32 makerId, uint256 amount)
        external
        returns (uint256 amountOfStakeUndelegatedAndUnstaked)
    {
        
    }

    ///// STAKE BALANCES /////

    function getStakeDelegatedByOwner(address owner, bytes32 makerId)
        external
        returns (uint256 balance)
    {
        balance = _getStakeDelegatedByOwner(owner, makerId);
        return balance;
    }

    function getTotalStakeDelegatedByOwner(address owner)
        external
        returns (uint256 balance)
    {
        balance = _getTotalStakeDelegatedByOwner(owner);
        return balance;
    }

    function getTotalStakeDelegatedToMaker(bytes32 makerId)
        external
        returns (uint256 balance)
    {
        balance = _getTotalStakeDelegatedToMaker(makerId);
        return balance;
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
