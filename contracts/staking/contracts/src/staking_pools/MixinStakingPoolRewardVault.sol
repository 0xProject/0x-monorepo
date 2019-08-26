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
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
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

    /// @dev Registers a staking pool in the reward vault.
    /// @param poolId Unique id of pool.
    /// @param operatorShare The percentage of the rewards owned by the operator.
    function _registerStakingPoolInRewardVault(bytes32 poolId, uint8 operatorShare)
        internal
    {
        rewardVault.registerStakingPool(
            poolId,
            operatorShare
        );
    }

    /// @dev Deposits an amount in ETH into the reward vault.
    /// @param amount The amount in ETH to deposit.
    function _depositIntoStakingPoolRewardVault(uint256 amount)
        internal
    {
        address payable rewardVaultAddress = address(uint160(address(rewardVault)));
        rewardVaultAddress.transfer(amount);
    }

    /// @dev Transfer from transient Reward Pool vault to ETH Vault.
    /// @param poolId Unique Id of pool.
    /// @param member of pool to transfer ETH to.
    /// @param amount The amount in ETH to transfer.
    function _transferMemberBalanceToEthVault(
        bytes32 poolId,
        address member,
        uint256 amount
    )
        internal
    {
        require(
            address(rewardVault) != NIL_ADDRESS,
            "REWARD_VAULT_NOT_SET"
        );
        rewardVault.transferMemberBalanceToEthVault(poolId, member, amount);
    }
}
