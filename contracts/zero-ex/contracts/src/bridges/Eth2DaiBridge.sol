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


contract Eth2DaiBridge
{

    using LibERC20TokenV06 for IERC20TokenV06;

    /// @dev Mainnet address of the Eth2Dai `MatchingMarket` contract.
    address constant private ETH2DAI_ADDRESS = 0x794e6e91555438aFc3ccF1c5076A74F42133d08D;

    function trade(
        address toTokenAddress,
        uint256 sellAmount,
        bytes calldata bridgeData
    )
        external
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));
        IEth2Dai exchange = IEth2Dai(ETH2DAI_ADDRESS);
        // Grant an allowance to the exchange to spend `fromTokenAddress` token.
        IERC20TokenV06(fromTokenAddress).approveIfBelow(
            address(exchange),
            sellAmount
        );
        // Try to sell all of this contract's `fromTokenAddress` token balance.
        uint256 boughtAmount = exchange.sellAllAmount(
            fromTokenAddress,
            sellAmount,
            toTokenAddress,
            1
        );
        return boughtAmount;
    }
}
