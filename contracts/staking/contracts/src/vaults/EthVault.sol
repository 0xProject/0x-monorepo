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

import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../interfaces/IEthVault.sol";
import "../libs/LibStakingRichErrors.sol";
import "./MixinVaultCore.sol";


/// @dev This vault manages ETH.
contract EthVault is
    IEthVault,
    MixinVaultCore
{
    using LibSafeMath for uint256;

    // mapping from Owner to ETH balance
    mapping (address => uint256) internal _balances;

    /// @dev Deposit an `amount` of ETH from `owner` into the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param owner of ETH Tokens.
    function depositFor(address owner)
        external
        payable
    {
        // update balance
        uint256 amount = msg.value;
        _balances[owner] = _balances[owner].safeAdd(msg.value);

        // notify
        emit EthDepositedIntoVault(msg.sender, owner, amount);
    }

    /// @dev Withdraw an `amount` of ETH to `msg.sender` from the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param amount of ETH to withdraw.
    function withdraw(uint256 amount)
        external
    {
        _withdrawFrom(msg.sender, amount);
    }

    /// @dev Withdraw ALL ETH to `msg.sender` from the vault.
    function withdrawAll()
        external
        returns (uint256 totalBalance)
    {
        // get total balance
        address payable owner = msg.sender;
        totalBalance = _balances[owner];

        // withdraw ETH to owner
        _withdrawFrom(owner, totalBalance);
        return totalBalance;
    }

    /// @dev Withdraw ALL ETH to `staker` from the vault. This can only
    ///      be called by the staking contract.
    /// @param staker The address to withdraw for.
    function withdrawAllFor(address payable staker)
        external
        onlyStakingProxy
        returns (uint256 totalBalance)
    {
        // get total balance
        totalBalance = _balances[staker];

        // withdraw ETH to staker
        _withdrawFrom(staker, totalBalance);
        return totalBalance;
    }

    /// @dev Returns the balance in ETH of the `owner`
    /// @return Balance in ETH.
    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return _balances[owner];
    }

    /// @dev Withdraw an `amount` of ETH to `owner` from the vault.
    /// @param owner of ETH.
    /// @param amount of ETH to withdraw.
    function _withdrawFrom(address payable owner, uint256 amount)
        internal
    {
        // update balance
        // note that this call will revert if trying to withdraw more
        // than the current balance
        _balances[owner] = _balances[owner].safeSub(amount);

        // notify
        emit EthWithdrawnFromVault(msg.sender, owner, amount);

        // withdraw ETH to owner
        owner.transfer(amount);
    }
}