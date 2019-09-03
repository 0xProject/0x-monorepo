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

import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibStakingRichErrors.sol";
import "../libs/LibSafeDowncast.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../interfaces/IEthVault.sol";
import "../immutable/MixinConstants.sol";


/// @dev This vault manages staking pool rewards.
/// Rewards can be deposited and withdraw by the staking contract.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catastrophic
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
    using LibSafeDowncast for uint256;

    // mapping from Pool to Reward Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    // address of ether vault
    IEthVault internal ethVault;

    /// @dev Fallback function. This contract is payable, but only by the staking contract.
    function ()
        external
        payable
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        emit RewardDeposited(UNKNOWN_STAKING_POOL_ID, msg.value);
    }

    /// @dev Sets the Eth Vault.
    /// Note that only the contract owner can call this.
    /// @param ethVaultAddress Address of the Eth Vault.
    function setEthVault(address ethVaultAddress)
        external
        onlyOwner
    {
        ethVault = IEthVault(ethVaultAddress);
        emit EthVaultChanged(ethVaultAddress);
    }

    /// @dev Record a deposit for a pool. This deposit should be in the same transaction,
    /// which is enforced by the staking contract. We do not enforce it here to save (a lot of) gas.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    /// @param operatorOnly Only attribute amount to operator.
    /// @return operatorPortion Portion of amount attributed to the operator.
    /// @return poolPortion Portion of amount attributed to the pool.
    function recordDepositFor(
        bytes32 poolId,
        uint256 amount,
        bool operatorOnly
    )
        external
        onlyStakingContract
        returns (
            uint256 operatorPortion,
            uint256 poolPortion
        )
    {
        // update balance of pool
        Balance memory balance = balanceByPoolId[poolId];
        (operatorPortion, poolPortion) = _incrementBalanceStruct(balance, amount, operatorOnly);
        balanceByPoolId[poolId] = balance;
        return (operatorPortion, poolPortion);
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

        // sanity check on eth vault
        require(
            address(ethVault) != address(0),
            "ETH_VAULT_NOT_SET"
        );

        // sanity check - sufficient balance?
        uint256 operatorBalance = uint256(balanceByPoolId[poolId].operatorBalance);
        if (amount > operatorBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                balanceByPoolId[poolId].operatorBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].operatorBalance = operatorBalance.safeSub(amount).downcastToUint96();
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
        // sanity check on eth vault
        require(
            address(ethVault) != address(0),
            "ETH_VAULT_NOT_SET"
        );

        // sanity check - sufficient balance?
        uint256 membersBalance = uint256(balanceByPoolId[poolId].membersBalance);
        if (amount > membersBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                balanceByPoolId[poolId].membersBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].membersBalance = membersBalance.safeSub(amount).downcastToUint96();
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
        onlyNotInCatastrophicFailure
    {
        // operator share must be a valid percentage
        if (poolOperatorShare > PERCENTAGE_DENOMINATOR) {
            LibRichErrors.rrevert(LibStakingRichErrors.OperatorShareMustBeBetween0And100Error(
                poolId,
                poolOperatorShare
            ));
        }

        // pool must not exist
        Balance memory balance = balanceByPoolId[poolId];
        if (balance.initialized) {
            LibRichErrors.rrevert(LibStakingRichErrors.PoolAlreadyExistsError(
                poolId
            ));
        }

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

    /// @dev Returns the operator share of a pool's balance.
    /// @param poolId Unique Id of pool.
    /// @return Operator share (integer out of 100)
    function getOperatorShare(bytes32 poolId)
        external
        view
        returns (uint256)
    {
        return balanceByPoolId[poolId].operatorShare;
    }

    /// @dev Increments a balance struct, splitting the input amount between the
    /// pool operator and members of the pool based on the pool operator's share.
    /// @param balance Balance struct to increment.
    /// @param amount Amount to add to balance.
    /// @param operatorOnly Only give this balance to the operator.
    /// @return portion of amount given to operator and delegators, respectively.
    function _incrementBalanceStruct(Balance memory balance, uint256 amount, bool operatorOnly)
        private
        pure
        returns (uint256 operatorPortion, uint256 poolPortion)
    {
        // compute portions. One of the two must round down: the operator always receives the leftover from rounding.
        operatorPortion = operatorOnly
            ? amount
            : LibMath.getPartialAmountCeil(
                uint256(balance.operatorShare),  // Operator share out of 100
                PERCENTAGE_DENOMINATOR,
                amount
            );

        poolPortion = amount.safeSub(operatorPortion);

        // compute new balances
        uint256 newOperatorBalance = uint256(balance.operatorBalance).safeAdd(operatorPortion);
        uint256 newMembersBalance = uint256(balance.membersBalance).safeAdd(poolPortion);

        // save new balances
        balance.operatorBalance = LibSafeDowncast.downcastToUint96(newOperatorBalance);
        balance.membersBalance = LibSafeDowncast.downcastToUint96(newMembersBalance);

        return (
            operatorPortion,
            poolPortion
        );
    }
}
