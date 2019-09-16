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


/// @dev This mixin contains core logic for vaults.
/// This includes management of the staking contract
/// and setting the vault to "Catastrophic Failure Mode".
/// It's up to the vault how they handle this failure mode; however,
/// all vaults should disable all functionality aside from withdrawals.
/// Vaults should only be set to Catastrophic Failure Mode iff there is
/// non-recoverable corruption of the staking contracts. If there is a
/// recoverable flaw/bug/vulnerability, simply detach the staking contract
/// by setting its address to `address(0)`. Once in Catastrophic Failure Mode,
/// a vault cannot be reset to normal mode; this prevents corruption of related
/// state in the staking contract.
interface IVaultCore {

    /// @dev Emmitted whenever a StakingProxy is set in a vault.
    event StakingProxySet(address stakingProxyAddress);

    /// @dev Emitted when the Staking contract is put into Catastrophic Failure Mode
    /// @param sender Address of sender (`msg.sender`)
    event InCatastrophicFailureMode(address sender);

    /// @dev Sets the address of the StakingProxy contract.
    /// Note that only the contract owner can call this function.
    /// @param _stakingProxyAddress Address of Staking proxy contract.
    function setStakingProxy(address payable _stakingProxyAddress)
        external;

    /// @dev Vault enters into Catastrophic Failure Mode.
    /// *** WARNING - ONCE IN CATOSTROPHIC FAILURE MODE, YOU CAN NEVER GO BACK! ***
    /// Note that only the contract owner can call this function.
    function enterCatastrophicFailure()
        external;
}
