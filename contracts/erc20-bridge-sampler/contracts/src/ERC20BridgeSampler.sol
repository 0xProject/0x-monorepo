pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IUniswapExchangeFactory.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "./IERC20BridgeSampler.sol";
import "./IExchange.sol";
import "./IEth2Dai.sol";
import "./IKyberNetwork.sol";
import "./IUniswapExchangeQuotes.sol";


contract ERC20BridgeSampler is
    IERC20BridgeSampler
{
    bytes4 constant internal ERC20_PROXY_ID = bytes4(keccak256("ERC20Token(address)"));
    address constant public EXCHANGE_ADDRESS = 0x080bf510FCbF18b91105470639e9561022937712; // V2
    address constant public ETH2DAI_ADDRESS = 0x39755357759cE0d7f32dC8dC45414CCa409AE24e;
    address constant public UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;
    address constant public KYBER_NETWORK_PROXY_ADDRESS = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant public KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev Query native orders and sample sell quotes on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return orderInfos `OrderInfo`s for each order in `orders`.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleSells(
        IExchange.Order[] memory orders,
        address[] memory sources,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (
            IExchange.OrderInfo[] memory orderInfos,
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
        IExchange.Order[] memory orders,
        address[] memory sources,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (
            IExchange.OrderInfo[] memory orderInfos,
            uint256[][] memory makerTokenAmountsBySource
        )
    {
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
    function queryOrders(IExchange.Order[] memory orders)
        public
        view
        returns (IExchange.OrderInfo[] memory orderInfos)
    {
        uint256 numOrders = orders.length;
        orderInfos = new IExchange.OrderInfo[](numOrders);
        for (uint256 i = 0; i < numOrders; i++) {
            orderInfos[i] = IExchange(EXCHANGE_ADDRESS).getOrderInfo(orders[i]);
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
    function sampleSellFromKyberNetwork(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        address _takerToken = takerToken == WETH_ADDRESS ? KYBER_ETH_ADDRESS : takerToken;
        address _makerToken = makerToken == WETH_ADDRESS ? KYBER_ETH_ADDRESS : makerToken;
        uint256 takerTokenDecimals = LibERC20Token.decimals(takerToken);
        uint256 makerTokenDecimals = LibERC20Token.decimals(makerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (uint256 rate,) = IKyberNetwork(KYBER_NETWORK_PROXY_ADDRESS).getExpectedRate(
                _takerToken,
                _makerToken,
                takerTokenAmounts[i]
            );
            makerTokenAmounts[i] =
                rate *
                takerTokenAmounts[i] *
                makerTokenDecimals /
                (10 ** 18 * takerTokenDecimals);
        }
    }

    /// @dev Sample sell quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            makerTokenAmounts[i] = IEth2Dai(ETH2DAI_ADDRESS).getBuyAmount(
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
    function sampleBuyFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            takerTokenAmounts[i] = IEth2Dai(ETH2DAI_ADDRESS).getPayAmount(
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
    function sampleSellFromUniswap(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        IUniswapExchangeQuotes takerTokenExchange = takerToken == WETH_ADDRESS ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == WETH_ADDRESS ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            if (makerToken == WETH_ADDRESS) {
                makerTokenAmounts[i] = takerTokenExchange.getTokenToEthInputPrice(
                    takerTokenAmounts[i]
                );
            } else if (takerToken == WETH_ADDRESS) {
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
    function sampleBuyFromUniswap(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        IUniswapExchangeQuotes takerTokenExchange = takerToken == WETH_ADDRESS ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == WETH_ADDRESS ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            if (makerToken == WETH_ADDRESS) {
                takerTokenAmounts[i] = takerTokenExchange.getTokenToEthOutputPrice(
                    makerTokenAmounts[i]
                );
            } else if (takerToken == WETH_ADDRESS) {
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
        if (source == ETH2DAI_ADDRESS) {
            return sampleSellFromEth2Dai(takerToken, makerToken, takerTokenAmounts);
        }
        if (source == UNISWAP_EXCHANGE_FACTORY_ADDRESS) {
            return sampleSellFromUniswap(takerToken, makerToken, takerTokenAmounts);
        }
        if (source == KYBER_NETWORK_PROXY_ADDRESS) {
            return sampleSellFromKyberNetwork(takerToken, makerToken, takerTokenAmounts);
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
        if (source == ETH2DAI_ADDRESS) {
            return sampleBuyFromEth2Dai(takerToken, makerToken, makerTokenAmounts);
        }
        if (source == UNISWAP_EXCHANGE_FACTORY_ADDRESS) {
            return sampleBuyFromUniswap(takerToken, makerToken, makerTokenAmounts);
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
            address(
                IUniswapExchangeFactory(UNISWAP_EXCHANGE_FACTORY_ADDRESS)
                    .getExchange(tokenAddress)
            )
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
}
