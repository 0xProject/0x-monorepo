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
import "./IKyberNetwork.sol";
import "./IKyberNetworkProxy.sol";
import "./IKyberStorage.sol";
import "./IKyberHintHandler.sol";
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
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromKyberNetwork(
        bytes32 reserveId,
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
        bytes memory hint = this.encodeKyberHint(reserveId, takerToken, makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            uint256 value = _sampleSellFromKyberNetwork(hint, takerToken, makerToken, takerTokenAmounts[i]);
            // Return early if the source has no liquidity
            if (value == 0) {
                return makerTokenAmounts;
            }
            makerTokenAmounts[i] = value;
        }
    }

    /// @dev Sample buy quotes from Kyber.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromKyberNetwork(
        bytes32 reserveId,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        return _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                makerTokenData: abi.encode(makerToken, reserveId),
                takerTokenData: abi.encode(takerToken, reserveId),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromKyber
            }),
            makerTokenAmounts
        );
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
        IKyberHintHandler kyberHint = IKyberHintHandler(_getKyberHintHandlerAddress());
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
            if (didSucceed) {
                hint = abi.decode(resultData, (bytes));
            }
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
            if (didSucceed) {
                hint = abi.decode(resultData, (bytes));
            }
        } else {
            // Token to Token
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
            if (didSucceed) {
                hint = abi.decode(resultData, (bytes));
            }
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
                this.sampleSellsFromKyberNetwork.selector,
                hint,
                takerToken,
                makerToken,
                _toSingleValueArray(sellAmount)
            ));
        if (!success) {
            return 0;
        }
        // solhint-disable-next-line indent
        return abi.decode(resultData, (uint256[]))[0];
    }

    function _sampleSellFromKyberNetwork(
        bytes memory hint,
        address takerToken,
        address makerToken,
        uint256 takerTokenAmount
    )
        private
        view
        returns (uint256 makerTokenAmount)
    {
        // Sampler either detects X->ETH/ETH->X
        // or subsamples as X->ETH-Y. So token->token here is not possible
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
