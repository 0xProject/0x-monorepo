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

    uint256 private constant MAX_RATE = 10 ** 20;
    uint256 private constant MIN_RATE = 10 ** 16;

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
        uint256 sellBase = 10 ** getDeterministicTokenDecimals(sellToken);
        uint256 buyBase = 10 ** getDeterministicTokenDecimals(buyToken);
        uint256 rate = _getDeterministicRate(salt, sellToken, buyToken);
        return sellAmount * rate * buyBase / sellBase / 10 ** 18;
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
        uint256 sellBase = 10 ** getDeterministicTokenDecimals(sellToken);
        uint256 buyBase = 10 ** getDeterministicTokenDecimals(buyToken);
        uint256 rate = _getDeterministicRate(salt, sellToken, buyToken);
        return buyAmount * 10 ** 18 * sellBase / rate / buyBase;
    }

    function getDeterministicTokenDecimals(address token)
        internal
        pure
        returns (uint8 decimals)
    {
        bytes32 seed = keccak256(abi.encodePacked(token));
        return uint8(uint256(seed) % 18) + 6;
    }

    function _getDeterministicRate(bytes32 salt, address sellToken, address buyToken)
        private
        pure
        returns (uint256 rate)
    {
        bytes32 seed = keccak256(abi.encodePacked(salt, sellToken, buyToken));
        return MIN_RATE + uint256(seed) % MAX_RATE;
    }
}


contract TestERC20BridgeSamplerUniswapExchange is
    IUniswapExchangeQuotes
{
    bytes32 constant private BASE_SALT = 0x1d6a6a0506b0b4a554b907a4c29d9f4674e461989d9c1921feb17b26716385ab;

    address public tokenAddress;
    bytes32 public salt;
    address private _wethAddress;

    constructor(address _tokenAddress) public {
        _wethAddress = msg.sender;
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
            _wethAddress,
            tokenAddress,
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
            _wethAddress,
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
            _wethAddress,
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
            tokenAddress,
            _wethAddress,
            ethBought
        );
    }
}


contract TestERC20BridgeSampler is
    ERC20BridgeSampler
{
    bytes32 constant private KYBER_SALT = 0x0ff3ca9d46195c39f9a12afb74207b4970349fb3cfb1e459bbf170298d326bc7;
    bytes32 constant private ETH2DAI_SALT = 0xb713b61bb9bb2958a0f5d1534b21e94fc68c4c0c034b0902ed844f2f6cd1b4f7;

    mapping (address => IUniswapExchangeQuotes) private _uniswapExchangesByToken;

    // Creates Uniswap exchange contracts for tokens.
    function createTokenExchanges(address[] calldata tokenAddresses)
        external
    {
        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            address tokenAddress = tokenAddresses[i];
            _uniswapExchangesByToken[tokenAddress] =
                new TestERC20BridgeSamplerUniswapExchange(tokenAddress);
        }
    }

    // `IERC20.decimals()` (for WETH).
    function decimals()
        external
        view
        returns (uint8 decimalPlaces)
    {
        return 18;
    }

    // Deterministic `IKyberNetwork.getExpectedRate()`.
    function getExpectedRate(
        address fromToken,
        address toToken,
        uint256 fromAmount
    )
        external
        view
        returns (uint256 expectedRate, uint256 slippageRate)
    {
        uint256 quote = LibDeterministicQuotes.getDeterministicSellQuote(
            KYBER_SALT,
            fromToken,
            toToken,
            fromAmount
        );
        expectedRate =
            10 ** 18 *
            (quote / LibDeterministicQuotes.getDeterministicTokenDecimals(toToken)) /
            (fromAmount * LibDeterministicQuotes.getDeterministicTokenDecimals(fromToken));
    }

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
            ETH2DAI_SALT,
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
            ETH2DAI_SALT,
            payToken,
            buyToken,
            buyAmount
        );
    }

    // `IUniswapExchangeFactory.getExchange()`.
    function getExchange(address tokenAddress)
        external
        view
        returns (address)
    {
        return address(_uniswapExchangesByToken[tokenAddress]);
    }

    // `IExchange.getOrderInfo()`, overridden to return deterministic order infos.
    function getOrderInfo(LibOrder.Order memory order)
        public
        view
        returns (LibOrder.OrderInfo memory orderInfo)
    {
        // The order hash is just the hash of the salt.
        bytes32 orderHash = keccak256(abi.encode(order.salt));
        // Everything else is derived from the hash.
        orderInfo.orderHash = orderHash;
        orderInfo.orderStatus = uint8(uint256(orderHash) % uint8(-1));
        orderInfo.orderTakerAssetFilledAmount = uint256(orderHash) % order.takerAssetAmount;
    }

    // Overriden to point to this contract.
    function _getExchangeContract()
        internal
        view
        returns (IExchange zeroex)
    {
        return IExchange(address(this));
    }

    // Overriden to point to this contract.
    function _getEth2DaiContract()
        internal
        view
        returns (IEth2Dai eth2dai)
    {
        return IEth2Dai(address(this));
    }

    // Overriden to point to this contract.
    function _getUniswapExchangeFactoryContract()
        internal
        view
        returns (IUniswapExchangeFactory uniswap)
    {
        return IUniswapExchangeFactory(address(this));
    }

    // Overriden to point to this contract.
    function _getKyberNetworkContract()
        internal
        view
        returns (IKyberNetwork kyber)
    {
        return IKyberNetwork(address(this));
    }

    // Overriden to point to this contract.
    function _getWETHAddress()
        internal
        view
        returns (address weth)
    {
        return address(this);
    }
}
