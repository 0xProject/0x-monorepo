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

import "./interfaces/IBalancer.sol";


contract BalancerSampler {

    /// @dev Base gas limit for Balancer calls.
    uint256 constant private BALANCER_CALL_GAS = 300e3; // 300k

    // Balancer math constants
    // https://github.com/balancer-labs/balancer-core/blob/master/contracts/BConst.sol
    uint256 constant private BONE = 10 ** 18;
    uint256 constant private MAX_IN_RATIO = BONE / 2;
    uint256 constant private MAX_OUT_RATIO = (BONE / 3) + 1 wei;

    struct BalancerState {
        uint256 takerTokenBalance;
        uint256 makerTokenBalance;
        uint256 takerTokenWeight;
        uint256 makerTokenWeight;
        uint256 swapFee;
    }

    /// @dev Sample sell quotes from Balancer.
    /// @param poolAddress Address of the Balancer pool to query.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromBalancer(
        address poolAddress,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        IBalancer pool = IBalancer(poolAddress);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        if (!pool.isBound(takerToken) || !pool.isBound(makerToken)) {
            return makerTokenAmounts;
        }

        BalancerState memory poolState;
        poolState.takerTokenBalance = pool.getBalance(takerToken);
        poolState.makerTokenBalance = pool.getBalance(makerToken);
        poolState.takerTokenWeight = pool.getDenormalizedWeight(takerToken);
        poolState.makerTokenWeight = pool.getDenormalizedWeight(makerToken);
        poolState.swapFee = pool.getSwapFee();

        for (uint256 i = 0; i < numSamples; i++) {
            // Handles this revert scenario:
            // https://github.com/balancer-labs/balancer-core/blob/master/contracts/BPool.sol#L443
            if (takerTokenAmounts[i] > _bmul(poolState.takerTokenBalance, MAX_IN_RATIO)) {
                break;
            }
            try
                pool.calcOutGivenIn
                    {gas: BALANCER_CALL_GAS}
                    (
                        poolState.takerTokenBalance,
                        poolState.takerTokenWeight,
                        poolState.makerTokenBalance,
                        poolState.makerTokenWeight,
                        takerTokenAmounts[i],
                        poolState.swapFee
                    )
                returns (uint256 amount)
            {
                makerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }

    /// @dev Sample buy quotes from Balancer.
    /// @param poolAddress Address of the Balancer pool to query.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromBalancer(
        address poolAddress,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        IBalancer pool = IBalancer(poolAddress);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        if (!pool.isBound(takerToken) || !pool.isBound(makerToken)) {
            return takerTokenAmounts;
        }

        BalancerState memory poolState;
        poolState.takerTokenBalance = pool.getBalance(takerToken);
        poolState.makerTokenBalance = pool.getBalance(makerToken);
        poolState.takerTokenWeight = pool.getDenormalizedWeight(takerToken);
        poolState.makerTokenWeight = pool.getDenormalizedWeight(makerToken);
        poolState.swapFee = pool.getSwapFee();

        for (uint256 i = 0; i < numSamples; i++) {
            // Handles this revert scenario:
            // https://github.com/balancer-labs/balancer-core/blob/master/contracts/BPool.sol#L505
            if (makerTokenAmounts[i] > _bmul(poolState.makerTokenBalance, MAX_OUT_RATIO)) {
                break;
            }
            try
                pool.calcInGivenOut
                    {gas: BALANCER_CALL_GAS}
                    (
                        poolState.takerTokenBalance,
                        poolState.takerTokenWeight,
                        poolState.makerTokenBalance,
                        poolState.makerTokenWeight,
                        makerTokenAmounts[i],
                        poolState.swapFee
                    )
                returns (uint256 amount)
            {
                takerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }

    /// @dev Hacked version of Balancer's `bmul` function, returning 0 instead
    ///      of reverting.
    ///      https://github.com/balancer-labs/balancer-core/blob/master/contracts/BNum.sol#L63-L73
    /// @param a The first operand.
    /// @param b The second operand.
    /// @param c The result of the multiplication, or 0 if `bmul` would've reverted.
    function _bmul(uint256 a, uint256 b)
        private
        pure
        returns (uint256 c)
    {
        uint c0 = a * b;
        if (a != 0 && c0 / a != b) {
            return 0;
        }
        uint c1 = c0 + (BONE / 2);
        if (c1 < c0) {
            return 0;
        }
        uint c2 = c1 / BONE;
        return c2;
    }
}
