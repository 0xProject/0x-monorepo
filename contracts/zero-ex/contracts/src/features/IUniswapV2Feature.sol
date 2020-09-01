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

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";


/// @dev Feature for directly interacting with Uniswap V2
interface IUniswapV2Feature {

    function sellToUniswapV2(
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        address recipient,
    )
        external
        payable
        returns (uint256 outputTokenAmount);

    function buyFromUniswapV2(
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 maxInputTokenAmount,
        uint256 outputTokenAmount,
        address recipient,
    )
        external
        payable
        returns (uint256 inputTokenAmount);
}
