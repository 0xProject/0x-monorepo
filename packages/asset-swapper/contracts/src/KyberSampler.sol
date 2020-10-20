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
import "./interfaces/IKyberNetwork.sol";
import "./ApproximateBuys.sol";
import "./SamplerUtils.sol";


contract KyberSampler is
    DeploymentConstants,
    SamplerUtils,
    ApproximateBuys
{
    /// @dev Gas limit for Kyber calls.
    uint256 constant private KYBER_CALL_GAS = 500e3; // 500k

    /// @dev Sample sell quotes from Kyber.
    /// @param reserveId The selected kyber reserve
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return hint The hint for the selected reserve
    /// @return makerTokenAmounts Maker amounts bought at each taker token amount.
    function sampleSellsFromKyberNetwork(
        bytes32 reserveId,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (bytes memory hint, uint256[] memory makerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        hint = this.encodeKyberHint(reserveId, takerToken, makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            uint256 value = this.sampleSellFromKyberNetwork(hint, takerToken, makerToken, takerTokenAmounts[i]);
            // Return early if the source has no liquidity
            if (value == 0) {
                return (hint, makerTokenAmounts);
            }
            makerTokenAmounts[i] = value;
        }
    }

    /// @dev Sample buy quotes from Kyber.
    /// @param reserveId The selected kyber reserve
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return hint The hint for the selected reserve
    /// @return takerTokenAmounts Taker amounts sold at each maker token amount.
    function sampleBuysFromKyberNetwork(
        bytes32 reserveId,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (bytes memory hint, uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        hint = this.encodeKyberHint(reserveId, takerToken, makerToken);
        takerTokenAmounts = _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                makerTokenData: abi.encode(makerToken, hint),
                takerTokenData: abi.encode(takerToken, hint),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromKyber
            }),
            makerTokenAmounts
        );
        return (hint, takerTokenAmounts);
    }

    function encodeKyberHint(
        bytes32 reserveId,
        address takerToken,
        address makerToken
    )
        public
        view
        returns (bytes memory hint)
    {
        // Build a hint selecting the single reserve
        IKyberHintHandler kyberHint = IKyberHintHandler(_getKyberHintHandlerAddress());

        // All other reserves should be ignored with this hint
        bytes32[] memory selectedReserves = new bytes32[](1);
        selectedReserves[0] = reserveId;

        bool didSucceed;
        bytes memory resultData;
        if (takerToken == _getWethAddress()) {
            // ETH to Token
            (didSucceed, resultData) =
                address(kyberHint).staticcall.gas(KYBER_CALL_GAS)(
                    abi.encodeWithSelector(
                        IKyberHintHandler(0).buildEthToTokenHint.selector,
                        makerToken,
                        IKyberHintHandler.TradeType.MaskIn,
                        selectedReserves,
                        new uint256[](0)));
        } else if (makerToken == _getWethAddress()) {
            // Token to ETH
            (didSucceed, resultData) =
                address(kyberHint).staticcall.gas(KYBER_CALL_GAS)(
                    abi.encodeWithSelector(
                        IKyberHintHandler(0).buildTokenToEthHint.selector,
                        takerToken,
                        IKyberHintHandler.TradeType.MaskIn,
                        selectedReserves,
                        new uint256[](0)));
        } else {
            // Token to Token
            // We use the same reserve both ways
            (didSucceed, resultData) =
                address(kyberHint).staticcall.gas(KYBER_CALL_GAS)(
                    abi.encodeWithSelector(
                        IKyberHintHandler(0).buildTokenToTokenHint.selector,
                        takerToken,
                        IKyberHintHandler.TradeType.MaskIn,
                        selectedReserves,
                        new uint256[](0),
                        makerToken,
                        IKyberHintHandler.TradeType.MaskIn,
                        selectedReserves,
                        new uint256[](0)
                    )
            );
        }
        // If successful decode the hint
        if (didSucceed) {
            hint = abi.decode(resultData, (bytes));
        }
        return hint;
    }

    function _sampleSellForApproximateBuyFromKyber(
        bytes memory takerTokenData,
        bytes memory makerTokenData,
        uint256 sellAmount
    )
        private
        view
        returns (uint256 buyAmount)
    {
        (address makerToken, bytes memory hint) =
            abi.decode(makerTokenData, (address, bytes));
        (address takerToken, ) =
            abi.decode(takerTokenData, (address, bytes));
        (bool success, bytes memory resultData) =
            address(this).staticcall(abi.encodeWithSelector(
                this.sampleSellFromKyberNetwork.selector,
                hint,
                takerToken,
                makerToken,
                sellAmount
            ));
        if (!success) {
            return 0;
        }
        // solhint-disable-next-line indent
        return abi.decode(resultData, (uint256));
    }

    function sampleSellFromKyberNetwork(
        bytes memory hint,
        address takerToken,
        address makerToken,
        uint256 takerTokenAmount
    )
        public
        view
        returns (uint256 makerTokenAmount)
    {
        // If there is no hint do not continue
        if (hint.length == 0) {
            return 0;
        }

        (bool didSucceed, bytes memory resultData) =
            _getKyberNetworkProxyAddress().staticcall.gas(KYBER_CALL_GAS)(
                abi.encodeWithSelector(
                    IKyberNetworkProxy(0).getExpectedRateAfterFee.selector,
                    takerToken == _getWethAddress() ? KYBER_ETH_ADDRESS : takerToken,
                    makerToken == _getWethAddress() ? KYBER_ETH_ADDRESS : makerToken,
                    takerTokenAmount,
                    0, // fee
                    hint
                ));
        uint256 rate = 0;
        if (didSucceed) {
            (rate) = abi.decode(resultData, (uint256));
        } else {
            return 0;
        }

        uint256 makerTokenDecimals = _getTokenDecimals(makerToken);
        uint256 takerTokenDecimals = _getTokenDecimals(takerToken);
        makerTokenAmount =
            rate *
            takerTokenAmount *
            10 ** makerTokenDecimals /
            10 ** takerTokenDecimals /
            10 ** 18;
        return makerTokenAmount;
    }
}
