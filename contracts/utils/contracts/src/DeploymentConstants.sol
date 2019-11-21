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

import "./interfaces/IOwnable.sol";
import "./LibOwnableRichErrors.sol";
import "./LibRichErrors.sol";


contract DeploymentConstants {
    /// @dev Mainnet address of the WETH contract.
    address constant private WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Mainnet address of the KyberNeworkProxy contract.
    address constant private KYBER_NETWORK_PROXY_ADDRESS = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;
    /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    address constant private ETH2DAI_ADDRESS = 0x39755357759cE0d7f32dC8dC45414CCa409AE24e;
    /// @dev Mainnet address of the `ERC20BridgeProxy` contract
    address constant private ERC20_BRIDGE_PROXY_ADDRESS = 0x8ED95d1746bf1E4dAb58d8ED4724f1Ef95B20Db0;
    ///@dev Mainnet address of the `Dai` (multi-collateral) contract
    address constant private DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    /// @dev Mainnet address of the `Chai` contract
    address constant private CHAI_ADDRESS = 0x06AF07097C9Eeb7fD685c692751D5C66dB49c215;
    /// @dev Mainnet address of the DyDx contract.
    address constant private DYDX_ADDRESS = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;

    /// @dev Overridable way to get the `KyberNetworkProxy` address.
    /// @return kyberAddress The `IKyberNetworkProxy` address.
    function _getKyberNetworkProxyAddress()
        internal
        view
        returns (address kyberAddress)
    {
        return KYBER_NETWORK_PROXY_ADDRESS;
    }

    /// @dev Overridable way to get the WETH address.
    /// @return wethAddress The WETH address.
    function _getWethAddress()
        internal
        view
        returns (address wethAddress)
    {
        return WETH_ADDRESS;
    }

    /// @dev Overridable way to get the `UniswapExchangeFactory` address.
    /// @return uniswapAddress The `UniswapExchangeFactory` address.
    function _getUniswapExchangeFactoryAddress()
        internal
        view
        returns (address uniswapAddress)
    {
        return UNISWAP_EXCHANGE_FACTORY_ADDRESS;
    }

    /// @dev An overridable way to retrieve the Eth2Dai `MatchingMarket` contract.
    /// @return eth2daiAddress The Eth2Dai `MatchingMarket` contract.
    function _getEth2DaiAddress()
        internal
        view
        returns (address eth2daiAddress)
    {
        return ETH2DAI_ADDRESS;
    }

    /// @dev An overridable way to retrieve the `ERC20BridgeProxy` contract.
    /// @return erc20BridgeProxyAddress The `ERC20BridgeProxy` contract.
    function _getERC20BridgeProxyAddress()
        internal
        view
        returns (address erc20BridgeProxyAddress)
    {
        return ERC20_BRIDGE_PROXY_ADDRESS;
    }

    /// @dev An overridable way to retrieve the `Dai` contract.
    /// @return daiAddress The `Dai` contract.
    function _getDaiAddress()
        internal
        view
        returns (address daiAddress)
    {
        return DAI_ADDRESS;
    }

    /// @dev An overridable way to retrieve the `Chai` contract.
    /// @return chaiAddress The `Chai` contract.
    function _getChaiAddress()
        internal
        view
        returns (address chaiAddress)
    {
        return CHAI_ADDRESS;
    }

    /// @dev Overridable way to get the DyDx contract.
    /// @return exchange The DyDx exchange contract.
    function _getDyDxAddress()
        internal
        view
        returns (address dydxAddress)
    {
        return DYDX_ADDRESS;
    }
}
