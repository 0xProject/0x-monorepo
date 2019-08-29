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

import "../interfaces/IStakingEvents.sol";
import "../interfaces/IStakingPoolRewardVault.sol";
import "../immutable/MixinStorage.sol";


/// @dev This mixin contains logic for interfacing with the Staking Pool Reward Vault (vaults/StakingPoolRewardVault.sol)
/// Note that setters are callable only by the owner of this contract, and withdraw functionality is accessible only
/// from within this contract.
contract MixinStakingPoolRewardVault is
    IStakingEvents,
    MixinStorage
{
    /// @dev Sets the address of the reward vault.
    /// This can only be called by the owner of this contract.
    function setStakingPoolRewardVault(address payable rewardVaultAddress)
        external
        onlyOwner
    {
        rewardVault = IStakingPoolRewardVault(rewardVaultAddress);
        emit StakingPoolRewardVaultChanged(rewardVaultAddress);
    }

    /// @dev Returns the staking pool reward vault
    /// @return Address of reward vault.
    function getStakingPoolRewardVault()
        public
        view
        returns (address)
    {
        return address(rewardVault);
    }
}
