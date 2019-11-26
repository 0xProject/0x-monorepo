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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IUniswapExchange.sol";
import "@0x/contracts-erc20/contracts/test/DummyERC20Token.sol";


contract TestUniswapExchange is
    IUniswapExchange
{
    DummyERC20Token public token;
    uint256 private _excessBuyAmount;

    constructor(address _tokenAddress) public {
        token = DummyERC20Token(_tokenAddress);
    }

    // solhint-disable no-empty-blocks
    /// @dev Used to receive ETH for testing.
    function topUpEth()
        external
        payable
    {}

    function setExcessBuyAmount(uint256 amount)
        external
    {
        _excessBuyAmount = amount;
    }

    function ethToTokenTransferInput(
        uint256 minTokensBought,
        uint256, /* deadline */
        address recipient
    )
        external
        payable
        returns (uint256 tokensBought)
    {
        token.mint(minTokensBought + _excessBuyAmount);
        token.transfer(recipient, minTokensBought + _excessBuyAmount);
        return minTokensBought + _excessBuyAmount;
    }

    function tokenToEthSwapInput(
        uint256 tokensSold,
        uint256 minEthBought,
        uint256 /* deadline */
    )
        external
        returns (uint256 ethBought)
    {
        token.transferFrom(
            msg.sender,
            address(this),
            tokensSold
        );
        msg.sender.transfer(minEthBought + _excessBuyAmount);
        return minEthBought + _excessBuyAmount;
    }

    function tokenToTokenTransferInput(
        uint256 tokensSold,
        uint256 minTokensBought,
        uint256, /* minEthBought */
        uint256, /* deadline */
        address recipient,
        address toTokenAddress
    )
        external
        returns (uint256 tokensBought)
    {
        token.transferFrom(
            msg.sender,
            address(this),
            tokensSold
        );
        DummyERC20Token toToken = DummyERC20Token(toTokenAddress);
        toToken.mint(minTokensBought + _excessBuyAmount);
        toToken.transfer(recipient, minTokensBought + _excessBuyAmount);
        return minTokensBought + _excessBuyAmount;
    }

    function toTokenAddress()
        external
        view
        returns (address _tokenAddress)
    {
        return address(token);
    }
}
