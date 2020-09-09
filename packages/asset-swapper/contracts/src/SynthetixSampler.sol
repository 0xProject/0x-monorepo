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
import "./interfaces/ISynthetix.sol";


contract SynthetixSampler is
    DeploymentConstants
{
    /// @dev Gas limit for Synthetix calls.
    uint256 constant private SYNTHETIX_CALL_GAS = 300e3; // 300k

    /// @dev Sample sell quotes from Synthetix.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromSynthetix(
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (bytes32 takerCurrencyKey, bytes32 makerCurrencyKey, uint256[] memory makerTokenAmounts)
    {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);

        takerCurrencyKey = _getCurrencyKey(takerToken);
        makerCurrencyKey = _getCurrencyKey(makerToken);
        if (makerCurrencyKey == bytes32(0) || takerCurrencyKey == bytes32(0)) {
            return (takerCurrencyKey, makerCurrencyKey, makerTokenAmounts);
        }

        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                address(0xfaDAFb3ece40Eac206404B8dF5aF841F16f60E62).staticcall.gas(SYNTHETIX_CALL_GAS)(
                    abi.encodeWithSelector(
                        IExchanger(0).getAmountsForExchange.selector,
                        takerTokenAmounts[i],
                        takerCurrencyKey,
                        makerCurrencyKey
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                // solhint-disable-next-line indent
                (buyAmount, ,) = abi.decode(resultData, (uint256, uint256, uint256));
            } else {
                break;
            }
            makerTokenAmounts[i] = buyAmount;
        }
    }

    /// @dev Sample buy quotes from Synthetix
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromSynthetix(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
    }

    function _getCurrencyKey(address token)
        internal
        view
        returns (bytes32 currencyKey)
    {
        bool didSucceed;
        bytes memory resultData;
        (didSucceed, resultData) =
            token.staticcall.gas(SYNTHETIX_CALL_GAS)(
                abi.encodeWithSelector(ISynth(0).target.selector));
        if (!didSucceed) {
            return bytes32(0);
        }
        address target = abi.decode(resultData, (address));
        (didSucceed, resultData) =
            target.staticcall.gas(SYNTHETIX_CALL_GAS)(
                abi.encodeWithSelector(ISynth(0).currencyKey.selector));
        if (!didSucceed) {
            return bytes32(0);
        }
        currencyKey = abi.decode(resultData, (bytes32));
    }
}
