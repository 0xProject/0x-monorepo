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
    /// @param sender Address of sender (`msg.sender`).
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens deposited.
    event ZrxDepositedIntoVault(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted when Zrx Tokens are withdrawn from the vault.
    /// @param sender Address of sender (`msg.sender`).
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens withdrawn.
    event ZrxWithdrawnFromVault(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    /// @dev Emitted when the Zrx Proxy is changed.
    /// @param zrxProxyAddress Address of the new ERC20 proxy.
    event ZrxProxyChanged(
        address zrxProxyAddress
    );

    /// @dev Gets the address of the AssetProxy contract used to transfer ZRX.
    /// @return Address of the AssetProxy contract used to transfer ZRX.
    function zrxAssetProxy()
        external
        view
        returns (address);

    /// @dev Gets the owner's ZRX balance in the vault.
    /// @param owner Address of ZRX owner.
    /// @return ZRX balance of owner in vault.
    function balances(address owner)
        external
        view
        returns (uint256);

    /// @dev Sets the Zrx proxy.
    /// Note that only the contract owner can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param zrxProxyAddress Address of the 0x Zrx Asset Proxy.
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
}
