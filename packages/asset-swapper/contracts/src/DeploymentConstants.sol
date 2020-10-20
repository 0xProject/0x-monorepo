/*

  Copyright 2020 ZeroEx Intl.

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


contract DeploymentConstants {

    // solhint-disable separate-by-one-line-in-contract

    // Mainnet addresses ///////////////////////////////////////////////////////
    /// @dev Mainnet address of the WETH contract.
    address constant private WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Mainnet address of the KyberNetworkProxy contract.
    address constant private KYBER_NETWORK_PROXY_ADDRESS = 0x9AAb3f75489902f3a48495025729a0AF77d4b11e;
    /// @dev Mainnet address of the KyberHintHandler contract.
    address constant private KYBER_HINT_HANDLER_ADDRESS = 0xa1C0Fa73c39CFBcC11ec9Eb1Afc665aba9996E2C;
    /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;
    /// @dev Mainnet address of the `UniswapV2Router01` contract.
    address constant private UNISWAP_V2_ROUTER_01_ADDRESS = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;
    /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    address constant private ETH2DAI_ADDRESS = 0x794e6e91555438aFc3ccF1c5076A74F42133d08D;
    /// @dev Mainnet address of the `ERC20BridgeProxy` contract
    address constant private ERC20_BRIDGE_PROXY_ADDRESS = 0x8ED95d1746bf1E4dAb58d8ED4724f1Ef95B20Db0;
    ///@dev Mainnet address of the `Dai` (multi-collateral) contract
    address constant private DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    /// @dev Mainnet address of the `Chai` contract
    address constant private CHAI_ADDRESS = 0x06AF07097C9Eeb7fD685c692751D5C66dB49c215;
    /// @dev Mainnet address of the 0x DevUtils contract.
    address constant private DEV_UTILS_ADDRESS = 0x74134CF88b21383713E096a5ecF59e297dc7f547;
    /// @dev Kyber ETH pseudo-address.
    address constant internal KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    /// @dev Mainnet address of the dYdX contract.
    address constant private DYDX_ADDRESS = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;
    /// @dev Mainnet address of the GST2 contract
    address constant private GST_ADDRESS = 0x0000000000b3F879cb30FE243b4Dfee438691c04;
    /// @dev Mainnet address of the GST Collector
    address constant private GST_COLLECTOR_ADDRESS = 0x000000D3b08566BE75A6DB803C03C85C0c1c5B96;
    /// @dev Mainnet address of the mStable mUSD contract.
    address constant private MUSD_ADDRESS = 0xe2f2a5C287993345a840Db3B0845fbC70f5935a5;
    /// @dev Mainnet address of the Mooniswap Registry contract
    address constant private MOONISWAP_REGISTRY = 0x71CD6666064C3A1354a3B4dca5fA1E2D3ee7D303;
    /// @dev Mainnet address of the Shell contract
    address constant private SHELL_CONTRACT = 0x2E703D658f8dd21709a7B458967aB4081F8D3d05;
    /// @dev Mainnet address of the DODO Registry (ZOO) contract
    address constant private DODO_REGISTRY = 0x3A97247DF274a17C59A3bd12735ea3FcDFb49950;
    /// @dev Mainnet address of the DODO Helper contract
    address constant private DODO_HELPER = 0x533dA777aeDCE766CEAe696bf90f8541A4bA80Eb;

    // // Ropsten addresses ///////////////////////////////////////////////////////
    // /// @dev Mainnet address of the WETH contract.
    // address constant private WETH_ADDRESS = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    // /// @dev Mainnet address of the KyberNetworkProxy contract.
    // address constant private KYBER_NETWORK_PROXY_ADDRESS = 0xd719c34261e099Fdb33030ac8909d5788D3039C4;
    // /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    // address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0x9c83dCE8CA20E9aAF9D3efc003b2ea62aBC08351;
    // /// @dev Mainnet address of the `UniswapV2Router01` contract.
    // address constant private UNISWAP_V2_ROUTER_01_ADDRESS = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;
    // /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    // address constant private ETH2DAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the `ERC20BridgeProxy` contract
    // address constant private ERC20_BRIDGE_PROXY_ADDRESS = 0xb344afeD348de15eb4a9e180205A2B0739628339;
    // ///@dev Mainnet address of the `Dai` (multi-collateral) contract
    // address constant private DAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the `Chai` contract
    // address constant private CHAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the 0x DevUtils contract.
    // address constant private DEV_UTILS_ADDRESS = 0xC812AF3f3fBC62F76ea4262576EC0f49dB8B7f1c;
    // /// @dev Kyber ETH pseudo-address.
    // address constant internal KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // /// @dev Mainnet address of the dYdX contract.
    // address constant private DYDX_ADDRESS = address(0);
    // /// @dev Mainnet address of the GST2 contract
    // address constant private GST_ADDRESS = address(0);
    // /// @dev Mainnet address of the GST Collector
    // address constant private GST_COLLECTOR_ADDRESS = address(0);
    // /// @dev Mainnet address of the mStable mUSD contract.
    // address constant private MUSD_ADDRESS = 0x4E1000616990D83e56f4b5fC6CC8602DcfD20459;

    // // Rinkeby addresses ///////////////////////////////////////////////////////
    // /// @dev Mainnet address of the WETH contract.
    // address constant private WETH_ADDRESS = 0xc778417E063141139Fce010982780140Aa0cD5Ab;
    // /// @dev Mainnet address of the KyberNetworkProxy contract.
    // address constant private KYBER_NETWORK_PROXY_ADDRESS = 0x0d5371e5EE23dec7DF251A8957279629aa79E9C5;
    // /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    // address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xf5D915570BC477f9B8D6C0E980aA81757A3AaC36;
    // /// @dev Mainnet address of the `UniswapV2Router01` contract.
    // address constant private UNISWAP_V2_ROUTER_01_ADDRESS = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;
    // /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    // address constant private ETH2DAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the `ERC20BridgeProxy` contract
    // address constant private ERC20_BRIDGE_PROXY_ADDRESS = 0xA2AA4bEFED748Fba27a3bE7Dfd2C4b2c6DB1F49B;
    // ///@dev Mainnet address of the `Dai` (multi-collateral) contract
    // address constant private DAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the `Chai` contract
    // address constant private CHAI_ADDRESS = address(0);
    // /// @dev Mainnet address of the 0x DevUtils contract.
    // address constant private DEV_UTILS_ADDRESS = 0x46B5BC959e8A754c0256FFF73bF34A52Ad5CdfA9;
    // /// @dev Kyber ETH pseudo-address.
    // address constant internal KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // /// @dev Mainnet address of the dYdX contract.
    // address constant private DYDX_ADDRESS = address(0);
    // /// @dev Mainnet address of the GST2 contract
    // address constant private GST_ADDRESS = address(0);
    // /// @dev Mainnet address of the GST Collector
    // address constant private GST_COLLECTOR_ADDRESS = address(0);
    // /// @dev Mainnet address of the mStable mUSD contract.
    // address constant private MUSD_ADDRESS = address(0);

    // // Kovan addresses /////////////////////////////////////////////////////////
    // /// @dev Kovan address of the WETH contract.
    // address constant private WETH_ADDRESS = 0xd0A1E359811322d97991E03f863a0C30C2cF029C;
    // /// @dev Kovan address of the KyberNetworkProxy contract.
    // address constant private KYBER_NETWORK_PROXY_ADDRESS = 0x692f391bCc85cefCe8C237C01e1f636BbD70EA4D;
    // /// @dev Kovan address of the `UniswapExchangeFactory` contract.
    // address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30;
    // /// @dev Kovan address of the `UniswapV2Router01` contract.
    // address constant private UNISWAP_V2_ROUTER_01_ADDRESS = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;
    // /// @dev Kovan address of the Eth2Dai `MatchingMarket` contract.
    // address constant private ETH2DAI_ADDRESS = 0xe325acB9765b02b8b418199bf9650972299235F4;
    // /// @dev Kovan address of the `ERC20BridgeProxy` contract
    // address constant private ERC20_BRIDGE_PROXY_ADDRESS = 0x3577552C1Fb7A44aD76BeEB7aB53251668A21F8D;
    // /// @dev Kovan address of the `Chai` contract
    // address constant private CHAI_ADDRESS = address(0);
    // /// @dev Kovan address of the `Dai` (multi-collateral) contract
    // address constant private DAI_ADDRESS = 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa;
    // /// @dev Kovan address of the 0x DevUtils contract.
    // address constant private DEV_UTILS_ADDRESS = 0x9402639A828BdF4E9e4103ac3B69E1a6E522eB59;
    // /// @dev Kyber ETH pseudo-address.
    // address constant internal KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    // /// @dev Kovan address of the dYdX contract.
    // address constant private DYDX_ADDRESS = address(0);
    // /// @dev Kovan address of the GST2 contract
    // address constant private GST_ADDRESS = address(0);
    // /// @dev Kovan address of the GST Collector
    // address constant private GST_COLLECTOR_ADDRESS = address(0);
    // /// @dev Mainnet address of the mStable mUSD contract.
    // address constant private MUSD_ADDRESS = address(0);

    /// @dev Overridable way to get the `KyberNetworkProxy` address.
    /// @return kyberAddress The `IKyberNetworkProxy` address.
    function _getKyberNetworkProxyAddress()
        internal
        view
        returns (address kyberAddress)
    {
        return KYBER_NETWORK_PROXY_ADDRESS;
    }

    /// @dev Overridable way to get the `KyberHintHandler` address.
    /// @return kyberAddress The `IKyberHintHandler` address.
    function _getKyberHintHandlerAddress()
        internal
        view
        returns (address hintHandlerAddress)
    {
        return KYBER_HINT_HANDLER_ADDRESS;
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

    /// @dev Overridable way to get the `UniswapV2Router01` address.
    /// @return uniswapRouterAddress The `UniswapV2Router01` address.
    function _getUniswapV2Router01Address()
        internal
        view
        returns (address uniswapRouterAddress)
    {
        return UNISWAP_V2_ROUTER_01_ADDRESS;
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

    /// @dev An overridable way to retrieve the 0x `DevUtils` contract address.
    /// @return devUtils The 0x `DevUtils` contract address.
    function _getDevUtilsAddress()
        internal
        view
        returns (address devUtils)
    {
        return DEV_UTILS_ADDRESS;
    }

    /// @dev Overridable way to get the DyDx contract.
    /// @return exchange The DyDx exchange contract.
    function _getDydxAddress()
        internal
        view
        returns (address dydxAddress)
    {
        return DYDX_ADDRESS;
    }

    /// @dev An overridable way to retrieve the GST2 contract address.
    /// @return gst The GST contract.
    function _getGstAddress()
        internal
        view
        returns (address gst)
    {
        return GST_ADDRESS;
    }

    /// @dev An overridable way to retrieve the GST Collector address.
    /// @return collector The GST collector address.
    function _getGstCollectorAddress()
        internal
        view
        returns (address collector)
    {
        return GST_COLLECTOR_ADDRESS;
    }

    /// @dev An overridable way to retrieve the mStable mUSD address.
    /// @return musd The mStable mUSD address.
    function _getMUsdAddress()
        internal
        view
        returns (address musd)
    {
        return MUSD_ADDRESS;
    }

    /// @dev An overridable way to retrieve the Mooniswap registry address.
    /// @return registry The Mooniswap registry address.
    function _getMooniswapAddress()
        internal
        view
        returns (address)
    {
        return MOONISWAP_REGISTRY;
    }

    /// @dev An overridable way to retrieve the Shell contract address.
    /// @return registry The Shell contract address.
    function _getShellAddress()
        internal
        view
        returns (address)
    {
        return SHELL_CONTRACT;
    }

    /// @dev An overridable way to retrieve the DODO Registry contract address.
    /// @return registry The DODO Registry contract address.
    function _getDODORegistryAddress()
        internal
        view
        returns (address)
    {
        return DODO_REGISTRY;
    }

    /// @dev An overridable way to retrieve the DODO Helper contract address.
    /// @return registry The DODO Helper contract address.
    function _getDODOHelperAddress()
        internal
        view
        returns (address)
    {
        return DODO_HELPER;
    }
}
