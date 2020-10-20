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

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "./DeploymentConstants.sol";
import "./interfaces/IUniswapV2Router01.sol";


contract SushiSwapSampler is
    DeploymentConstants
{
    /// @dev Gas limit for SushiSwap calls.
    uint256 constant private SUSHISWAP_CALL_GAS = 150e3; // 150k

    /// @dev Sample sell quotes from SushiSwap.
    /// @param router Router to look up tokens and amounts
    /// @param path Token route. Should be takerToken -> makerToken
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromSushiSwap(
        address router,
        address[] memory path,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            try
                IUniswapV2Router01(router).getAmountsOut
                    {gas: SUSHISWAP_CALL_GAS}
                    (takerTokenAmounts[i], path)
                returns (uint256[] memory amounts)
            {
                makerTokenAmounts[i] = amounts[path.length - 1];
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }

    /// @dev Sample buy quotes from SushiSwap
    /// @param router Router to look up tokens and amounts
    /// @param path Token route. Should be takerToken -> makerToken.
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromSushiSwap(
        address router,
        address[] memory path,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            try
                IUniswapV2Router01(router).getAmountsIn
                    {gas: SUSHISWAP_CALL_GAS}
                    (makerTokenAmounts[i], path)
                returns (uint256[] memory amounts)
            {
                takerTokenAmounts[i] = amounts[0];
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }
}
