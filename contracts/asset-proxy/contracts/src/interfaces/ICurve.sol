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


// solhint-disable func-name-mixedcase
interface ICurve {

    /// @dev Sell `sellAmount` of `fromToken` token and receive `toToken` token.
    ///      This function exists on later versions of Curve (USDC/DAI/USDT)
    /// @param i The token index being sold.
    /// @param j The token index being bought.
    /// @param sellAmount The amount of token being bought.
    /// @param minBuyAmount The minimum buy amount of the token being bought.
    function exchange_underlying(
        int128 i,
        int128 j,
        uint256 sellAmount,
        uint256 minBuyAmount
    )
        external;

    /// @dev Get the amount of `toToken` by selling `sellAmount` of `fromToken`
    /// @param i The token index being sold.
    /// @param j The token index being bought.
    /// @param sellAmount The amount of token being bought.
    function get_dy_underlying(
        int128 i,
        int128 j,
        uint256 sellAmount
    )
        external
        returns (uint256 dy);

    /// @dev Get the amount of `fromToken` by buying `buyAmount` of `toToken`
    /// @param i The token index being sold.
    /// @param j The token index being bought.
    /// @param buyAmount The amount of token being bought.
    function get_dx_underlying(
        int128 i,
        int128 j,
        uint256 buyAmount
    )
        external
        returns (uint256 dx);

    /// @dev Get the underlying token address from the token index
    /// @param i The token index.
    function underlying_coins(
        int128 i
    )
        external
        returns (address tokenAddress);
}
