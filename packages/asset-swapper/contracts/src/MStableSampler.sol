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
import "./interfaces/IMStable.sol";
import "./ApproximateBuys.sol";
import "./SamplerUtils.sol";


contract MStableSampler is
    DeploymentConstants,
    SamplerUtils,
    ApproximateBuys
{
    /// @dev Default gas limit for mStable calls.
    uint256 constant private DEFAULT_CALL_GAS = 800e3; // 800k

    /// @dev Sample sell quotes from the mStable mUSD contract
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromMStable(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        // Initialize array of maker token amounts.
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);

        for (uint256 i = 0; i < numSamples; i++) {
            try
                IMStable(_getMUsdAddress()).getSwapOutput
                    {gas: DEFAULT_CALL_GAS}
                    (takerToken, makerToken, takerTokenAmounts[i])
                returns (bool, string memory, uint256 amount)
            {
                makerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }

    /// @dev Sample buy quotes from MStable mUSD contract
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromMStable(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        return _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                makerTokenData: abi.encode(makerToken),
                takerTokenData: abi.encode(takerToken),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromMStable
            }),
            makerTokenAmounts
        );
    }

    function _sampleSellForApproximateBuyFromMStable(
        bytes memory takerTokenData,
        bytes memory makerTokenData,
        uint256 sellAmount
    )
        private
        view
        returns (uint256 buyAmount)
    {
        (address takerToken) =
            abi.decode(takerTokenData, (address));
        (address makerToken) =
            abi.decode(makerTokenData, (address));
        try
            this.sampleSellsFromMStable
                (takerToken, makerToken, _toSingleValueArray(sellAmount))
            returns (uint256[] memory amounts)
        {
            return amounts[0];
        } catch (bytes memory) {
            // Swallow failures, leaving all results as zero.
            return 0;
        }
    }
}
