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
pragma experimental ABIEncoderV2;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IUniswapExchangeFactory.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "./IDevUtils.sol";
import "./IEth2Dai.sol";
import "./IKyberNetwork.sol";


contract DeploymentConstants {

    /// @dev Address of the 0x DevUtils contract.
    address constant public DEVUTILS_ADDRESS = 0xcCc2431a7335F21d9268bA62F0B32B0f2EFC463f;
    /// @dev Address of the Eth2Dai MatchingMarket contract.
    address constant public ETH2DAI_ADDRESS = 0x39755357759cE0d7f32dC8dC45414CCa409AE24e;
    /// @dev Address of the UniswapExchangeFactory contract.
    address constant public UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;
    /// @dev Address of the KyberNeworkProxy contract.
    address constant public KYBER_NETWORK_PROXY_ADDRESS = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    /// @dev Address of the WETH contract.
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Kyber ETH pseudo-address.
    address constant public KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev An overridable way to retrieve the 0x DevUtils contract address.
    /// @return devUtils The 0x DevUtils contract address.
    function _getDevUtilsAddress()
        internal
        view
        returns (address devUtils)
    {
        return DEVUTILS_ADDRESS;
    }

    /// @dev An overridable way to retrieve the Eth2Dai exchange contract address.
    /// @return eth2dai The Eth2Dai exchange contract address.
    function _getEth2DaiAddress()
        internal
        view
        returns (address eth2dai)
    {
        return ETH2DAI_ADDRESS;
    }

    /// @dev An overridable way to retrieve the Uniswap exchange factory contract address.
    /// @return uniswap The UniswapExchangeFactory contract address.
    function _getUniswapExchangeFactoryAddress()
        internal
        view
        returns (address uniswap)
    {
        return UNISWAP_EXCHANGE_FACTORY_ADDRESS;
    }

    /// @dev An overridable way to retrieve the Kyber network proxy contract address.
    /// @return kyber The KyberNeworkProxy contract address.
    function _getKyberNetworkAddress()
        internal
        view
        returns (address kyber)
    {
        return KYBER_NETWORK_PROXY_ADDRESS;
    }

    /// @dev An overridable way to retrieve the WETH contract address.
    /// @return weth The WETH contract address.
    function _getWETHAddress()
        internal
        view
        returns (address weth)
    {
        return WETH_ADDRESS;
    }
}
