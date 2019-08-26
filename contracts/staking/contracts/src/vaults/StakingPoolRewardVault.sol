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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../libs/LibSafeDowncast.sol";
import "../libs/LibSafeMath96.sol";
import "../libs/LibStakingRichErrors.sol";
import "./MixinVaultCore.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
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
    MixinDeploymentConstants,
    MixinConstants,
    MixinVaultCore
{

    using LibSafeDowncast for uint256;
    using LibSafeMath for uint256;
    using LibSafeMath96 for uint96;

    // mapping from Pool to Reward Balance in ETH
    mapping (bytes32 => Balance) internal balanceByPoolId;

    /// @dev Fallback function. This contract is payable, but only by the staking contract.
    function ()
        external
        payable
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        emit RewardDeposited(UNKNOWN_STAKING_POOL_ID, msg.value);
    }

    /// @dev Deposit a reward in ETH for a specific pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function depositFor(bytes32 poolId)
        external
        payable
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        // update balance of pool
        uint256 amount = msg.value;
        Balance memory balance = balanceByPoolId[poolId];
        _incrementBalanceStruct(balance, amount);
        balanceByPoolId[poolId] = balance;

        // notify
        emit RewardDeposited(poolId, amount);
    }

    /// @dev Record a deposit for a pool. This deposit should be in the same transaction,
    /// which is enforced by the staking contract. We do not enforce it here to save (a lot of) gas.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    function recordDepositFor(bytes32 poolId, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatastrophicFailure
    {
        // update balance of pool
        Balance memory balance = balanceByPoolId[poolId];
        _incrementBalanceStruct(balance, amount);
        balanceByPoolId[poolId] = balance;
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
        if (amount > balanceByPoolId[poolId].operatorBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                balanceByPoolId[poolId].operatorBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].operatorBalance -= amount.downcastToUint96();
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
        if (amount > balanceByPoolId[poolId].membersBalance) {
            LibRichErrors.rrevert(LibStakingRichErrors.AmountExceedsBalanceOfPoolError(
                amount,
                balanceByPoolId[poolId].membersBalance
            ));
        }

        // update balance and transfer `amount` in ETH to staking contract
        balanceByPoolId[poolId].membersBalance -= amount.downcastToUint96();
        stakingContractAddress.transfer(amount);

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
        if (poolOperatorShare > 100) {
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

    /// @dev Increments a balance struct, splitting the input amount between the
    /// pool operator and members of the pool based on the pool operator's share.
    /// @param balance Balance struct to increment.
    /// @param amount256Bit Amount to add to balance.
    function _incrementBalanceStruct(Balance memory balance, uint256 amount256Bit)
        private
        pure
    {
        // balances are stored as uint96; safely downscale.
        uint96 amount = amount256Bit.downcastToUint96();

        // compute portions. One of the two must round down: the operator always receives the leftover from rounding.
        uint96 operatorPortion = amount._computePercentageCeil(balance.operatorShare);
        uint96 poolPortion = amount.safeSub(operatorPortion);

        // update balances
        balance.operatorBalance = balance.operatorBalance.safeAdd(operatorPortion);
        balance.membersBalance = balance.membersBalance.safeAdd(poolPortion);
    }
}
