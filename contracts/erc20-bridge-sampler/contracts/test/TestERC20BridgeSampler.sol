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
import "../src/IDevUtils.sol";
import "../src/IKyberNetworkProxy.sol";
import "../src/IUniswapV2Router01.sol";


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


contract FailTrigger {

    // Give this address a balance to force operations to fail.
    address payable constant public FAILURE_ADDRESS = 0xe9dB8717BC5DFB20aaf538b4a5a02B7791FF430C;

    // Funds `FAILURE_ADDRESS`.
    function enableFailTrigger() external payable {
        FAILURE_ADDRESS.transfer(msg.value);
    }

    function _revertIfShouldFail() internal view {
        if (FAILURE_ADDRESS.balance != 0) {
            revert("FAIL_TRIGGERED");
        }
    }
}


contract TestERC20BridgeSamplerUniswapExchange is
    IUniswapExchangeQuotes,
    DeploymentConstants,
    FailTrigger
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
        _revertIfShouldFail();
        return LibDeterministicQuotes.getDeterministicSellQuote(
            salt,
            tokenAddress,
            _getWethAddress(),
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
        _revertIfShouldFail();
        return LibDeterministicQuotes.getDeterministicBuyQuote(
            salt,
            _getWethAddress(),
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
        _revertIfShouldFail();
        return LibDeterministicQuotes.getDeterministicSellQuote(
            salt,
            tokenAddress,
            _getWethAddress(),
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
        _revertIfShouldFail();
        return LibDeterministicQuotes.getDeterministicBuyQuote(
            salt,
            _getWethAddress(),
            tokenAddress,
            ethBought
        );
    }
}


contract TestERC20BridgeSamplerUniswapV2Router01 is
    IUniswapV2Router01,
    DeploymentConstants,
    FailTrigger
{
    bytes32 constant private SALT = 0xadc7fcb33c735913b8635927e66896b356a53a912ab2ceff929e60a04b53b3c1;

    // Deterministic `IUniswapV2Router01.getAmountsOut()`.
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "PATH_TOO_SHORT");
        _revertIfShouldFail();
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 0; i < path.length - 1; ++i) {
            amounts[i + 1] = LibDeterministicQuotes.getDeterministicSellQuote(
                SALT,
                path[i],
                path[i + 1],
                amounts[i]
            );
        }
    }

    // Deterministic `IUniswapV2Router01.getAmountsInt()`.
    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts)
    {
        require(path.length >= 2, "PATH_TOO_SHORT");
        _revertIfShouldFail();
        amounts = new uint256[](path.length);
        amounts[0] = amountOut;
        for (uint256 i = 0; i < path.length - 1; ++i) {
            amounts[i + 1] = LibDeterministicQuotes.getDeterministicBuyQuote(
                SALT,
                path[i],
                path[i + 1],
                amounts[i]
            );
        }
    }
}


contract TestERC20BridgeSamplerKyberNetwork is
    IKyberNetwork,
    DeploymentConstants,
    FailTrigger
{
    bytes32 constant private SALT = 0x0ff3ca9d46195c39f9a12afb74207b4970349fb3cfb1e459bbf170298d326bc7;
    address constant public ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    function kyberNetworkContract()
        external
        view
        returns (address)
    {
        return address(this);
    }

    // IKyberNetwork not exposed via IKyberNetworkProxy
    function searchBestRate(
        address fromToken,
        address toToken,
        uint256 fromAmount,
        bool  // usePermissionless
    )
        external
        view
        returns (address reserve, uint256 expectedRate)
    {
        (expectedRate, ) = this.getExpectedRate(fromToken, toToken, fromAmount);
        return (address(this), expectedRate);
    }

    // Deterministic `IKyberNetworkProxy.getExpectedRate()`.
    function getExpectedRate(
        address fromToken,
        address toToken,
        uint256
    )
        external
        view
        returns (uint256 expectedRate, uint256)
    {
        _revertIfShouldFail();
        fromToken = fromToken == ETH_ADDRESS ? _getWethAddress() : fromToken;
        toToken = toToken == ETH_ADDRESS ? _getWethAddress() : toToken;
        expectedRate = LibDeterministicQuotes.getDeterministicRate(
            SALT,
            fromToken,
            toToken
        );
    }
}


contract TestERC20BridgeSamplerEth2Dai is
    IEth2Dai,
    FailTrigger
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
        _revertIfShouldFail();
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
        _revertIfShouldFail();
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
    ERC20BridgeSampler,
    FailTrigger
{
    TestERC20BridgeSamplerUniswapExchangeFactory public uniswap;
    TestERC20BridgeSamplerUniswapV2Router01 public uniswapV2Router;
    TestERC20BridgeSamplerEth2Dai public eth2Dai;
    TestERC20BridgeSamplerKyberNetwork public kyber;

    uint8 private constant MAX_ORDER_STATUS = uint8(LibOrder.OrderStatus.CANCELLED) + 1;

    constructor() public ERC20BridgeSampler(address(this)) {
        uniswap = new TestERC20BridgeSamplerUniswapExchangeFactory();
        uniswapV2Router = new TestERC20BridgeSamplerUniswapV2Router01();
        eth2Dai = new TestERC20BridgeSamplerEth2Dai();
        kyber = new TestERC20BridgeSamplerKyberNetwork();
    }

    // Creates Uniswap exchange contracts for tokens.
    function createTokenExchanges(address[] calldata tokenAddresses)
        external
    {
        uniswap.createTokenExchanges(tokenAddresses);
    }

    // `IDevUtils.getOrderRelevantState()`, overridden to return deterministic
    // states.
    function getOrderRelevantState(
        LibOrder.Order memory order,
        bytes memory
    )
        public
        pure
        returns (
            LibOrder.OrderInfo memory orderInfo,
            uint256 fillableTakerAssetAmount,
            bool isValidSignature
        )
    {
        // The order hash is just the hash of the salt.
        bytes32 orderHash = keccak256(abi.encode(order.salt));
        // Everything else is derived from the hash.
        orderInfo.orderHash = orderHash;
        if (uint256(orderHash) % 100 > 90) {
            orderInfo.orderStatus = LibOrder.OrderStatus.FULLY_FILLED;
        } else {
            orderInfo.orderStatus = LibOrder.OrderStatus.FILLABLE;
        }
        orderInfo.orderTakerAssetFilledAmount = uint256(orderHash) % order.takerAssetAmount;
        fillableTakerAssetAmount =
            order.takerAssetAmount - orderInfo.orderTakerAssetFilledAmount;
        isValidSignature = uint256(orderHash) % 2 == 1;
    }

    // Overriden to return deterministic decimals.
    function _getTokenDecimals(address tokenAddress)
        internal
        view
        returns (uint8 decimals)
    {
        return LibDeterministicQuotes.getDeterministicTokenDecimals(tokenAddress);
    }

    // Overriden to point to a custom contract.
    function _getEth2DaiAddress()
        internal
        view
        returns (address eth2daiAddress)
    {
        return address(eth2Dai);
    }

    // Overriden to point to a custom contract.
    function _getUniswapExchangeFactoryAddress()
        internal
        view
        returns (address uniswapAddress)
    {
        return address(uniswap);
    }

    // Overriden to point to a custom contract.
    function _getUniswapV2Router01Address()
        internal
        view
        returns (address uniswapV2RouterAddress)
    {
        return address(uniswapV2Router);
    }

    // Overriden to point to a custom contract.
    function _getKyberNetworkProxyAddress()
        internal
        view
        returns (address kyberAddress)
    {
        return address(kyber);
    }
}
