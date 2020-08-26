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

import "./interfaces/IBalancer.sol";


contract BalancerSampler {

    /// @dev Base gas limit for Balancer calls.
    uint256 constant private BALANCER_CALL_GAS = 300e3; // 300k

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
            (bool didSucceed, bytes memory resultData) =
                poolAddress.staticcall.gas(BALANCER_CALL_GAS)(
                    abi.encodeWithSelector(
                        pool.calcOutGivenIn.selector,
                        poolState.takerTokenBalance,
                        poolState.takerTokenWeight,
                        poolState.makerTokenBalance,
                        poolState.makerTokenWeight,
                        takerTokenAmounts[i],
                        poolState.swapFee
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                buyAmount = abi.decode(resultData, (uint256));
            } else {
                break;
            }
            makerTokenAmounts[i] = buyAmount;
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
            (bool didSucceed, bytes memory resultData) =
                poolAddress.staticcall.gas(BALANCER_CALL_GAS)(
                    abi.encodeWithSelector(
                        pool.calcInGivenOut.selector,
                        poolState.takerTokenBalance,
                        poolState.takerTokenWeight,
                        poolState.makerTokenBalance,
                        poolState.makerTokenWeight,
                        makerTokenAmounts[i],
                        poolState.swapFee
                    ));
            uint256 sellAmount = 0;
            if (didSucceed) {
                sellAmount = abi.decode(resultData, (uint256));
            } else {
                break;
            }
            takerTokenAmounts[i] = sellAmount;
        }
    }
}
