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
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../immutable/MixinConstants.sol";


contract StakingPoolRewardVault is
    Authorizable,
    IStakingPoolRewardVault,
    MixinDeploymentConstants,
    MixinConstants,
    MixinVaultCore
{

    using LibSafeMath for uint256;

    /// @dev This vault manages staking pool rewards.
    /// Rewards can be deposited and withdraw by the staking contract.
    /// There is a "Catastrophic Failure Mode" that, when invoked, only
    /// allows withdrawals to be made. Once this vault is in catostrophic
    /// failure mode, it cannot be returned to normal mode; this prevents
    /// corruption of related state in the staking contract.
    ///
    /// When in Catastrophic Failure Mode, the Staking contract can still
    /// perform withdrawals on behalf of its users.

    // mapping from Pool to Reward Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    /// @dev Fallback function. This contract is payable, but only by the staking contract.
    function ()
        external
        payable
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        emit RewardDeposited(UNKNOWN_STAKING_POOL_ID, msg.value);
    }

    /// @dev Deposit a reward in ETH for a specific pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param operatorReward Share of the reward to credit the pool operator.
    /// @param membersReward Share of the reward to credit the pool members.
    function depositFor(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward
    )
        external
        payable
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        uint256 totalReward = operatorReward._add(membersReward);

        require(
            msg.value == totalReward,
            "INVALID_REWARD_DEPOSIT"
        );

        recordDepositFor(poolId, operatorReward, membersReward);
    }

    /// @dev Withdraw some amount in ETH of an operator's reward.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    function withdrawForOperator(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        // sanity check - sufficient balance?
        require(
            amount <= balanceByPoolId[poolId].operatorBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].operatorBalance -= amount;
        stakingContractAddress.transfer(amount);

        // notify
        emit RewardWithdrawnForOperator(poolId, amount);
    }

    /// @dev Withdraw some amount in ETH of a pool member.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    function withdrawForMember(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
    {
        // sanity check - sufficient balance?
        require(
            amount <= balanceByPoolId[poolId].membersBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].membersBalance -= amount;
        stakingContractAddress.transfer(amount);

        // notify
        emit RewardWithdrawnForMember(poolId, amount);
    }

    /// @dev Register a new staking pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function registerStakingPool(bytes32 poolId)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        // pool must not exist
        Balance memory balance = balanceByPoolId[poolId];
        require(
            !balance.initialized,
            "POOL_ALREADY_EXISTS"
        );

        // set initial balance
        balance.initialized = true;
        balanceByPoolId[poolId] = balance;

        // notify
        emit StakingPoolRegistered(poolId);
    }

    /// @dev Returns the total balance of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        Balance memory balance = balanceByPoolId[poolId];
        return balance.operatorBalance + balance.membersBalance;
    }

    /// @dev Returns the balance of a pool operator.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].operatorBalance;
    }

    /// @dev Returns the balance co-owned by members of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfMembers(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].membersBalance;
    }

    /// @dev Record a deposit for a pool, without actually depositing ether.
    ///      It is the responsibility of the staking contract to actually transfer
    ///      `operatorReward` + `membersReward` ether to this contract.
    ///      Note that this is only callable by the staking contract, and when
    ///      not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param operatorReward Share of the reward to credit the pool operator.
    /// @param membersReward Share of the reward to credit the pool members.
    function recordDepositFor(
        bytes32 poolId,
        uint256 operatorReward,
        uint256 membersReward
    )
        public
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        Balance memory balance = balanceByPoolId[poolId];
        balance.operatorBalance = balance.operatorBalance._add(operatorReward);
        balance.membersBalance = balance.membersBalance._add(membersReward);
        balanceByPoolId[poolId] = balance;

        emit RewardDeposited(poolId, operatorReward._add(membersReward));
    }
}
