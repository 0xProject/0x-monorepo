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

import "../libs/LibSafeMath.sol";
import "../libs/LibSafeMath96.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IEthVault.sol";
import "../immutable/MixinConstants.sol";


/// @dev This vault manages staking pool rewards.
/// Rewards can be deposited and withdraw by the staking contract.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catostrophic
/// failure mode, it cannot be returned to normal mode; this prevents
/// corruption of related state in the staking contract.
///
/// When in Catastrophic Failure Mode, the Staking contract can still
/// perform withdrawals on behalf of its users.
contract StakingPoolRewardVault is
    Authorizable,
    IStakingPoolRewardVault,
    IVaultCore,
    MixinDeploymentConstants,
    MixinConstants,
    MixinVaultCore
{

    using LibSafeMath for uint256;
    using LibSafeMath96 for uint96;

    // mapping from Pool to Reward Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    // address of ether vault
    IEthVault internal ethVault;

    /// @dev Sets the Eth Vault.
    /// Note that only the contract owner can call this.
    /// @param ethVaultAddress Address of the Eth Vault.
    function setEthVault(address ethVaultAddress)
        external
        onlyOwner
    {
        ethVault = IEthVault(ethVaultAddress);
       //  emit EthVaultChanged(erc20ProxyAddress);
    }

    /// @dev Fallback function. This contract is payable, but only by the staking contract.
    function ()
        external
        payable
        onlyStakingContract
    {
        emit RewardDeposited(UNKNOWN_STAKING_POOL_ID, msg.value);
    }

    /// @dev Record a deposit for a pool. This deposit should be in the same transaction,
    /// which is enforced by the staking contract. We do not enforce it here to save (a lot of) gas.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    /// @param operatorOnly Only attribute amount to operator.
    /// @return operatorPortion Portion of amount attributed to the operator.
    /// @return operatorPortion Portion of amount attributed to the delegators.
    function recordDepositFor(
        bytes32 poolId,
        uint256 amount,
        bool operatorOnly
    )
        external
        onlyStakingContract
        returns (
            uint256 operatorPortion,
            uint256 delegatorsPortion
        )
    {
        // update balance of pool
        Balance memory balance = balanceByPoolId[poolId];
        (operatorPortion, delegatorsPortion) = _incrementBalanceStruct(balance, amount, operatorOnly);
        balanceByPoolId[poolId] = balance;
        return (operatorPortion, delegatorsPortion);
    }

    /// @dev Withdraw some amount in ETH of an operator's reward.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function transferOperatorBalanceToEthVault(
        bytes32 poolId,
        address operator,
        uint256 amount
    )
        external
        onlyStakingContract
    {
        if (amount == 0) {
            return;
        }

        require(address(ethVault) != address(0), 'eth vault not set');

        // sanity check - sufficient balance?
        require(
            amount <= balanceByPoolId[poolId].operatorBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].operatorBalance -= amount._downcastToUint96();
        ethVault.depositFor.value(amount)(operator);

        // notify
        emit RewardWithdrawnForOperator(poolId, amount);
    }

    /// @dev Withdraw some amount in ETH of a pool member.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to transfer.
    function transferMemberBalanceToEthVault(
        bytes32 poolId,
        address member,
        uint256 amount
    )
        external
        onlyStakingContract
    {
        require(address(ethVault) != address(0), 'eth vault not set');

        // sanity check - sufficient balance?
        require(
            amount <= balanceByPoolId[poolId].membersBalance,
            "AMOUNT_EXCEEDS_BALANCE_OF_POOL"
        );

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].membersBalance -= amount._downcastToUint96();
        ethVault.depositFor.value(amount)(member);

        // notify
        emit RewardWithdrawnForMember(poolId, amount);
    }

    /// @dev Register a new staking pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param poolOperatorShare Percentage of rewards given to the pool operator.
    function registerStakingPool(bytes32 poolId, uint8 poolOperatorShare)
        external
        onlyStakingContract
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

        // notify
        emit StakingPoolRegistered(poolId, poolOperatorShare);
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

    /// @dev Increments a balance struct, splitting the input amount between the
    /// pool operator and members of the pool based on the pool operator's share.
    /// @param balance Balance struct to increment.
    /// @param amount256Bit Amount to add to balance.
    /// @param operatorOnly Only give this balance to the operator.
    /// @return portion of amount given to operator and delegators, respectively.
    function _incrementBalanceStruct(Balance memory balance, uint256 amount256Bit, bool operatorOnly)
        private
        pure
        returns (uint256, uint256)
    {
        // balances are stored as uint96; safely downscale.
        uint96 amount = amount256Bit._downcastToUint96();

        // compute portions. One of the two must round down: the operator always receives the leftover from rounding.
        uint96 operatorPortion = operatorOnly ? amount : amount._computePercentageCeil(balance.operatorShare);
        uint96 poolPortion = operatorOnly ? 0 : amount._sub(operatorPortion);

        // update balances
        balance.operatorBalance = balance.operatorBalance._add(operatorPortion);
        balance.membersBalance = balance.membersBalance._add(poolPortion);
        return (
            operatorPortion,
            poolPortion
        );
    }
}
