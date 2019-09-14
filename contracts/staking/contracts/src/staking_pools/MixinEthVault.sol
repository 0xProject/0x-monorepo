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

import "../immutable/MixinStorage.sol";


/// @dev This mixin contains logic for managing and interfacing with the Eth Vault.
/// (see vaults/EthVault.sol).
contract MixinEthVault is
    MixinStorage
{

    /// @dev Set the Eth Vault.
    /// @param ethVaultAddress Address of the Eth Vault.
    function setEthVault(address ethVaultAddress)
        external
        onlyOwner
    {
        ethVault = IEthVault(ethVaultAddress);
    }

    /// @dev Return the current Eth Vault
    /// @return Eth Vault
    function getEthVault()
        public
        view
        returns (address)
    {
        return address(ethVault);
    }
}
