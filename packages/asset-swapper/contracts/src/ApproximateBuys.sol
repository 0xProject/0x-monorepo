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

import "@0x/contracts-utils/contracts/src/v06/LibMathV06.sol";


contract ApproximateBuys {

    /// @dev Information computing buy quotes for sources that do not have native
    ///      buy quote support.
    struct ApproximateBuyQuoteOpts {
        // Arbitrary maker token data to pass to `getSellQuoteCallback`.
        bytes makerTokenData;
        // Arbitrary taker token data to pass to `getSellQuoteCallback`.
        bytes takerTokenData;
        // Callback to retrieve a sell quote.
        function (bytes memory, bytes memory, uint256)
            internal
            view
            returns (uint256) getSellQuoteCallback;
    }

    uint256 private constant ONE_HUNDED_PERCENT_BPS = 1e4;
    /// @dev Maximum approximate (positive) error rate when approximating a buy quote.
    uint256 private constant APPROXIMATE_BUY_TARGET_EPSILON_BPS = 0.0005e4;
    /// @dev Maximum iterations to perform when approximating a buy quote.
    uint256 private constant APPROXIMATE_BUY_MAX_ITERATIONS = 5;

    function _sampleApproximateBuys(
        ApproximateBuyQuoteOpts memory opts,
        uint256[] memory makerTokenAmounts
    )
        internal
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        takerTokenAmounts = new uint256[](makerTokenAmounts.length);
        if (makerTokenAmounts.length == 0) {
            return takerTokenAmounts;
        }

        uint256 sellAmount = opts.getSellQuoteCallback(
            opts.makerTokenData,
            opts.takerTokenData,
            makerTokenAmounts[0]
        );
        if (sellAmount == 0) {
            return takerTokenAmounts;
        }

        uint256 buyAmount = opts.getSellQuoteCallback(
            opts.takerTokenData,
            opts.makerTokenData,
            sellAmount
        );
        if (buyAmount == 0) {
            return takerTokenAmounts;
        }

        for (uint256 i = 0; i < makerTokenAmounts.length; i++) {
            for (uint256 iter = 0; iter < APPROXIMATE_BUY_MAX_ITERATIONS; iter++) {
                // adjustedSellAmount = previousSellAmount * (target/actual) * JUMP_MULTIPLIER
                sellAmount = _safeGetPartialAmountCeil(
                    makerTokenAmounts[i],
                    buyAmount,
                    sellAmount
                );
                if (sellAmount == 0) {
                    break;
                }
                sellAmount = _safeGetPartialAmountCeil(
                    (ONE_HUNDED_PERCENT_BPS + APPROXIMATE_BUY_TARGET_EPSILON_BPS),
                    ONE_HUNDED_PERCENT_BPS,
                    sellAmount
                );
                if (sellAmount == 0) {
                    break;
                }
                uint256 _buyAmount = opts.getSellQuoteCallback(
                    opts.takerTokenData,
                    opts.makerTokenData,
                    sellAmount
                );
                if (_buyAmount == 0) {
                    break;
                }
                // We re-use buyAmount next iteration, only assign if it is
                // non zero
                buyAmount = _buyAmount;
                // If we've reached our goal, exit early
                if (buyAmount >= makerTokenAmounts[i]) {
                    uint256 eps =
                        (buyAmount - makerTokenAmounts[i]) * ONE_HUNDED_PERCENT_BPS /
                        makerTokenAmounts[i];
                    if (eps <= APPROXIMATE_BUY_TARGET_EPSILON_BPS) {
                        break;
                    }
                }
            }
            // We do our best to close in on the requested amount, but we can either over buy or under buy and exit
            // if we hit a max iteration limit
            // We scale the sell amount to get the approximate target
            takerTokenAmounts[i] = _safeGetPartialAmountCeil(
                makerTokenAmounts[i],
                buyAmount,
                sellAmount
            );
        }
    }

    function _safeGetPartialAmountCeil(
        uint256 numerator,
        uint256 denominator,
        uint256 target
    )
        internal
        view
        returns (uint256 partialAmount)
    {
        if (numerator == 0 || target == 0 || denominator == 0) return 0;
        uint256 c = numerator * target;
        if (c / numerator != target) return 0;
        return (c + (denominator - 1)) / denominator;
    }
}
