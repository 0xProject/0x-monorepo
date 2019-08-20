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

pragma solidity ^0.5.5;

import "../libs/LibSafeMath.sol";
import "../interfaces/IZrxVault.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "./MixinVaultCore.sol";


/// @dev This vault manages Zrx Tokens.
/// When a user mints stake, their Zrx Tokens are deposited into this vault.
/// Similarly, when they burn stake, their Zrx Tokens are withdrawn from this vault.
/// There is a "Catastrophic Failure Mode" that, when invoked, only
/// allows withdrawals to be made. Once this vault is in catostrophic
/// failure mode, it cannot be returned to normal mode; this prevents
/// corruption of related state in the staking contract.
contract ZrxVault is
    Authorizable,
    IZrxVault,
    MixinVaultCore
{

    using LibSafeMath for uint256;

    // mapping from Owner to ZRX balance
    mapping (address => uint256) internal balances;

    // 0x ERC20 Proxy
    IAssetProxy internal erc20Proxy;

    // Zrx Token
    IERC20Token internal zrxToken;

    // Asset data for the ERC20 Proxy
    bytes internal zrxAssetData;

    /// @dev Constructor.
    /// @param erc20ProxyAddress Address of the 0x ERC20 Proxy.
    /// @param zrxTokenAddress Address of the Zrx Token.
    /// @param _zrxAssetData Zrx asset data for the ERC20 Proxy.
    constructor(
        address erc20ProxyAddress,
        address zrxTokenAddress,
        bytes memory _zrxAssetData
    )
        public
    {
        erc20Proxy = IAssetProxy(erc20ProxyAddress);
        zrxToken = IERC20Token(zrxTokenAddress);
        zrxAssetData = _zrxAssetData;
    }

    /// @dev Sets the ERC20 proxy.
    /// Note that only the contract owner can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param erc20ProxyAddress Address of the 0x ERC20 Proxy.
    function setErc20Proxy(address erc20ProxyAddress)
        external
        onlyOwner
        onlyNotInCatostrophicFailure
    {
        erc20Proxy = IAssetProxy(erc20ProxyAddress);
        emit Erc20ProxyChanged(erc20ProxyAddress);
    }

    /// @dev Sets the Zrx Asset Data.
    /// Note that only the contract owner can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param _zrxAssetData Zrx asset data for the ERC20 Proxy.
    function setZrxAssetData(bytes calldata _zrxAssetData)
        external
        onlyOwner
        onlyNotInCatostrophicFailure
    {
        zrxAssetData = _zrxAssetData;
        emit ZrxAssetDataChanged(_zrxAssetData);
    }

    /// @dev Deposit an `amount` of Zrx Tokens from `owner` into the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens to deposit.
    function depositFrom(address owner, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        // update balance
        balances[owner] = balances[owner]._add(amount);

        // notify
        emit ZrxDepositedIntoVault(msg.sender, owner, amount);

        // deposit ZRX from owner
        erc20Proxy.transferFrom(
            zrxAssetData,
            owner,
            address(this),
            amount
        );
    }

    /// @dev Withdraw an `amount` of Zrx Tokens to `owner` from the vault.
    /// Note that only the Staking contract can call this.
    /// Note that this can only be called when *not* in Catostrophic Failure mode.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens to withdraw.
    function withdrawFrom(address owner, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        _withdrawFrom(owner, amount);
    }

    /// @dev Withdraw ALL Zrx Tokens to `owner` from the vault.
    /// Note that this can only be called when *in* Catostrophic Failure mode.
    /// @param owner of Zrx Tokens.
    function withdrawAllFrom(address owner)
        external
        onlyInCatostrophicFailure
        returns (uint256)
    {
        // get total balance
        uint256 totalBalance = balances[owner];

        // withdraw ZRX to owner
        _withdrawFrom(owner, totalBalance);
        return totalBalance;
    }

    /// @dev Returns the balance in Zrx Tokens of the `owner`
    /// @return Balance in Zrx.
    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return balances[owner];
    }

    /// @dev Withdraw an `amount` of Zrx Tokens to `owner` from the vault.
    /// @param owner of Zrx Tokens.
    /// @param amount of Zrx Tokens to withdraw.
    function _withdrawFrom(address owner, uint256 amount)
        internal
    {
        // update balance
        // note that this call will revert if trying to withdraw more
        // than the current balance
        balances[owner] = balances[owner]._sub(amount);

        // notify
        emit ZrxWithdrawnFromVault(msg.sender, owner, amount);
        
        // withdraw ZRX to owner
        zrxToken.transfer(
            owner,
            amount
        );
    }
}
