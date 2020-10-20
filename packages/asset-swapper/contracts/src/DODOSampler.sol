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
import "./ApproximateBuys.sol";
import "./SamplerUtils.sol";


interface IDODOZoo {
    function getDODO(address baseToken, address quoteToken) external view returns (address);
}

interface IDODOHelper {
    function querySellQuoteToken(address dodo, uint256 amount) external view returns (uint256);
}

interface IDODO {
    function querySellBaseToken(uint256 amount) external view returns (uint256);
    function _TRADE_ALLOWED_() external view returns (bool);
}

contract DODOSampler is
    DeploymentConstants,
    SamplerUtils,
    ApproximateBuys
{

    /// @dev Gas limit for DODO calls.
    uint256 constant private DODO_CALL_GAS = 300e3; // 300k

    /// @dev Sample sell quotes from DODO.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return sellBase whether the bridge needs to sell the base token
    /// @return pool the DODO pool address
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromDODO(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (bool sellBase, address pool, uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);

        pool = IDODOZoo(_getDODORegistryAddress()).getDODO(takerToken, makerToken);
        address baseToken;
        // If pool exists we have the correct order of Base/Quote
        if (pool != address(0)) {
            baseToken = takerToken;
            sellBase = true;
        } else {
            pool = IDODOZoo(_getDODORegistryAddress()).getDODO(makerToken, takerToken);
            // No pool either direction
            if (address(pool) == address(0)) {
                return (sellBase, pool, makerTokenAmounts);
            }
            baseToken = makerToken;
            sellBase = false;
        }

        // DODO Pool has been disabled
        if (!IDODO(pool)._TRADE_ALLOWED_()) {
            return (sellBase, pool, makerTokenAmounts);
        }

        for (uint256 i = 0; i < numSamples; i++) {
            uint256 buyAmount = _sampleSellForApproximateBuyFromDODO(
                abi.encode(takerToken, pool, baseToken), // taker token data
                abi.encode(makerToken, pool, baseToken), // maker token data
                takerTokenAmounts[i]
            );
            // Exit early if the amount is too high for the source to serve
            if (buyAmount == 0) {
                break;
            }
            makerTokenAmounts[i] = buyAmount;
        }
    }

    /// @dev Sample buy quotes from DODO.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample.
    /// @return sellBase whether the bridge needs to sell the base token
    /// @return pool the DODO pool address
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromDODO(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (bool sellBase, address pool, uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);

        // Pool is BASE/QUOTE
        // Look up the pool from the taker/maker combination
        pool = IDODOZoo(_getDODORegistryAddress()).getDODO(takerToken, makerToken);
        address baseToken;
        // If pool exists we have the correct order of Base/Quote
        if (pool != address(0)) {
            baseToken = takerToken;
            sellBase = true;
        } else {
            // Look up the pool from the maker/taker combination
            pool = IDODOZoo(_getDODORegistryAddress()).getDODO(makerToken, takerToken);
            // No pool either direction
            if (address(pool) == address(0)) {
                return (sellBase, pool, takerTokenAmounts);
            }
            baseToken = makerToken;
            sellBase = false;
        }

        // DODO Pool has been disabled
        if (!IDODO(pool)._TRADE_ALLOWED_()) {
            return (sellBase, pool, takerTokenAmounts);
        }

        takerTokenAmounts = _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                makerTokenData: abi.encode(makerToken, pool, baseToken),
                takerTokenData: abi.encode(takerToken, pool, baseToken),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromDODO
            }),
            makerTokenAmounts
        );
    }

    function _sampleSellForApproximateBuyFromDODO(
        bytes memory takerTokenData,
        bytes memory /* makerTokenData */,
        uint256 sellAmount
    )
        private
        view
        returns (uint256)
    {
        (address takerToken, address pool, address baseToken) = abi.decode(
            takerTokenData,
            (address, address, address)
        );

        // We will get called to sell both the taker token and also to sell the maker token
        if (takerToken == baseToken) {
            // If base token then use the original query on the pool
            try
                IDODO(pool).querySellBaseToken
                    {gas: DODO_CALL_GAS}
                    (sellAmount)
                returns (uint256 amount)
            {
                return amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                return 0;
            }
        } else {
            // If quote token then use helper, this is less accurate
            try
                IDODOHelper(_getDODOHelperAddress()).querySellQuoteToken
                    {gas: DODO_CALL_GAS}
                    (pool, sellAmount)
                returns (uint256 amount)
            {
                return amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                return 0;
            }
        }
    }

}
