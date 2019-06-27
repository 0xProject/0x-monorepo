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

import "../libs/LibSafeMath.sol";
import "../libs/LibSafeMath96.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../immutable/MixinConstants.sol";


contract StakingPoolRewardVault is
    IStakingPoolRewardVault,
    MixinConstants,
    MixinVaultCore
{
    // @TODO -- ADD README's TO EACH DIRECTORY

    using LibSafeMath for uint256;
    using LibSafeMath96 for uint96;

    // designed in such a way that it contains minimal logic (it is not upgradeable)
    // but has all the necessary information to compute withdrawals in the event of
    // a catastrophic failure
    struct Balance {
        bool initialized;
        uint8 operatorShare;
        uint96 operatorBalance;
        uint96 poolBalance;
    }

    // mapping from Pool to Rebate Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    // solhint-disable no-empty-blocks
    function ()
        external
        payable
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {}

    // solhint-disable no-empty-blocks
    function deposit()
        external
        payable
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {}

    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        Balance memory balance = balanceByPoolId[poolId];
        _incrementBalance(balance, msg.value);
        balanceByPoolId[poolId] = balance;
    }

    function recordDepositFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        Balance memory balance = balanceByPoolId[poolId];
        _incrementBalance(balance, amount);
        balanceByPoolId[poolId] = balance;
    }

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

    function createPool(bytes32 poolId, uint8 poolOperatorShare)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        // operator share must be a valid percentage
        require(
            poolOperatorShare <= 100,
            "OPERATOR_SHARE_MUST_BE_BETWEEN_0_AND_100"
        );

        // pool must not exist
        Balance memory balance = balanceByPoolId[poolId];
        require(
            !balance.initialized,
            "POOL_ALREADY_EXISTS"
        );

        // set initial balance
        balance.initialized = true;
        balance.operatorShare = poolOperatorShare;
        balanceByPoolId[poolId] = balance;
    }

    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        Balance memory balance = balanceByPoolId[poolId];
        return balance.operatorBalance + balance.poolBalance;
    }

    function balanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].operatorBalance;
    }

    function balanceOfPool(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].poolBalance;
    }

    function _incrementBalance(Balance memory balance, uint256 amount256Bit)
        private
        pure
    {
        // balances are stored as uint96; safely downscale.
        uint96 amount = amount256Bit._downcastToUint96();

        // compute portions. One of the two must round down: the operator always receives the leftover from rounding.
        uint96 operatorPortion = amount._computePercentageCeil(balance.operatorShare);
        uint96 poolPortion = amount._sub(operatorPortion);

        // update balances
        balance.operatorBalance = balance.operatorBalance._add(operatorPortion);
        balance.poolBalance = balance.poolBalance._add(poolPortion);
    }
}
