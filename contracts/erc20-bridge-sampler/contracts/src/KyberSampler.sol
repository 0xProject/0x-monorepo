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
    uint256 constant private KYBER_CALL_GAS = 1500e3; // 1.5m
    /// @dev The Kyber Uniswap Reserve address
    address constant private KYBER_UNISWAP_RESERVE = 0x31E085Afd48a1d6e51Cc193153d625e8f0514C7F;
    /// @dev The Kyber Uniswap V2 Reserve address
    address constant private KYBER_UNISWAPV2_RESERVE = 0x10908C875D865C66f271F5d3949848971c9595C9;
    /// @dev The Kyber Eth2Dai Reserve address
    address constant private KYBER_ETH2DAI_RESERVE = 0x1E158c0e93c30d24e918Ef83d1e0bE23595C3c0f;

    /// @dev Sample sell quotes from Kyber.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromKyberNetwork(
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
        address wethAddress = _getWethAddress();
        uint256 value;
        for (uint256 i = 0; i < numSamples; i++) {
            if (takerToken == wethAddress || makerToken == wethAddress) {
                // Direct ETH based trade
                value = _sampleSellFromKyberNetwork(takerToken, makerToken, takerTokenAmounts[i]);
            } else {
                // Hop to ETH
                value = _sampleSellFromKyberNetwork(takerToken, wethAddress, takerTokenAmounts[i]);
                if (value != 0) {
                    value = _sampleSellFromKyberNetwork(wethAddress, makerToken, value);
                }
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
                makerTokenData: abi.encode(makerToken),
                takerTokenData: abi.encode(takerToken),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromKyber
            }),
            makerTokenAmounts
        );
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
        (bool success, bytes memory resultData) =
            address(this).staticcall(abi.encodeWithSelector(
                this.sampleSellsFromKyberNetwork.selector,
                abi.decode(takerTokenData, (address)),
                abi.decode(makerTokenData, (address)),
                _toSingleValueArray(sellAmount)
            ));
        if (!success) {
            return 0;
        }
        // solhint-disable-next-line indent
        return abi.decode(resultData, (uint256[]))[0];
    }

    function _appendToList(bytes32[] memory list, bytes32 item) private view returns (bytes32[] memory appendedList)
    {
        appendedList = new bytes32[](list.length + 1);
        for (uint256 i = 0; i < list.length; i++) {
            appendedList[i] = list[i];
        }
        appendedList[appendedList.length - 1] = item;
    }

    function _getKyberAddresses()
        private
        view
        returns (IKyberHintHandler kyberHint, IKyberStorage kyberStorage)
    {
        (, , kyberHint, kyberStorage, ,) = IKyberNetwork(
            IKyberNetworkProxy(_getKyberNetworkProxyAddress()).kyberNetwork()).getContracts();
        return (IKyberHintHandler(kyberHint), IKyberStorage(kyberStorage));
    }

    function _sampleSellFromKyberNetwork(
        address takerToken,
        address makerToken,
        uint256 takerTokenAmount
    )
        private
        view
        returns (uint256 makerTokenAmount)
    {
        (IKyberHintHandler kyberHint, IKyberStorage kyberStorage) = _getKyberAddresses();
        // Ban reserves which can clash with our internal aggregation
        bytes32[] memory reserveIds = kyberStorage.getReserveIdsPerTokenSrc(
            takerToken == _getWethAddress() ? makerToken : takerToken
        );
        bytes32[] memory bannedReserveIds = new bytes32[](0);
        // Poor mans resize and append
        for (uint256 i = 0; i < reserveIds.length; i++) {
            if (
                reserveIds[i] == kyberStorage.getReserveId(KYBER_UNISWAP_RESERVE) ||
                reserveIds[i] == kyberStorage.getReserveId(KYBER_UNISWAPV2_RESERVE) ||
                reserveIds[i] == kyberStorage.getReserveId(KYBER_ETH2DAI_RESERVE)
            ) {
                bannedReserveIds = _appendToList(bannedReserveIds, reserveIds[i]);
            }
        }
        // Sampler either detects X->ETH/ETH->X
        // or subsamples as X->ETH-Y. So token->token here is not possible
        bytes memory hint;
        if (takerToken == _getWethAddress()) {
            // ETH -> X
            hint = kyberHint.buildEthToTokenHint(
                    makerToken,
                    IKyberHintHandler.TradeType.MaskOut,
                    bannedReserveIds,
                    new uint256[](0));
        } else {
            // X->ETH
            hint = kyberHint.buildEthToTokenHint(
                    takerToken,
                    IKyberHintHandler.TradeType.MaskOut,
                    bannedReserveIds,
                    new uint256[](0));
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
