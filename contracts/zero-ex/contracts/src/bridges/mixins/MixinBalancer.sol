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

contract MixinBalancer {

    using LibERC20TokenV06 for IERC20TokenV06;

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
}
