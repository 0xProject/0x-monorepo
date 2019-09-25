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
/// The contract also includes management of the staking contract
/// and setting the vault to "Catastrophic Failure Mode".
/// Catastrophic Failure Mode should only be set iff there is
/// non-recoverable corruption of the staking contracts. If there is a
/// recoverable flaw/bug/vulnerability, simply detach the staking contract
/// by setting its address to `address(0)`. In Catastrophic Failure Mode, only withdrawals
/// can be made (no deposits). Once Catastrophic Failure Mode  is invoked,
/// it cannot be returned to normal mode; this prevents corruption of related
/// state in the staking contract.
interface IZrxVault {

    /// @dev Emmitted whenever a StakingProxy is set in a vault.
    event StakingProxySet(address stakingProxyAddress);

    /// @dev Emitted when the Staking contract is put into Catastrophic Failure Mode
    /// @param sender Address of sender (`msg.sender`)
    event InCatastrophicFailureMode(address sender);

    /// @dev Emitted when Zrx Tokens are deposited into the vault.
    /// @param staker of Zrx Tokens.
    /// @param amount of Zrx Tokens deposited.
    event Deposit(
        address indexed staker,
        uint256 amount
    );

    /// @dev Emitted when Zrx Tokens are withdrawn from the vault.
    /// @param staker of Zrx Tokens.
    /// @param amount of Zrx Tokens withdrawn.
    event Withdraw(
        address indexed staker,
        uint256 amount
    );

    /// @dev Emitted whenever the ZRX AssetProxy is set.
    event ZrxProxySet(address zrxProxyAddress);

    /// @dev Sets the address of the StakingProxy contract.
    /// Note that only the contract staker can call this function.
    /// @param _stakingProxyAddress Address of Staking proxy contract.
    function setStakingProxy(address payable _stakingProxyAddress)
        external;

    /// @dev Vault enters into Catastrophic Failure Mode.
    /// *** WARNING - ONCE IN CATOSTROPHIC FAILURE MODE, YOU CAN NEVER GO BACK! ***
    /// Note that only the contract staker can call this function.
    function enterCatastrophicFailure()
        external;

    /// @dev Sets the Zrx proxy.
    /// Note that only the contract staker can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param zrxProxyAddress Address of the 0x Zrx Proxy.
    function setZrxProxy(address zrxProxyAddress)
        external;

    /// @dev Deposit an `amount` of Zrx Tokens from `staker` into the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param staker of Zrx Tokens.
    /// @param amount of Zrx Tokens to deposit.
    function depositFrom(address staker, uint256 amount)
        external;

    /// @dev Withdraw an `amount` of Zrx Tokens to `staker` from the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catastrophic Failure mode.
    /// @param staker of Zrx Tokens.
    /// @param amount of Zrx Tokens to withdraw.
    function withdrawFrom(address staker, uint256 amount)
        external;

    /// @dev Withdraw ALL Zrx Tokens to `staker` from the vault.
    /// Note that this can only be called when *in* Catastrophic Failure mode.
    /// @param staker of Zrx Tokens.
    function withdrawAllFrom(address staker)
        external
        returns (uint256);

    /// @dev Returns the balance in Zrx Tokens of the `staker`
    /// @return Balance in Zrx.
    function balanceOf(address staker)
        external
        view
        returns (uint256);
}
