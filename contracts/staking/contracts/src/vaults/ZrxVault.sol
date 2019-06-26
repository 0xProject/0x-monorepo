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
import "../interfaces/IAssetProxy.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "./MixinVaultCore.sol";


contract ZrxVault is
    IZrxVault,
    MixinVaultCore
{

    using LibSafeMath for uint256;

    // mapping from Owner to ZRX balance
    mapping (address => uint256) internal balances;

    IAssetProxy internal erc20Proxy;

    IERC20Token internal zrxToken;

    bytes internal zrxAssetData;

    constructor(
        address _erc20ProxyAddress,
        address _zrxTokenAddress,
        bytes memory _zrxAssetData
    )
        public
    {
        erc20Proxy = IAssetProxy(_erc20ProxyAddress);
        zrxToken = IERC20Token(_zrxTokenAddress);
        zrxAssetData = _zrxAssetData;
    }

    function setErc20Proxy(address _erc20ProxyAddress)
        external
        onlyOwner
    {
        erc20Proxy = IAssetProxy(_erc20ProxyAddress);
    }

    function setZrxAssetData(bytes calldata _zrxAssetData)
        external
        onlyOwner
    {
        zrxAssetData = _zrxAssetData;
    }

    function depositFrom(address owner, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        // deposit ZRX from owner
        erc20Proxy.transferFrom(
            zrxAssetData,
            owner,
            address(this),
            amount
        );

        // update balance
        balances[owner] = balances[owner]._add(amount);
    }

    function withdrawFrom(address owner, uint256 amount)
        external
        onlyStakingContract
        onlyNotInCatostrophicFailure
    {
        _withdrawFrom(owner, amount);
    }

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

    function balanceOf(address owner)
        external
        view
        returns (uint256)
    {
        return balances[owner];
    }

    function _withdrawFrom(address owner, uint256 amount)
        internal
    {
        // update balance
        // note that this call will revert if trying to withdraw more
        // than the current balance
        balances[owner] = balances[owner]._sub(amount);
        
        // withdraw ZRX to owner
        zrxToken.transfer(
            owner,
            amount
        );
    }
}
