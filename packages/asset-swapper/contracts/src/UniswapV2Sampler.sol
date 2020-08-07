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

import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "./interfaces/IUniswapV2Router01.sol";
import "./SamplerUtils.sol";


contract UniswapV2Sampler is
    DeploymentConstants,
    SamplerUtils
{
    /// @dev Gas limit for UniswapV2 calls.
    uint256 constant private UNISWAPV2_CALL_GAS = 150e3; // 150k

    /// @dev Sample sell quotes from UniswapV2.
    /// @param path Token route. Should be takerToken -> makerToken
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromUniswapV2(
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
            (bool didSucceed, bytes memory resultData) =
                _getUniswapV2Router01Address().staticcall.gas(UNISWAPV2_CALL_GAS)(
                    abi.encodeWithSelector(
                        IUniswapV2Router01(0).getAmountsOut.selector,
                        takerTokenAmounts[i],
                        path
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                // solhint-disable-next-line indent
                buyAmount = abi.decode(resultData, (uint256[]))[path.length - 1];
            } else {
                break;
            }
            makerTokenAmounts[i] = buyAmount;
        }
    }

    /// @dev Sample buy quotes from UniswapV2.
    /// @param path Token route. Should be takerToken -> makerToken.
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromUniswapV2(
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
            (bool didSucceed, bytes memory resultData) =
                _getUniswapV2Router01Address().staticcall.gas(UNISWAPV2_CALL_GAS)(
                    abi.encodeWithSelector(
                        IUniswapV2Router01(0).getAmountsIn.selector,
                        makerTokenAmounts[i],
                        path
                    ));
            uint256 sellAmount = 0;
            if (didSucceed) {
                // solhint-disable-next-line indent
                sellAmount = abi.decode(resultData, (uint256[]))[0];
            } else {
                break;
            }
            takerTokenAmounts[i] = sellAmount;
        }
    }
}
