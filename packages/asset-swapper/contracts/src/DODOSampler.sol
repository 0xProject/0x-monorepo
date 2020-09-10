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
import "./DODOHelper.sol";
import "./SamplerUtils.sol";


interface IDODOZoo {

    function getDODO(address baseToken, address quoteToken) external view returns (address);
}

contract DODOSampler is
    DODOHelper,
    DeploymentConstants,
    SamplerUtils
{

    /// @dev Gas limit for DODO calls.
    uint256 constant private DODO_CALL_GAS = 300e3; // 300k

    /// @dev Sample sell quotes from DODO.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
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

        pool = IDODOZoo(0x3A97247DF274a17C59A3bd12735ea3FcDFb49950).getDODO(takerToken, makerToken);
        // If pool exists we have the correct Base/Quote
        if (pool != address(0)) {
            sellBase = true;
            for (uint256 i = 0; i < numSamples; i++) {
                (bool didSucceed, bytes memory resultData) =
                    pool.staticcall.gas(DODO_CALL_GAS)(
                        abi.encodeWithSelector(
                            IDODO(0).querySellBaseToken.selector,
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
        } else {
            pool = IDODOZoo(0x3A97247DF274a17C59A3bd12735ea3FcDFb49950).getDODO(makerToken, takerToken);
            // No pool either direction
            if (address(pool) == address(0)) {
                return (sellBase, pool, makerTokenAmounts);
            }
            sellBase = false;
            // We are Selling the Quote, need to do some hackery
            for (uint256 i = 0; i < numSamples; i++) {
                uint256 buyAmount = this.querySellQuoteToken(pool, takerTokenAmounts[i]);
                //(bool didSucceed, bytes memory resultData) =
                //    address(this).staticcall.gas(DODO_CALL_GAS)(
                //        abi.encodeWithSelector(
                //            DODOHelper(0).querySellQuoteToken.selector,
                //            pool,
                //            takerTokenAmounts[i]
                //        ));
                //uint256 buyAmount = 0;
                //if (didSucceed) {
                //    buyAmount = abi.decode(resultData, (uint256));
                //}
                // Exit early if the amount is too high for the source to serve
                if (buyAmount == 0) {
                    break;
                }
                makerTokenAmounts[i] = buyAmount;
            }
        }
    }

    /// @dev Sample buy quotes from DODO.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromDODO(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        return takerTokenAmounts;
    }

}
