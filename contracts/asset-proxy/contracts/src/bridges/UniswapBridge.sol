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

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IWallet.sol";
import "../interfaces/IUniswap.sol";
import "./ERC20Bridge.sol";


// solhint-disable space-after-comma
contract UniswaBridge is
    ERC20Bridge,
    IWallet
{
    bytes4 private constant LEGACY_WALLET_MAGIC_VALUE = 0xb0671381;
    /* Mainnet addresses */
    address constant public UNISWAP_EXCHANGE_FACTORY_ADDRESS = address(0);
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the `fromTokenAddress`
    ///      token encoded in the bridge data.
    /// @param toTokenAddress The token to buy and transfer to `to`.
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoded "from" token address.
    /// @return success The magic bytes if successful.
    function withdrawTo(
        address toTokenAddress,
        address /* from */,
        address to,
        uint256 amount,
        bytes calldata bridgeData,
    )
        external
        returns (bytes4 success)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));

        // Just transfer the tokens if they're the same.
        if (fromTokenAddress == toTokenAddress) {
            IERC20Token(fromToken).transfer(to, amount);
            return BRIDGE_SUCCESS;
        }

        // Get the exchange for the token pair.
        IUniswapExchange exchange = _getUniswapExchangeForTokenPair(
            fromTokenAddress,
            toTokenAddress
        );
        // Get our balance of `fromTokenAddress` token.
        uint256 fromTokenBalance = IERC20Token(fromToken).balanceOf(address(this));

        // Convert from WETH to a token.
        if (fromTokenAddress == address(weth)) {
            // Unwrap the WETH.
            _getWethContract().withdraw(fromTokenBalance);
            // Buy as much of `toTokenAddress` token with ETH as possible and
            // transfer it to `to`.
            exchange.ethToTokenTransferInput.value(fromTokenBalance)(
                // No minimum buy amount.
                0,
                // Expires after this block.
                block.timestamp,
                // Recipient is `to`.
                to
            );

        // Convert from a token to WETH.
        } else if (toTokenAddress == address(weth)) {
            // Buy as much ETH with `toTokenAddress` token as possible.
            uint256 ethBought = exchange.tokenToEthSwapInput(
                // Sell all tokens we hold.
                fromTokenBalance,
                // Expires after this block.
                block.timestamp,
                // Recipient is `to`.
                to
            );
            // Wrap the ETH.
            _getWethContract().deposit.value(ethBought)();
            // Transfer the WETH to `to`.
            IERC20Token(toTokenAddress).transfer(to, ethBought);

        // Convert from one token to another.
        } else {
            // Buy as much `toTokenAddress` token with `fromTokenAddress` token
            // and transfer it to `to`.
            exchange.tokenToTokenTransferInput(
                // Sell all tokens we hold.
                fromTokenBalance,
                // No minimum buy amount.
                0,
                // No minimum intermediate ETH buy amount.
                0,
                // Expires after this block.
                block.timestamp,
                // Recipient is `to`.
                to,
                // Convert to `toTokenAddress`.
                toTokenAddress
            );
        }
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Success bytes, always.
    function isValidSignature(
        bytes32,
        bytes calldata
    )
        external
        view
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }

    /// @dev Overridable way to get the weth contract.
    /// @return token The WETH contract.
    function _getWethContract()
        internal
        view
        returns (IERC20Token token)
    {
        return IERC20Token(WETH_ADDRESS);
    }

    /// @dev Overridable way to get the uniswap exchange factory contract.
    /// @return factory The exchange factory contract.
    function _getUniswapExchangeFactoryContract()
        internal
        view
        returns (IUniswapExchangeFactory factory)
    {
        return IUniswapExchangeFactory(ETH2DAI_ADDRESS);
    }

    /// @dev Retrieves the uniswap exchange contract for a given token pair.
    /// @return exchange The exchange contract for the token pair.
    function _getUniswapExchangeForTokenPair(
        address fromTokenAddress,
        address toTokenAddress
    )
        private
        view
        returns (IUniswapExchange exchange)
    {
        // Whichever isn't WETH is the exchange token.
        address wethAddress = address(_getWethContract());
        if (fromTokenAddress != wethAddress) {
            return _getUniswapExchangeForToken(fromTokenAddress);
        }
        return _getUniswapExchangeForToken(toTokenAddress);
    }

    /// @dev Retrieves the uniswap exchange contract for a given token.
    /// @return exchange The exchange contract for the token.
    function _getUniswapExchangeForToken(address tokenAddress)
        private
        view
        returns (IUniswapExchange exchange)
    {
        address exchangeAddress = _getUniswapExchangeFactoryContract()
            .getExchange(tokenAddress);
        require(exchangeAddress != address(0), "NO_UNISWAP_EXCHANGE_FOR_TOKEN");
        return IUniswapExchange(exchangeAddress);
    }
}
