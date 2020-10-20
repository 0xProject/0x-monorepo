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
import "./interfaces/IEth2Dai.sol";
import "./SamplerUtils.sol";


contract Eth2DaiSampler is
    DeploymentConstants,
    SamplerUtils
{
    /// @dev Base gas limit for Eth2Dai calls.
    uint256 constant private ETH2DAI_CALL_GAS = 1000e3; // 1m

    /// @dev Sample sell quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                _getEth2DaiAddress().staticcall.gas(ETH2DAI_CALL_GAS)(
                    abi.encodeWithSelector(
                        IEth2Dai(0).getBuyAmount.selector,
                        makerToken,
                        takerToken,
                        takerTokenAmounts[i]
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                buyAmount = abi.decode(resultData, (uint256));
            }
            // Exit early if the amount is too high for the source to serve
            if (buyAmount == 0) {
                break;
            }
            makerTokenAmounts[i] = buyAmount;
        }
    }

    /// @dev Sample buy quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                _getEth2DaiAddress().staticcall.gas(ETH2DAI_CALL_GAS)(
                    abi.encodeWithSelector(
                        IEth2Dai(0).getPayAmount.selector,
                        takerToken,
                        makerToken,
                        makerTokenAmounts[i]
                    ));
            uint256 sellAmount = 0;
            if (didSucceed) {
                sellAmount = abi.decode(resultData, (uint256));
            }
            // Exit early if the amount is too high for the source to serve
            if (sellAmount == 0) {
                break;
            }
            takerTokenAmounts[i] = sellAmount;
        }
    }
}
