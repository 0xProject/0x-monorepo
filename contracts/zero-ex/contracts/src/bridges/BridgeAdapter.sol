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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IEtherTokenV06.sol";

/*
    Balancer
*/
interface IBalancerPool {
    /// @dev Sell `tokenAmountIn` of `tokenIn` and receive `tokenOut`.
    /// @param tokenIn The token being sold
    /// @param tokenAmountIn The amount of `tokenIn` to sell.
    /// @param tokenOut The token being bought.
    /// @param minAmountOut The minimum amount of `tokenOut` to buy.
    /// @param maxPrice The maximum value for `spotPriceAfter`.
    /// @return tokenAmountOut The amount of `tokenOut` bought.
    /// @return spotPriceAfter The new marginal spot price of the given
    ///         token pair for this pool.
    function swapExactAmountIn(
        address tokenIn,
        uint tokenAmountIn,
        address tokenOut,
        uint minAmountOut,
        uint maxPrice
    ) external returns (uint tokenAmountOut, uint spotPriceAfter);
}

/*
    Eth2Dai
*/
interface IEth2Dai {

    /// @dev Sell `sellAmount` of `fromToken` token and receive `toToken` token.
    /// @param fromToken The token being sold.
    /// @param sellAmount The amount of `fromToken` token being sold.
    /// @param toToken The token being bought.
    /// @param minFillAmount Minimum amount of `toToken` token to buy.
    /// @return fillAmount Amount of `toToken` bought.
    function sellAllAmount(
        address fromToken,
        uint256 sellAmount,
        address toToken,
        uint256 minFillAmount
    )
        external
        returns (uint256 fillAmount);
}

/*
    Kyber
*/
interface IKyberNetworkProxy {

    /// @dev Sells `sellTokenAddress` tokens for `buyTokenAddress` tokens.
    /// @param sellTokenAddress Token to sell.
    /// @param sellAmount Amount of tokens to sell.
    /// @param buyTokenAddress Token to buy.
    /// @param recipientAddress Address to send bought tokens to.
    /// @param maxBuyTokenAmount A limit on the amount of tokens to buy.
    /// @param minConversionRate The minimal conversion rate. If actual rate
    ///        is lower, trade is canceled.
    /// @param walletId The wallet ID to send part of the fees
    /// @return boughtAmount Amount of tokens bought.
    function trade(
        address sellTokenAddress,
        uint256 sellAmount,
        address buyTokenAddress,
        address payable recipientAddress,
        uint256 maxBuyTokenAmount,
        uint256 minConversionRate,
        address walletId
    )
        external
        payable
        returns(uint256 boughtAmount);
}

/*
    Uniswap
*/
interface IUniswapExchangeFactory {

    /// @dev Get the exchange for a token.
    /// @param tokenAddress The address of the token contract.
    function getExchange(address tokenAddress)
        external
        view
        returns (address);
}

interface IUniswapExchange {

    /// @dev Buys at least `minTokensBought` tokens with ETH and transfer them
    ///      to `recipient`.
    /// @param minTokensBought The minimum number of tokens to buy.
    /// @param deadline Time when this order expires.
    /// @param recipient Who to transfer the tokens to.
    /// @return tokensBought Amount of tokens bought.
    function ethToTokenTransferInput(
        uint256 minTokensBought,
        uint256 deadline,
        address recipient
    )
        external
        payable
        returns (uint256 tokensBought);

    /// @dev Buys at least `minEthBought` ETH with tokens.
    /// @param tokensSold Amount of tokens to sell.
    /// @param minEthBought The minimum amount of ETH to buy.
    /// @param deadline Time when this order expires.
    /// @return ethBought Amount of tokens bought.
    function tokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 deadline
    )
        external
        returns (uint256 ethBought);

    /// @dev Buys at least `minTokensBought` tokens with the exchange token
    ///      and transfer them to `recipient`.
    /// @param minTokensBought The minimum number of tokens to buy.
    /// @param minEthBought The minimum amount of intermediate ETH to buy.
    /// @param deadline Time when this order expires.
    /// @param recipient Who to transfer the tokens to.
    /// @param toTokenAddress The token being bought.
    /// @return tokensBought Amount of tokens bought.
    function tokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256 minEthBought,
        uint256 deadline,
        address recipient,
        address toTokenAddress
    )
        external
        returns (uint256 tokensBought);
}

/*
    UniswapV2
*/
interface IUniswapV2Router02 {

    /// @dev Swaps an exact amount of input tokens for as many output tokens as possible, along the route determined by the path.
    ///      The first element of path is the input token, the last is the output token, and any intermediate elements represent
    ///      intermediate pairs to trade through (if, for example, a direct pair does not exist).
    /// @param amountIn The amount of input tokens to send.
    /// @param amountOutMin The minimum amount of output tokens that must be received for the transaction not to revert.
    /// @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
    /// @param to Recipient of the output tokens.
    /// @param deadline Unix timestamp after which the transaction will revert.
    /// @return amounts The input token amount and all subsequent output token amounts.
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);
}

/*
    0x Bridge
*/
interface IERC20Bridge {

    /// @dev Transfers `amount` of the ERC20 `tokenAddress` from `from` to `to`.
    /// @param tokenAddress The address of the ERC20 token to transfer.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    /// @param bridgeData Arbitrary asset data needed by the bridge contract.
    /// @return success The magic bytes `0xdc1600f3` if successful.
    function bridgeTransferFrom(
        address tokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success);
}


contract BridgeAdapter
{
    using LibERC20TokenV06 for IERC20TokenV06;

    /// @dev Mainnet address of the WETH contract.
    IEtherTokenV06 constant private WETH = IEtherTokenV06(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    IEth2Dai constant private ETH2DAI = IEth2Dai(0x794e6e91555438aFc3ccF1c5076A74F42133d08D);
    /// @dev Mainnet address of the KyberNetworkProxy contract.
    IKyberNetworkProxy constant private KYBER_NETWORK_PROXY = IKyberNetworkProxy(0x9AAb3f75489902f3a48495025729a0AF77d4b11e);
    /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    IUniswapExchangeFactory constant private UNISWAP_EXCHANGE_FACTORY = IUniswapExchangeFactory(0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95);
    /// @dev Mainnet address of the `UniswapV2Router02` contract.
    IUniswapV2Router02 constant private UNISWAP_V2_ROUTER = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    struct CurveBridgeData {
        address curveAddress;
        bytes4 exchangeFunctionSelector;
        address fromTokenAddress;
        int128 fromCoinIdx;
        int128 toCoinIdx;
    }

    // solhint-disable
    /// @dev Allows this contract to receive ether.
    receive() external payable {}
    // solhint-enable

    function trade(
        bytes calldata makerAssetData,
        address fromTokenAddress,
        uint256 sellAmount
    )
        external
        returns (uint256 boughtAmount)
    {
        (
            address toTokenAddress,
            address bridgeAddress,
            bytes memory bridgeData
        ) = abi.decode(
            makerAssetData[4:],
            (address, address, bytes)
        );
        require(bridgeAddress != address(this), "INVALID_BRIDGE_ADDRESS");
        // toTokenAddress is stored in the makerAssetData
        if (bridgeAddress == 0x1796Cd592d19E3bcd744fbB025BB61A6D8cb2c09) {
            // CurveBridge
            boughtAmount = _tradeCurve(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x36691C4F426Eb8F42f150ebdE43069A31cB080AD) {
            // Uniswap bridge
            boughtAmount = _tradeUniswap(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48) {
            // Uniswap v2
            boughtAmount = _tradeUniswapV2(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4) {
            // Balancer
            boughtAmount = _tradeBalancer(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x1c29670F7a77f1052d30813A0a4f632C78A02610) {
            // Kyber
            boughtAmount = _tradeKyber(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else if (bridgeAddress == 0x991C745401d5b5e469B8c3e2cb02C748f08754f1) {
            // Eth2Dai
            boughtAmount = _tradeEth2Dai(
                toTokenAddress,
                sellAmount,
                bridgeData
            );
        } else {
            uint256 balanceBefore = IERC20TokenV06(toTokenAddress).compatBalanceOf(address(this));
            // Trade the good old fashioned way
            IERC20TokenV06(fromTokenAddress).compatTransfer(
                bridgeAddress,
                sellAmount
            );
            IERC20Bridge(bridgeAddress).bridgeTransferFrom(
                toTokenAddress,
                bridgeAddress,
                address(this),
                1, // amount to transfer back from the bridge
                bridgeData
            );
            boughtAmount = IERC20TokenV06(toTokenAddress).compatBalanceOf(address(this)) - balanceBefore;
        }
        // TODO event, maybe idk
        return boughtAmount;
    }

    // Balancer
    function _tradeBalancer(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data.
        (address fromTokenAddress, address poolAddress) = abi.decode(
            bridgeData,
            (address, address)
        );
        IERC20TokenV06(fromTokenAddress).approveIfBelow(
            poolAddress,
            sellAmount
        );
        // Sell all of this contract's `fromTokenAddress` token balance.
        (boughtAmount,) = IBalancerPool(poolAddress).swapExactAmountIn(
            fromTokenAddress, // tokenIn
            sellAmount,       // tokenAmountIn
            toTokenAddress,   // tokenOut
            1,                // minAmountOut
            uint256(-1)       // maxPrice
        );
        return boughtAmount;
    }

    // Curve
    function _tradeCurve(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the Curve metadata.
        CurveBridgeData memory data = abi.decode(bridgeData, (CurveBridgeData));
        IERC20TokenV06(data.fromTokenAddress).approveIfBelow(data.curveAddress, sellAmount);
        {
            (bool didSucceed, bytes memory resultData) =
                data.curveAddress.call(abi.encodeWithSelector(
                    data.exchangeFunctionSelector,
                    data.fromCoinIdx,
                    data.toCoinIdx,
                    // dx
                    sellAmount,
                    // min dy
                    1
                ));
            if (!didSucceed) {
                assembly { revert(add(resultData, 32), mload(resultData)) }
            }
        }
        return IERC20TokenV06(toTokenAddress).compatBalanceOf(address(this));
    }

    // Eth2Dai
    function _tradeEth2Dai(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        IERC20TokenV06(fromTokenAddress).approveIfBelow(
            address(ETH2DAI),
            sellAmount
        );
        // Try to sell all of this contract's `fromTokenAddress` token balance.
        boughtAmount = ETH2DAI.sellAllAmount(
            fromTokenAddress,
            sellAmount,
            toTokenAddress,
            1
        );
        return boughtAmount;
    }

    // Kyber
    function _tradeKyber(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        address fromTokenAddress = abi.decode(bridgeData, (address));
        uint256 payableAmount;

        if (fromTokenAddress != address(WETH)) {
            // If the input token is not WETH, grant an allowance to the exchange
            // to spend them.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(KYBER_NETWORK_PROXY),
                sellAmount
            );
        } else {
            // If the input token is WETH, unwrap it and attach it to the call.
            fromTokenAddress = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
            payableAmount = sellAmount;
            WETH.withdraw(payableAmount);
        }
        bool isToTokenWeth = toTokenAddress == address(WETH);

        // Try to sell all of this contract's input token balance through
        // `KyberNetworkProxy.trade()`.
        boughtAmount = KYBER_NETWORK_PROXY.trade{ value: payableAmount }(
            // Input token.
            fromTokenAddress,
            // Sell amount.
            sellAmount,
            // Output token.
            isToTokenWeth ? 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE : toTokenAddress,
            // Transfer to this contract
            address(uint160(address(this))),
            // Buy as much as possible.
            uint256(-1),
            // Compute the minimum conversion rate, which is expressed in units with
            // 18 decimal places.
            1,
            // No affiliate address.
            address(0)
        );
        if (isToTokenWeth) {
            WETH.deposit{ value: boughtAmount }();
        }
        return boughtAmount;
    }

    // Uniswap
    function _tradeUniswap(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));

        // Get the exchange for the token pair.
        IUniswapExchange exchange = _getUniswapExchangeForTokenPair(
            fromTokenAddress,
            toTokenAddress
        );

        // Convert from WETH to a token.
        if (fromTokenAddress == address(WETH)) {
            // Unwrap the WETH.
            WETH.withdraw(sellAmount);
            // Buy as much of `toTokenAddress` token with ETH as possible
            boughtAmount = exchange.ethToTokenTransferInput{ value: sellAmount }(
                // Minimum buy amount.
                1,
                // Expires after this block.
                block.timestamp,
                // Recipient is `this`.
                address(this)
            );

        // Convert from a token to WETH.
        } else if (toTokenAddress == address(WETH)) {
            // Grant the exchange an allowance.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(exchange),
                sellAmount
            );
            // Buy as much ETH with `fromTokenAddress` token as possible.
            boughtAmount = exchange.tokenToEthSwapInput(
                // Sell all tokens we hold.
                sellAmount,
                // Minimum buy amount.
                1,
                // Expires after this block.
                block.timestamp
            );
            // Wrap the ETH.
            WETH.deposit{ value: boughtAmount }();
        // Convert from one token to another.
        } else {
            // Grant the exchange an allowance.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(exchange),
                sellAmount
            );
            // Buy as much `toTokenAddress` token with `fromTokenAddress` token
            boughtAmount = exchange.tokenToTokenTransferInput(
                // Sell all tokens we hold.
                sellAmount,
                // Minimum buy amount.
                1,
                // Must buy at least 1 intermediate ETH.
                1,
                // Expires after this block.
                block.timestamp,
                // Recipient is `this`.
                address(this),
                // Convert to `toTokenAddress`.
                toTokenAddress
            );
        }

        return boughtAmount;
    }

    function _tradeUniswapV2(
        address toTokenAddress,
        uint256 sellAmount,
        bytes memory bridgeData
    )
        internal
        returns (uint256)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        // solhint-disable indent
        address[] memory path = abi.decode(bridgeData, (address[]));
        // solhint-enable indent

        require(path.length >= 2, "UniswapV2Bridge/PATH_LENGTH_MUST_BE_AT_LEAST_TWO");
        require(path[path.length - 1] == toTokenAddress, "UniswapV2Bridge/LAST_ELEMENT_OF_PATH_MUST_MATCH_OUTPUT_TOKEN");
        // Grant the Uniswap router an allowance.
        IERC20TokenV06(path[0]).approveIfBelow(
            address(UNISWAP_V2_ROUTER),
            sellAmount
        );

        uint[] memory amounts = UNISWAP_V2_ROUTER.swapExactTokensForTokens(
             // Sell all tokens we hold.
            sellAmount,
             // Minimum buy amount.
            1,
            // Convert `fromTokenAddress` to `toTokenAddress`.
            path,
            // Recipient is `this`.
            address(this),
            // Expires after this block.
            block.timestamp
        );
        return amounts[amounts.length-1];
    }


    /// @dev Retrieves the uniswap exchange for a given token pair.
    ///      In the case of a WETH-token exchange, this will be the non-WETH token.
    ///      In th ecase of a token-token exchange, this will be the first token.
    /// @param fromTokenAddress The address of the token we are converting from.
    /// @param toTokenAddress The address of the token we are converting to.
    /// @return exchange The uniswap exchange.
    function _getUniswapExchangeForTokenPair(
        address fromTokenAddress,
        address toTokenAddress
    )
        private
        view
        returns (IUniswapExchange exchange)
    {
        address exchangeTokenAddress = fromTokenAddress;
        // Whichever isn't WETH is the exchange token.
        if (fromTokenAddress == address(WETH)) {
            exchangeTokenAddress = toTokenAddress;
        }
        exchange = IUniswapExchange(UNISWAP_EXCHANGE_FACTORY.getExchange(exchangeTokenAddress));
        require(address(exchange) != address(0), "NO_UNISWAP_EXCHANGE_FOR_TOKEN");
        return exchange;
    }
}
