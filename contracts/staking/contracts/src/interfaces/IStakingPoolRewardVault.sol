/*

  Copyright 2019 ZeroEx Intl.

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
pragma experimental ABIEncoderV2;


/// @dev This vault manages staking pool rewards.
interface IStakingPoolRewardVault {

    /// @dev Emitted when Eth is deposited into the vault.
    /// @param sender Address of sender (`msg.sender`).
    /// @param poolId that owns of Eth.
    /// @param amount of Eth deposited.
    event EthDepositedIntoVault(
        address indexed sender,
        bytes32 indexed poolId,
        uint256 amount
    );

    /// @dev Emitted when a reward is transferred to the ETH vault.
    /// @param amount The amount in ETH withdrawn.
    /// @param member of the pool.
    /// @param poolId The pool the reward was deposited for.
    event PoolRewardTransferredToEthVault(
        bytes32 indexed poolId,
        address indexed member,
        uint256 amount
    );

    /// @dev Deposit an amount of ETH (`msg.value`) for `poolId` into the vault.
    /// Note that this is only callable by the staking contract.
    /// @param poolId that owns the ETH.
    function depositFor(bytes32 poolId)
        external
        payable;

    /// @dev Withdraw some amount in ETH of a pool member.
    /// Note that this is only callable by the staking contract.
    /// @param poolId Unique Id of pool.
    /// @param member of pool to transfer funds to.
    /// @param amount Amount in ETH to transfer.
    /// @param ethVaultAddress address of Eth Vault to send rewards to.
    function transferToEthVault(
        bytes32 poolId,
        address member,
        uint256 amount,
        address ethVaultAddress
    )
        external;

    /// @dev Returns the balance in ETH of `poolId`
    /// @return Balance in ETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256);
}
