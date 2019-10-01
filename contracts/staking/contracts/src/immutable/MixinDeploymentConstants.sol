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

import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "../interfaces/IZrxVault.sol";


// solhint-disable separate-by-one-line-in-contract
contract MixinDeploymentConstants {

    // @TODO SET THESE VALUES FOR DEPLOYMENT

    // Mainnet WETH9 Address
    address constant private WETH_ADDRESS = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    // Kovan WETH9 Address
    // address constant private WETH_ADDRESS = address(0xd0a1e359811322d97991e03f863a0c30c2cf029c);

    // Ropsten & Rinkeby WETH9 Address
    // address constant private WETH_ADDRESS = address(0xc778417e063141139fce010982780140aa0cd5ab);

    // @TODO SET THESE VALUES FOR DEPLOYMENT
    address constant private ZRX_VAULT_ADDRESS = address(1);

    /// @dev An overridable way to access the deployed WETH contract.
    ///      Must be view to allow overrides to access state.
    /// @return wethContract The WETH contract instance.
    function getWethContract()
        public
        view
        returns (IEtherToken wethContract)
    {
        wethContract = IEtherToken(WETH_ADDRESS);
        return wethContract;
    }

    /// @dev An overridable way to access the deployed zrxVault.
    ///      Must be view to allow overrides to access state.
    /// @return zrxVault The zrxVault contract.
    function getZrxVault()
        public
        view
        returns (IZrxVault zrxVault)
    {
        zrxVault = IZrxVault(ZRX_VAULT_ADDRESS);
        return zrxVault;
    }
}
