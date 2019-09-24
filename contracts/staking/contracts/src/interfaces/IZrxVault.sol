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


/// @dev This vault manages Zrx Tokens.
/// When a user mints stake, their Zrx Tokens are deposited into this vault.
/// Similarly, when they burn stake, their Zrx Tokens are withdrawn from this vault.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catastrophic
/// failure mode, it cannot be returned to normal mode; this prevents
/// corruption of related state in the staking contract.
interface IZrxVault {

    /// @dev Emitted when Zrx Tokens are deposited into the vault.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens deposited.
    event ZrxDepositedIntoVault(
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted when Zrx Tokens are withdrawn from the vault.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens withdrawn.
    event ZrxWithdrawnFromVault(
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted whenever the ZRX AssetProxy is set.
    event ZrxProxySet(address zrxProxyAddress);

    /// @dev Sets the Zrx proxy.
    /// Note that only the contract owner can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param zrxProxyAddress Address of the 0x Zrx Proxy.
    function setZrxProxy(address zrxProxyAddress)
        external;

    /// @dev Deposit an `amount` of Zrx Tokens from `owner` into the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens to deposit.
    function depositFrom(address owner, uint256 amount)
        external;

    /// @dev Withdraw an `amount` of Zrx Tokens to `owner` from the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens to withdraw.
    function withdrawFrom(address owner, uint256 amount)
        external;

    /// @dev Withdraw ALL Zrx Tokens to `owner` from the vault.
    /// Note that this can only be called when *in* Catastrophic Failure mode.
    /// @param owner of Zrx Tokens.
    function withdrawAllFrom(address owner)
        external
        returns (uint256);

    /// @dev Returns the balance in Zrx Tokens of the `owner`
    /// @return Balance in Zrx.
    function balanceOf(address owner)
        external
        view
        returns (uint256);
}
