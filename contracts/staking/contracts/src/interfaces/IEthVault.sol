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


/// @dev This vault manages Ether.
interface IEthVault {

    /// @dev Emitted when Ether are deposited into the vault.
    /// @param sender Address of sender (`msg.sender`).
    /// @param owner of Ether.
    /// @param amount of Ether deposited.
    event EthDepositedIntoVault(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted when Ether are withdrawn from the vault.
    /// @param sender Address of sender (`msg.sender`).
    /// @param owner of Ether.
    /// @param amount of Ether withdrawn.
    event EthWithdrawnFromVault(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    /// @dev Deposit an `amount` of ETH from `owner` into the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param owner of ETH Tokens.
    function depositFor(address owner)
        external
        payable;

    /// @dev Withdraw an `amount` of ETH to `msg.sender` from the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param amount of ETH to withdraw.
    function withdraw(uint256 amount)
        external;

    /// @dev Withdraw ALL ETH to `msg.sender` from the vault.
    function withdrawAll()
        external
        returns (uint256);

    /// @dev Withdraw ALL ETH to `staker` from the vault. This can only
    ///      be called by the staking contract.
    /// @param staker The address to withdraw for.
    function withdrawAllFor(address payable staker)
        external
        returns (uint256);

    /// @dev Returns the balance in ETH of the `owner`
    /// @return Balance in ETH.
    function balanceOf(address owner)
        external
        view
        returns (uint256);
}
