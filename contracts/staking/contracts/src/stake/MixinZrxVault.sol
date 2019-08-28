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

import "../interfaces/IZrxVault.sol";
import "../immutable/MixinStorage.sol";
import "../sys/MixinOwnable.sol";


/// @dev This mixin contains logic for managing and interfacing with the Zrx Vault.
/// (see vaults/ZrxVault.sol).
contract MixinZrxVault is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinOwnable
{

    /// @dev Set the Zrx Vault.
    /// @param zrxVaultAddress Address of the Zrx Vault.
    function setZrxVault(address zrxVaultAddress)
        external
        onlyOwner
    {
        zrxVault = IZrxVault(zrxVaultAddress);
    }

    /// @dev Return the current Zrx Vault
    /// @return Zrx Vault
    function getZrxVault()
        public
        view
        returns (address)
    {
        return address(zrxVault);
    }

    /// @dev Deposits Zrx Tokens from the `owner` into the vault.
    /// @param owner of Zrx Tokens
    /// @param amount of tokens to deposit.
    function _depositFromOwnerIntoZrxVault(address owner, uint256 amount)
        internal
    {
        zrxVault.depositFrom(owner, amount);
    }

    /// @dev Withdraws Zrx Tokens from to `owner` from the vault.
    /// @param owner of deposited Zrx Tokens
    /// @param amount of tokens to withdraw.
    function _withdrawToOwnerFromZrxVault(address owner, uint256 amount)
        internal
    {
        zrxVault.withdrawFrom(owner, amount);
    }

    /// @dev Returns balance of `owner` in the ZRX ault.
    /// @param owner of deposited Zrx Tokens.
    function _balanceOfOwnerInZrxVault(address owner)
        internal
        view
        returns (uint256)
    {
        return zrxVault.balanceOf(owner);
    }
}
