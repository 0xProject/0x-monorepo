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
import "../sys/MixinOwnable.sol";


/// @dev This mixin contains logic for interfacing with the Staking Pool Reward Vault (vaults/StakingPoolRewardVault.sol)
/// Note that setters are callable only by the owner of this contract, and withdraw functionality is accessible only
/// from within this contract.
contract MixinStakingPoolRewardVault is
    IStakingEvents,
    MixinDeploymentConstants,
    Ownable,
    MixinConstants,
    MixinStorage,
    MixinOwnable
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

    /// @dev Returns the total balance in ETH of a staking pool, as recorded in the vault.
    /// @param poolId Unique id of pool.
    /// @return Balance.
    function getTotalBalanceInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOf(poolId);
    }

    /// @dev Returns the balance in ETH of the staking pool operator, as recorded in the vault.
    /// @param poolId Unique id of pool.
    /// @return Balance.
    function getBalanceOfOperatorInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOfOperator(poolId);
    }

    /// @dev Returns the balance in ETH co-owned by the members of a pool, as recorded in the vault.
    /// @param poolId Unique id of pool.
    /// @return Balance.
    function getBalanceOfMembersInStakingPoolRewardVault(bytes32 poolId)
        public
        view
        returns (uint256)
    {
        return rewardVault.balanceOfMembers(poolId);
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

    /// @dev Withdraws an amount in ETH of the reward for a pool operator.
    /// @param poolId Unique id of pool.
    /// @param amount The amount to withdraw.
    function _withdrawFromOperatorInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawForOperator(poolId, amount);
    }

    /// @dev Withdraws an amount in ETH of the reward for a pool member.
    /// @param poolId Unique id of pool.
    /// @param amount The amount to withdraw.
    function _withdrawFromMemberInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.withdrawForMember(poolId, amount);
    }

    /// @dev Deposits an amount in ETH into the reward vault.
    /// @param amount The amount in ETH to deposit.
    function _depositIntoStakingPoolRewardVault(uint256 amount)
        internal
    {
        address payable rewardVaultAddress = address(uint160(address(rewardVault)));
        rewardVaultAddress.transfer(amount);
    }

    /// @dev Records an amount deposited into the reward vault for a specific pool.
    /// @param poolId Unique id of pool.
    /// @param amount The amount in ETH to record.
    function _recordDepositInStakingPoolRewardVault(bytes32 poolId, uint256 amount)
        internal
    {
        rewardVault.recordDepositFor(poolId, amount);
    }
}
