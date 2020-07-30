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

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";

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

interface IEtherToken
{
    function deposit()
        external
        payable;

    function withdraw(uint256 amount)
        external;
}

contract UniswapBridge
{

    using LibERC20TokenV06 for IERC20TokenV06;

    // Struct to hold `bridgeTransferFrom()` local variables in memory and to avoid
    // stack overflows.
    struct TransferState {
        IUniswapExchange exchange;
        uint256 fromTokenBalance;
        IEtherToken weth;
        uint256 boughtAmount;
    }

    /// @dev Mainnet address of the WETH contract.
    address constant private WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Mainnet address of the `UniswapExchangeFactory` contract.
    address constant private UNISWAP_EXCHANGE_FACTORY_ADDRESS = 0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95;

    // solhint-disable
    /// @dev Allows this contract to receive ether.
    receive() external payable {}
    // solhint-enable

    function trade(
        address toTokenAddress,
        uint256 sellAmount,
        bytes calldata bridgeData
    )
        external
        returns (uint256)
    {
        // State memory object to avoid stack overflows.
        TransferState memory state;
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));

        // Get the exchange for the token pair.
        state.exchange = _getUniswapExchangeForTokenPair(
            fromTokenAddress,
            toTokenAddress
        );

        // Get the weth contract.
        state.weth = IEtherToken(WETH_ADDRESS);

        // Convert from WETH to a token.
        if (fromTokenAddress == address(state.weth)) {
            // Unwrap the WETH.
            state.weth.withdraw(sellAmount);
            // Buy as much of `toTokenAddress` token with ETH as possible and
            // transfer it to `to`.
            state.boughtAmount = state.exchange.ethToTokenTransferInput{ value: sellAmount }(
                // Minimum buy amount.
                1,
                // Expires after this block.
                block.timestamp,
                // Recipient is `this`.
                address(this)
            );

        // Convert from a token to WETH.
        } else if (toTokenAddress == address(state.weth)) {
            // Grant the exchange an allowance.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(state.exchange),
                sellAmount
            );
            // Buy as much ETH with `fromTokenAddress` token as possible.
            state.boughtAmount = state.exchange.tokenToEthSwapInput(
                // Sell all tokens we hold.
                sellAmount,
                // Minimum buy amount.
                1,
                // Expires after this block.
                block.timestamp
            );
            // Wrap the ETH.
            state.weth.deposit.value(state.boughtAmount)();
        // Convert from one token to another.
        } else {
            // Grant the exchange an allowance.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(state.exchange),
                sellAmount
            );
            // Buy as much `toTokenAddress` token with `fromTokenAddress` token
            // and transfer it to `to`.
            state.boughtAmount = state.exchange.tokenToTokenTransferInput(
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

        return state.boughtAmount;
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
        if (fromTokenAddress == WETH_ADDRESS) {
            exchangeTokenAddress = toTokenAddress;
        }
        exchange = IUniswapExchange(
            IUniswapExchangeFactory(UNISWAP_EXCHANGE_FACTORY_ADDRESS)
            .getExchange(exchangeTokenAddress)
        );
        require(address(exchange) != address(0), "NO_UNISWAP_EXCHANGE_FOR_TOKEN");
        return exchange;
    }
}
