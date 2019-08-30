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


/// @dev This vault manages staking pool rewards.
/// Rewards can be deposited and withdraw by the staking contract.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catostrophic
/// failure mode, it cannot be returned to normal mode; this prevents
/// corruption of related state in the staking contract.
interface IStakingPoolRewardVault {

    /// @dev Holds the balance for a staking pool.
    /// @param initialzed True iff the balance struct is initialized.
    /// @param operatorShare Percentage of the total balance owned by the operator.
    /// @param operatorBalance Balance in ETH of the operator.
    /// @param membersBalance Balance in ETH co-owned by the pool members.
    struct Balance {
        bool initialized;
        uint8 operatorShare;
        uint96 operatorBalance;
        uint96 membersBalance;
    }

    /// @dev Emitted when reward is deposited.
    /// @param poolId The pool the reward was deposited for.
    ///               Note that a poolId of "0" means "unknown" at time of deposit.
    ///               In this case, the reward would be deposited later in the transaction.
    ///               This is an optimization for the staking contract, which may make many deposits
    ///               in the same transaction.
    /// @param amount The amount in ETH deposited.
    event RewardDeposited(
        bytes32 poolId,
        uint256 amount
    );

    /// @dev Emitted when a reward is withdrawn for an operator.
    /// @param amount The amount in ETH withdrawn.
    /// @param poolId The pool the reward was deposited for.
    event RewardWithdrawnForOperator(
        bytes32 poolId,
        uint256 amount
    );

    /// @dev Emitted when a reward is withdrawn for a pool member.
    /// @param amount The amount in ETH withdrawn.
    /// @param poolId The pool the reward was deposited for.
    event RewardWithdrawnForMember(
        bytes32 poolId,
        uint256 amount
    );

    /// @dev Emitted when a staking pool is registered.
    /// @param poolId Unique Id of pool that was registered.
    /// @param operatorShare Share of rewards owned by operator.
    event StakingPoolRegistered(
        bytes32 poolId,
        uint8 operatorShare
    );

    /// @dev Fallback function.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    function ()
        external
        payable;

    function setEthVault(address ethVaultAddress)
        external;

    /// @dev Deposit a reward in ETH for a specific pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function depositFor(bytes32 poolId)
        external
        payable;

    /// @dev Record a deposit for a pool. This deposit should be in the same transaction,
    /// which is enforced by the staking contract. We do not enforce it here to save (a lot of) gas.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param amount Amount in ETH to record.
    function recordDepositFor(bytes32 poolId, uint256 amount)
        external;

    /// @dev Withdraw some amount in ETH of an operator's reward.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    function transferOperatorBalanceToEthVault(
        bytes32 poolId,
        address operator,
        uint256 amount
    )
        external;

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
        external;

    /// @dev Register a new staking pool.
    /// Note that this is only callable by the staking contract, and when
    /// not in catastrophic failure mode.
    /// @param poolId Unique Id of pool.
    /// @param poolOperatorShare Percentage of rewards given to the pool operator.
    function registerStakingPool(bytes32 poolId, uint8 poolOperatorShare)
        external;

    /// @dev Returns the total balance of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256);

    /// @dev Returns the balance of a pool operator.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfOperator(bytes32 poolId)
        external
        view
        returns (uint256);

    /// @dev Returns the balance co-owned by members of a pool.
    /// @param poolId Unique Id of pool.
    /// @return Balance in ETH.
    function balanceOfMembers(bytes32 poolId)
        external
        view
        returns (uint256);
}
