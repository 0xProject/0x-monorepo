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

    /// @dev Emitted when WETH is deposited into the vault.
    /// @param sender Address of sender (`msg.sender`).
    /// @param poolId that owns of WETH.
    /// @param amount of WETH deposited.
    event EthDepositedIntoVault(
        address indexed sender,
        bytes32 indexed poolId,
        uint256 amount
    );

    /// @dev Emitted when rewards are transferred out of the vault.
    /// @param poolId Unique Id of pool.
    /// @param to Address to send funds to.
    /// @param amount Amount of WETH to transfer.
    event PoolRewardTransferred(
        bytes32 indexed poolId,
        address indexed to,
        uint256 amount
    );

    /// @dev Deposit an amount of WETH for `poolId` into the vault.
    ///      The staking contract should have granted the vault an allowance
    ///      because it will pull the WETH via `transferFrom()`.
    ///      Note that this is only callable by the staking contract.
    /// @param poolId Pool that holds the WETH.
    /// @param amount Amount of deposit.
    function depositFor(bytes32 poolId, uint256 amount)
        external;

    /// @dev Withdraw some amount in WETH from a pool.
    ///      Note that this is only callable by the staking contract.
    /// @param poolId Unique Id of pool.
    /// @param to Address to send funds to.
    /// @param amount Amount of WETH to transfer.
    function transfer(
        bytes32 poolId,
        address payable to,
        uint256 amount
    )
        external;

    /// @dev Returns the balance in WETH of `poolId`
    /// @return Balance in WETH.
    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256);
}
