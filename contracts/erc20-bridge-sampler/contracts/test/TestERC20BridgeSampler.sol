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
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../src/ERC20BridgeSampler.sol";
import "../src/IEth2Dai.sol";
import "../src/IKyberNetwork.sol";


library LibDeterministicQuotes {

    address private constant WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    uint256 private constant RATE_DENOMINATOR = 1 ether;
    uint256 private constant MIN_RATE = RATE_DENOMINATOR / 100;
    uint256 private constant MAX_RATE = 100 * RATE_DENOMINATOR;
    uint8 private constant MIN_DECIMALS = 4;
    uint8 private constant MAX_DECIMALS = 20;

    function getDeterministicSellQuote(
        bytes32 salt,
        address sellToken,
        address buyToken,
        uint256 sellAmount
    )
        internal
        pure
        returns (uint256 buyAmount)
    {
        uint256 sellBase = uint256(10) ** getDeterministicTokenDecimals(sellToken);
        uint256 buyBase = uint256(10) ** getDeterministicTokenDecimals(buyToken);
        uint256 rate = getDeterministicRate(salt, sellToken, buyToken);
        return sellAmount * rate * buyBase / sellBase / RATE_DENOMINATOR;
    }

    function getDeterministicBuyQuote(
        bytes32 salt,
        address sellToken,
        address buyToken,
        uint256 buyAmount
    )
        internal
        pure
        returns (uint256 sellAmount)
    {
        uint256 sellBase = uint256(10) ** getDeterministicTokenDecimals(sellToken);
        uint256 buyBase = uint256(10) ** getDeterministicTokenDecimals(buyToken);
        uint256 rate = getDeterministicRate(salt, sellToken, buyToken);
        return buyAmount * RATE_DENOMINATOR * sellBase / rate / buyBase;
    }

    function getDeterministicTokenDecimals(address token)
        internal
        pure
        returns (uint8 decimals)
    {
        if (token == WETH_ADDRESS) {
            return 18;
        }
        bytes32 seed = keccak256(abi.encodePacked(token));
        return uint8(uint256(seed) % (MAX_DECIMALS - MIN_DECIMALS)) + MIN_DECIMALS;
    }

    function getDeterministicRate(bytes32 salt, address sellToken, address buyToken)
        internal
        pure
        returns (uint256 rate)
    {
        bytes32 seed = keccak256(abi.encodePacked(salt, sellToken, buyToken));
        return uint256(seed) % (MAX_RATE - MIN_RATE) + MIN_RATE;
    }
}


contract TestERC20BridgeSamplerUniswapExchange is
    IUniswapExchangeQuotes,
    DeploymentConstants
{
    bytes32 constant private BASE_SALT = 0x1d6a6a0506b0b4a554b907a4c29d9f4674e461989d9c1921feb17b26716385ab;

    address public tokenAddress;
    bytes32 public salt;

    constructor(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
        salt = keccak256(abi.encodePacked(BASE_SALT, _tokenAddress));
    }

    // Deterministic `IUniswapExchangeQuotes.getEthToTokenInputPrice()`.
    function getEthToTokenInputPrice(
        uint256 ethSold
    )
        external
        view
        returns (uint256 tokensBought)
    {
        return LibDeterministicQuotes.getDeterministicSellQuote(
            salt,
            tokenAddress,
            WETH_ADDRESS,
            ethSold
        );
    }

    // Deterministic `IUniswapExchangeQuotes.getEthToTokenOutputPrice()`.
    function getEthToTokenOutputPrice(
        uint256 tokensBought
    )
        external
        view
        returns (uint256 ethSold)
    {
        return LibDeterministicQuotes.getDeterministicBuyQuote(
            salt,
            WETH_ADDRESS,
            tokenAddress,
            tokensBought
        );
    }

    // Deterministic `IUniswapExchangeQuotes.getTokenToEthInputPrice()`.
    function getTokenToEthInputPrice(
        uint256 tokensSold
    )
        external
        view
        returns (uint256 ethBought)
    {
        return LibDeterministicQuotes.getDeterministicSellQuote(
            salt,
            tokenAddress,
            WETH_ADDRESS,
            tokensSold
        );
    }

    // Deterministic `IUniswapExchangeQuotes.getTokenToEthOutputPrice()`.
    function getTokenToEthOutputPrice(
        uint256 ethBought
    )
        external
        view
        returns (uint256 tokensSold)
    {
        return LibDeterministicQuotes.getDeterministicBuyQuote(
            salt,
            WETH_ADDRESS,
            tokenAddress,
            ethBought
        );
    }
}


contract TestERC20BridgeSamplerKyberNetwork is
    IKyberNetwork,
    DeploymentConstants
{
    bytes32 constant private SALT = 0x0ff3ca9d46195c39f9a12afb74207b4970349fb3cfb1e459bbf170298d326bc7;
    address constant public ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // Deterministic `IKyberNetwork.getExpectedRate()`.
    function getExpectedRate(
        address fromToken,
        address toToken,
        uint256
    )
        external
        view
        returns (uint256 expectedRate, uint256)
    {
        fromToken = fromToken == ETH_ADDRESS ? WETH_ADDRESS : fromToken;
        toToken = toToken == ETH_ADDRESS ? WETH_ADDRESS : toToken;
        expectedRate = LibDeterministicQuotes.getDeterministicRate(
            SALT,
            fromToken,
            toToken
        );
    }
}


contract TestERC20BridgeSamplerEth2Dai is
    IEth2Dai
{
    bytes32 constant private SALT = 0xb713b61bb9bb2958a0f5d1534b21e94fc68c4c0c034b0902ed844f2f6cd1b4f7;

    // Deterministic `IEth2Dai.getBuyAmount()`.
    function getBuyAmount(
        address buyToken,
        address payToken,
        uint256 payAmount
    )
        external
        view
        returns (uint256 buyAmount)
    {
        return LibDeterministicQuotes.getDeterministicSellQuote(
            SALT,
            payToken,
            buyToken,
            payAmount
        );
    }

    // Deterministic `IEth2Dai.getPayAmount()`.
    function getPayAmount(
        address payToken,
        address buyToken,
        uint256 buyAmount
    )
        external
        view
        returns (uint256 payAmount)
    {
        return LibDeterministicQuotes.getDeterministicBuyQuote(
            SALT,
            payToken,
            buyToken,
            buyAmount
        );
    }
}


contract TestERC20BridgeSamplerUniswapExchangeFactory is
    IUniswapExchangeFactory
{
    mapping (address => IUniswapExchangeQuotes) private _exchangesByToken;

    // Creates Uniswap exchange contracts for tokens.
    function createTokenExchanges(address[] calldata tokenAddresses)
        external
    {
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            address tokenAddress = tokenAddresses[i];
            _exchangesByToken[tokenAddress] =
                new TestERC20BridgeSamplerUniswapExchange(tokenAddress);
        }
    }

    // `IUniswapExchangeFactory.getExchange()`.
    function getExchange(address tokenAddress)
        external
        view
        returns (address)
    {
        return address(_exchangesByToken[tokenAddress]);
    }
}


contract TestERC20BridgeSampler is
    ERC20BridgeSampler
{
    TestERC20BridgeSamplerUniswapExchangeFactory public uniswap;
    TestERC20BridgeSamplerEth2Dai public eth2Dai;
    TestERC20BridgeSamplerKyberNetwork public kyber;

    constructor() public {
        uniswap = new TestERC20BridgeSamplerUniswapExchangeFactory();
        eth2Dai = new TestERC20BridgeSamplerEth2Dai();
        kyber = new TestERC20BridgeSamplerKyberNetwork();
    }

    // Creates Uniswap exchange contracts for tokens.
    function createTokenExchanges(address[] calldata tokenAddresses)
        external
    {
        uniswap.createTokenExchanges(tokenAddresses);
    }

    // `IExchange.getOrderInfo()`, overridden to return deterministic order infos.
    function getOrderInfo(LibOrder.Order memory order)
        public
        pure
        returns (LibOrder.OrderInfo memory orderInfo)
    {
        // The order hash is just the hash of the salt.
        bytes32 orderHash = keccak256(abi.encode(order.salt));
        // Everything else is derived from the hash.
        orderInfo.orderHash = orderHash;
        orderInfo.orderStatus = uint8(uint256(orderHash) % uint8(-1));
        orderInfo.orderTakerAssetFilledAmount = uint256(orderHash) % order.takerAssetAmount;
    }

    // Overriden to return deterministic decimals.
    function _getTokenDecimals(address tokenAddress)
        internal
        view
        returns (uint8 decimals)
    {
        return LibDeterministicQuotes.getDeterministicTokenDecimals(tokenAddress);
    }

    // Overriden to point to a this contract.
    function _getExchangeContract()
        internal
        view
        returns (IExchange zeroex)
    {
        return IExchange(address(this));
    }

    // Overriden to point to a custom contract.
    function _getEth2DaiContract()
        internal
        view
        returns (IEth2Dai eth2dai_)
    {
        return eth2Dai;
    }

    // Overriden to point to a custom contract.
    function _getUniswapExchangeFactoryContract()
        internal
        view
        returns (IUniswapExchangeFactory uniswap_)
    {
        return uniswap;
    }

    // Overriden to point to a custom contract.
    function _getKyberNetworkContract()
        internal
        view
        returns (IKyberNetwork kyber_)
    {
        return kyber;
    }
}
