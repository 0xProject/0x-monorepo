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
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./IERC20BridgeSampler.sol";
import "./IEth2Dai.sol";
import "./IKyberNetwork.sol";
import "./IUniswapExchangeQuotes.sol";
import "./DeploymentConstants.sol";


contract ERC20BridgeSampler is
    IERC20BridgeSampler,
    DeploymentConstants
{
    bytes4 constant internal ERC20_PROXY_ID = 0xf47261b0; // bytes4(keccak256("ERC20Token(address)"));

    /// @dev Query native orders and sample sell quotes on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return orderInfos `OrderInfo`s for each order in `orders`.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleSells(
        LibOrder.Order[] memory orders,
        address[] memory sources,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (
            LibOrder.OrderInfo[] memory orderInfos,
            uint256[][] memory makerTokenAmountsBySource
        )
    {
        require(orders.length != 0, "EMPTY_ORDERS");
        orderInfos = queryOrders(orders);
        makerTokenAmountsBySource = sampleSells(
            sources,
            _assetDataToTokenAddress(orders[0].takerAssetData),
            _assetDataToTokenAddress(orders[0].makerAssetData),
            takerTokenAmounts
        );
    }

    /// @dev Query native orders and sample buy quotes on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return orderInfos `OrderInfo`s for each order in `orders`.
    /// @return takerTokenAmountsBySource Taker amounts sold for each source at
    ///         each maker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleBuys(
        LibOrder.Order[] memory orders,
        address[] memory sources,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (
            LibOrder.OrderInfo[] memory orderInfos,
            uint256[][] memory makerTokenAmountsBySource
        )
    {
        require(orders.length != 0, "EMPTY_ORDERS");
        orderInfos = queryOrders(orders);
        makerTokenAmountsBySource = sampleBuys(
            sources,
            _assetDataToTokenAddress(orders[0].takerAssetData),
            _assetDataToTokenAddress(orders[0].makerAssetData),
            makerTokenAmounts
        );
    }

    /// @dev Queries the status of several native orders.
    /// @param orders Native orders to query.
    /// @return orderInfos Order info for each respective order.
    function queryOrders(LibOrder.Order[] memory orders)
        public
        view
        returns (LibOrder.OrderInfo[] memory orderInfos)
    {
        uint256 numOrders = orders.length;
        orderInfos = new LibOrder.OrderInfo[](numOrders);
        for (uint256 i = 0; i < numOrders; i++) {
            orderInfos[i] = _getExchangeContract().getOrderInfo(orders[i]);
        }
    }

    /// @dev Sample sell quotes on multiple DEXes at once.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function sampleSells(
        address[] memory sources,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[][] memory makerTokenAmountsBySource)
    {
        uint256 numSources = sources.length;
        makerTokenAmountsBySource = new uint256[][](numSources);
        for (uint256 i = 0; i < numSources; i++) {
            makerTokenAmountsBySource[i] = _sampleSellSource(
                sources[i],
                takerToken,
                makerToken,
                takerTokenAmounts
            );
        }
    }

    /// @dev Query native orders and sample buy quotes on multiple DEXes at once.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmountsBySource Taker amounts sold for each source at
    ///         each maker token amount. First indexed by source index, then sample
    ///         index.
    function sampleBuys(
        address[] memory sources,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[][] memory takerTokenAmountsBySource)
    {
        uint256 numSources = sources.length;
        takerTokenAmountsBySource = new uint256[][](numSources);
        for (uint256 i = 0; i < numSources; i++) {
            takerTokenAmountsBySource[i] = _sampleBuySource(
                sources[i],
                takerToken,
                makerToken,
                makerTokenAmounts
            );
        }
    }

    /// @dev Sample sell quotes from Kyber.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromKyberNetwork(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        address _takerToken = takerToken == _getWETHAddress() ? KYBER_ETH_ADDRESS : takerToken;
        address _makerToken = makerToken == _getWETHAddress() ? KYBER_ETH_ADDRESS : makerToken;
        uint256 takerTokenDecimals = _getTokenDecimals(takerToken);
        uint256 makerTokenDecimals = _getTokenDecimals(makerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (uint256 rate,) = _getKyberNetworkContract().getExpectedRate(
                _takerToken,
                _makerToken,
                takerTokenAmounts[i]
            );
            makerTokenAmounts[i] =
                rate *
                takerTokenAmounts[i] *
                10 ** makerTokenDecimals /
                10 ** takerTokenDecimals /
                10 ** 18;
        }
    }

    /// @dev Sample sell quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            makerTokenAmounts[i] = _getEth2DaiContract().getBuyAmount(
                makerToken,
                takerToken,
                takerTokenAmounts[i]
            );
        }
    }

    /// @dev Sample buy quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            takerTokenAmounts[i] = _getEth2DaiContract().getPayAmount(
                takerToken,
                makerToken,
                makerTokenAmounts[i]
            );
        }
    }

    /// @dev Sample sell quotes from Uniswap.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromUniswap(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        IUniswapExchangeQuotes takerTokenExchange = takerToken == _getWETHAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == _getWETHAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            if (makerToken == _getWETHAddress()) {
                makerTokenAmounts[i] = takerTokenExchange.getTokenToEthInputPrice(
                    takerTokenAmounts[i]
                );
            } else if (takerToken == _getWETHAddress()) {
                makerTokenAmounts[i] = makerTokenExchange.getEthToTokenInputPrice(
                    takerTokenAmounts[i]
                );
            } else {
                uint256 ethBought = takerTokenExchange.getTokenToEthInputPrice(
                    takerTokenAmounts[i]
                );
                makerTokenAmounts[i] = makerTokenExchange.getEthToTokenInputPrice(
                    ethBought
                );
            }
        }
    }

    /// @dev Sample buy quotes from Uniswap.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromUniswap(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        IUniswapExchangeQuotes takerTokenExchange = takerToken == _getWETHAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == _getWETHAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            if (makerToken == _getWETHAddress()) {
                takerTokenAmounts[i] = takerTokenExchange.getTokenToEthOutputPrice(
                    makerTokenAmounts[i]
                );
            } else if (takerToken == _getWETHAddress()) {
                takerTokenAmounts[i] = makerTokenExchange.getEthToTokenOutputPrice(
                    makerTokenAmounts[i]
                );
            } else {
                uint256 ethSold = makerTokenExchange.getEthToTokenOutputPrice(
                    makerTokenAmounts[i]
                );
                takerTokenAmounts[i] = takerTokenExchange.getTokenToEthOutputPrice(
                    ethSold
                );
            }
        }
    }

    /// @dev Overridable way to get token decimals.
    /// @param tokenAddress Address of the token.
    /// @return decimals The decimal places for the token.
    function _getTokenDecimals(address tokenAddress)
        internal
        view
        returns (uint8 decimals)
    {
        return LibERC20Token.decimals(tokenAddress);
    }

    /// @dev Samples a supported sell source, defined by its address.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function _sampleSellSource(
        address source,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        private
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        if (source == address(_getEth2DaiContract())) {
            return sampleSellsFromEth2Dai(takerToken, makerToken, takerTokenAmounts);
        }
        if (source == address(_getUniswapExchangeFactoryContract())) {
            return sampleSellsFromUniswap(takerToken, makerToken, takerTokenAmounts);
        }
        if (source == address(_getKyberNetworkContract())) {
            return sampleSellsFromKyberNetwork(takerToken, makerToken, takerTokenAmounts);
        }
        revert("UNSUPPORTED_SOURCE");
    }

    /// @dev Samples a supported buy source, defined by its address.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function _sampleBuySource(
        address source,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        private
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        if (source == address(_getEth2DaiContract())) {
            return sampleBuysFromEth2Dai(takerToken, makerToken, makerTokenAmounts);
        }
        if (source == address(_getUniswapExchangeFactoryContract())) {
            return sampleBuysFromUniswap(takerToken, makerToken, makerTokenAmounts);
        }
        revert("UNSUPPORTED_SOURCE");
    }

    /// @dev Retrive an existing Uniswap exchange contract.
    ///      Throws if the exchange does not exist.
    /// @param tokenAddress Address of the token contract.
    /// @return exchange `IUniswapExchangeQuotes` for the token.
    function _getUniswapExchange(address tokenAddress)
        private
        view
        returns (IUniswapExchangeQuotes exchange)
    {
        exchange = IUniswapExchangeQuotes(
            address(_getUniswapExchangeFactoryContract().getExchange(tokenAddress))
        );
        require(address(exchange) != address(0), "UNSUPPORTED_UNISWAP_EXCHANGE");
    }

    /// @dev Extract the token address from ERC20 proxy asset data.
    /// @param assetData ERC20 asset data.
    /// @return tokenAddress The decoded token address.
    function _assetDataToTokenAddress(bytes memory assetData)
        private
        pure
        returns (address tokenAddress)
    {
        require(assetData.length == 36, "INVALID_ASSET_DATA");
        bytes4 selector;
        assembly {
            selector := and(mload(add(assetData, 0x20)), 0xFFFFFFFF00000000000000000000000000000000000000000000000000000000)
            tokenAddress := mload(add(assetData, 0x24))
        }
        require(selector == ERC20_PROXY_ID, "UNSUPPORTED_ASSET_PROXY");
    }

    function _assertValidPair(address makerToken, address takerToken)
        private
        pure
    {
        require(makerToken != takerToken, "INVALID_TOKEN_PAIR");
    }
}
