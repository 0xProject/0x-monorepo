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
    struct Balance {
        uint8 operatorShare;
        uint96 operatorBalance;
        uint96 poolBalance;
    }

    // mapping from Pool to Rebate Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    // mapping from operator to pool id
    mapping (bytes32 => address payable) internal operatorByPoolId;

    constructor()
        public
    {}

    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
    {
        Balance memory balance = balanceByPoolId[poolId];
        incrementBalance(balance, msg.value);
        balanceByPoolId[poolId] = balance;
    }

    function recordDepositFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        Balance memory balance = balanceByPoolId[poolId];
        incrementBalance(balance, amount);
        balanceByPoolId[poolId] = balance;
    }

    function incrementBalance(Balance memory balance, uint256 amount) internal pure {
        require(
            amount <= (2**96 - 1),
            "AMOUNT_TOO_HIGH"
        );
        require(
            amount * balance.operatorShare <= (2**96 - 1),
            "AMOUNT_TOO_HIGH"
        );

        // round down the pool portion
        uint96 poolPortion = (uint96(amount) * (uint96(100) - balance.operatorShare)) / uint96(100);
        uint96 operatorPortion = uint96(amount) - poolPortion;

        // return updated state
        // @TODO UINT96 SAfeMath
        balance.operatorBalance += operatorPortion;
        balance.poolBalance += poolPortion;
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

    function withdrawFromOperator(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        require(
            amount <= balanceByPoolId[poolId].operatorBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );
        balanceByPoolId[poolId].operatorBalance -= uint96(amount);
        stakingContractAddress.transfer(amount);
    }

    function withdrawFromPool(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        require(
            amount <= balanceByPoolId[poolId].poolBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );
        balanceByPoolId[poolId].poolBalance -= uint96(amount);
        stakingContractAddress.transfer(amount);
    }

/*
    function withdrawAllFrom(bytes32 poolId)
        external
        onlyInCatostrophicFailure
        returns (uint256)
    {
        address payable operator = operatorByPoolId[poolId];
        require(
            operator != NIL_ADDRESS,
            "INVALID_OWNER"
        );
        uint256 balanceInPool = balanceByPoolId[poolId];
        require(
            balanceInPool > 0,
            "POOL_BALANCE_IS_ZERO"
        );

        balanceByPoolId[poolId] = 0;
        operator.transfer(balanceByPoolId[poolId]);
    }
    */

    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        Balance memory balance = balanceByPoolId[poolId];
        return balance.operatorBalance + balance.poolBalance;
    }

    function operatorBalanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].operatorBalance;
    }

    function poolBalanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].poolBalance;
    }

    // It costs 1 wei to create a pool, but we don't enforce it here.
    // it's enforced in the staking contract
    function createPool(bytes32 poolId, address payable poolOperator, uint8 poolOperatorShare)
        external
        onlyStakingContract
    {
        require(
            operatorByPoolId[poolId] == NIL_ADDRESS,
            "POOL_ALREADY_EXISTS"
        );
        require(
            poolOperatorShare <= 100,
            "OPERATOR_SHARE_MUST_BE_BETWEEN_0_AND_100"
        );
        balanceByPoolId[poolId].operatorShare = poolOperatorShare;
        operatorByPoolId[poolId] = poolOperator;
    }

    function getPoolOperator(bytes32 poolId)
        external
        view
        returns (address)
    {
        return operatorByPoolId[poolId];
    }
}
