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

import "../interfaces/IVault.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IRewardVault.sol";
import "../immutable/MixinConstants.sol";


contract RewardVault is
    IRewardVault,
    SafeMath,
    MixinConstants,
    MixinVaultCore
{

    // designed in such a way that it contains minimal logic (it is not upgradeable)
    // but has all the necessary information to compute withdrawals in the event of
    // a catastrophic failure

    // uint256 constant NIL_BALANCE = 

    // mapping from Pool to Rebate Balance in ETH
    mapping (bytes32 => uint256) internal balanceByPoolId;

    // mapping from owner to pool id
    mapping (bytes32 => address payable) internal ownerByPoolId;

    constructor()
        public
    {}

    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
    {
        balanceByPoolId[poolId] = _safeAdd(balanceByPoolId[poolId], msg.value);
    }

    function recordDepositFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        balanceByPoolId[poolId] = _safeAdd(balanceByPoolId[poolId], amount);
    }

    function deposit()
        external
        payable
        onlyStakingContract
    {}

    function ()
        external
        payable
        onlyStakingContract
    {}

    function withdrawFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        require(
            amount <= balanceByPoolId[poolId],
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );
        balanceByPoolId[poolId] = _safeSub(balanceByPoolId[poolId], amount);
        stakingContractAddress.transfer(amount);
    }

    function withdrawAllFrom(bytes32 poolId)
        external
        onlyInCatostrophicFailure
        returns (uint256)
    {
        address payable owner = ownerByPoolId[poolId];
        require(
            owner != NIL_ADDRESS,
            "INVALID_OWNER"
        );
        uint256 balanceInPool = balanceByPoolId[poolId];
        require(
            balanceInPool > 0,
            "POOL_BALANCE_IS_ZERO"
        );

        balanceByPoolId[poolId] = 0;
        owner.transfer(balanceByPoolId[poolId]);
    }

    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId];
    }

    // It costs 1 wei to create a pool, but we don't enforce it here.
    // it's enforced in the staking contract
    function createPool(bytes32 poolId, address payable poolOwner)
        external
        payable
        onlyStakingContract
    {
        require(
            ownerByPoolId[poolId] == NIL_ADDRESS,
            "POOL_ALREADY_EXISTS"
        );
        balanceByPoolId[poolId] = msg.value;
        ownerByPoolId[poolId] = poolOwner;
    }

    function getPoolOwner(bytes32 poolId)
        external
        view
        returns (address)
    {
        return ownerByPoolId[poolId];
    }
}
