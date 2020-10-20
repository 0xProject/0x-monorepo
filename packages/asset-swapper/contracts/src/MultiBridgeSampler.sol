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

import "./interfaces/IMultiBridge.sol";


contract MultiBridgeSampler {

    /// @dev Default gas limit for multibridge calls.
    uint256 constant private DEFAULT_CALL_GAS = 400e3; // 400k

    /// @dev Sample sell quotes from MultiBridge.
    /// @param multibridge Address of the MultiBridge contract.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param intermediateToken The address of the intermediate token to
    ///        use in an indirect route.
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromMultiBridge(
        address multibridge,
        address takerToken,
        address intermediateToken,
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

        // If no address provided, return all zeros.
        if (multibridge == address(0)) {
            return makerTokenAmounts;
        }

        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                multibridge.staticcall.gas(DEFAULT_CALL_GAS)(
                    abi.encodeWithSelector(
                        IMultiBridge(0).getSellQuote.selector,
                        takerToken,
                        intermediateToken,
                        makerToken,
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
}
