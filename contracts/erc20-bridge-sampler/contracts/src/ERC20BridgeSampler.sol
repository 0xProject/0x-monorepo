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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IUniswapExchangeFactory.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "./IDevUtils.sol";
import "./IERC20BridgeSampler.sol";
import "./IEth2Dai.sol";
import "./IKyberNetwork.sol";
import "./IUniswapExchangeQuotes.sol";
import "./ICurve.sol";


contract ERC20BridgeSampler is
    IERC20BridgeSampler,
    DeploymentConstants
{
    /// @dev Gas limit for DevUtils calls.
    uint256 constant internal DEV_UTILS_CALL_GAS = 500e3; // 500k
    /// @dev Gas limit for Kyber calls.
    uint256 constant internal KYBER_CALL_GAS = 1500e3; // 1.5m
    /// @dev Gas limit for Uniswap calls.
    uint256 constant internal UNISWAP_CALL_GAS = 150e3; // 150k
    /// @dev Base gas limit for Eth2Dai calls.
    uint256 constant internal ETH2DAI_CALL_GAS = 1000e3; // 1m
    /// @dev Base gas limit for Curve calls. Some Curves have multiple tokens
    ///      So a reasonable ceil is 150k per token. Biggest Curve has 4 tokens.
    uint256 constant internal CURVE_CALL_GAS = 600e3; // 600k

    /// @dev Call multiple public functions on this contract in a single transaction.
    /// @param callDatas ABI-encoded call data for each function call.
    /// @return callResults ABI-encoded results data for each call.
    function batchCall(bytes[] calldata callDatas)
        external
        view
        returns (bytes[] memory callResults)
    {
        callResults = new bytes[](callDatas.length);
        for (uint256 i = 0; i != callDatas.length; ++i) {
            (bool didSucceed, bytes memory resultData) = address(this).staticcall(callDatas[i]);
            if (!didSucceed) {
                assembly { revert(add(resultData, 0x20), mload(resultData)) }
            }
            callResults[i] = resultData;
        }
    }

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    ///      maker/taker asset amounts (returning 0).
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @return orderFillableTakerAssetAmounts How much taker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableTakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures
    )
        public
        view
        returns (uint256[] memory orderFillableTakerAssetAmounts)
    {
        orderFillableTakerAssetAmounts = new uint256[](orders.length);
        for (uint256 i = 0; i != orders.length; i++) {
            // Ignore orders with no signature or empty maker/taker amounts.
            if (orderSignatures[i].length == 0 ||
                orders[i].makerAssetAmount == 0 ||
                orders[i].takerAssetAmount == 0) {
                orderFillableTakerAssetAmounts[i] = 0;
                continue;
            }
            // solhint-disable indent
            (bool didSucceed, bytes memory resultData) =
                _getDevUtilsAddress()
                    .staticcall
                    .gas(DEV_UTILS_CALL_GAS)
                    (abi.encodeWithSelector(
                       IDevUtils(_getDevUtilsAddress()).getOrderRelevantState.selector,
                       orders[i],
                       orderSignatures[i]
                    ));
            // solhint-enable indent
            if (!didSucceed) {
                orderFillableTakerAssetAmounts[i] = 0;
                continue;
            }
            (
                LibOrder.OrderInfo memory orderInfo,
                uint256 fillableTakerAssetAmount,
                bool isValidSignature
            ) = abi.decode(
                resultData,
                (LibOrder.OrderInfo, uint256, bool)
            );
            // The fillable amount is zero if the order is not fillable or if the
            // signature is invalid.
            if (orderInfo.orderStatus != LibOrder.OrderStatus.FILLABLE ||
                !isValidSignature) {
                orderFillableTakerAssetAmounts[i] = 0;
            } else {
                orderFillableTakerAssetAmounts[i] = fillableTakerAssetAmount;
            }
        }
    }

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @return orderFillableMakerAssetAmounts How much maker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableMakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures
    )
        public
        view
        returns (uint256[] memory orderFillableMakerAssetAmounts)
    {
        orderFillableMakerAssetAmounts = getOrderFillableTakerAssetAmounts(
            orders,
            orderSignatures
        );
        // `orderFillableMakerAssetAmounts` now holds taker asset amounts, so
        // convert them to maker asset amounts.
        for (uint256 i = 0; i < orders.length; ++i) {
            if (orderFillableMakerAssetAmounts[i] != 0) {
                orderFillableMakerAssetAmounts[i] = LibMath.getPartialAmountCeil(
                    orderFillableMakerAssetAmounts[i],
                    orders[i].takerAssetAmount,
                    orders[i].makerAssetAmount
                );
            }
        }
    }

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
        address _takerToken = takerToken == _getWethAddress() ? KYBER_ETH_ADDRESS : takerToken;
        address _makerToken = makerToken == _getWethAddress() ? KYBER_ETH_ADDRESS : makerToken;
        uint256 takerTokenDecimals = _getTokenDecimals(takerToken);
        uint256 makerTokenDecimals = _getTokenDecimals(makerToken);
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                _getKyberNetworkProxyAddress().staticcall.gas(KYBER_CALL_GAS)(
                    abi.encodeWithSelector(
                        IKyberNetwork(0).getExpectedRate.selector,
                        _takerToken,
                        _makerToken,
                        takerTokenAmounts[i]
                    ));
            uint256 rate = 0;
            if (didSucceed) {
                rate = abi.decode(resultData, (uint256));
            } else {
                break;
            }
            makerTokenAmounts[i] =
                rate *
                takerTokenAmounts[i] *
                10 ** makerTokenDecimals /
                10 ** takerTokenDecimals /
                10 ** 18;
        }
    }

    /// @dev Sample sell quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromEth2Dai(
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
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                _getEth2DaiAddress().staticcall.gas(ETH2DAI_CALL_GAS)(
                    abi.encodeWithSelector(
                        IEth2Dai(0).getBuyAmount.selector,
                        makerToken,
                        takerToken,
                        takerTokenAmounts[i]
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                buyAmount = abi.decode(resultData, (uint256));
            } else{
                break;
            }
            makerTokenAmounts[i] = buyAmount;
        }
    }

    /// @dev Sample buy quotes from Eth2Dai/Oasis.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromEth2Dai(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                _getEth2DaiAddress().staticcall.gas(ETH2DAI_CALL_GAS)(
                    abi.encodeWithSelector(
                        IEth2Dai(0).getPayAmount.selector,
                        takerToken,
                        makerToken,
                        makerTokenAmounts[i]
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

    /// @dev Sample sell quotes from Uniswap.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromUniswap(
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
        IUniswapExchangeQuotes takerTokenExchange = takerToken == _getWethAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == _getWethAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            bool didSucceed = true;
            if (makerToken == _getWethAddress()) {
                (makerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                    address(takerTokenExchange),
                    takerTokenExchange.getTokenToEthInputPrice.selector,
                    takerTokenAmounts[i]
                );
            } else if (takerToken == _getWethAddress()) {
                (makerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                    address(makerTokenExchange),
                    makerTokenExchange.getEthToTokenInputPrice.selector,
                    takerTokenAmounts[i]
                );
            } else {
                uint256 ethBought;
                (ethBought, didSucceed) = _callUniswapExchangePriceFunction(
                    address(takerTokenExchange),
                    takerTokenExchange.getTokenToEthInputPrice.selector,
                    takerTokenAmounts[i]
                );
                if (ethBought != 0) {
                    (makerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                        address(makerTokenExchange),
                        makerTokenExchange.getEthToTokenInputPrice.selector,
                        ethBought
                    );
                } else {
                    makerTokenAmounts[i] = 0;
                }
            }
            if (!didSucceed) {
                break;
            }
        }
    }

    /// @dev Sample buy quotes from Uniswap.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token sell amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromUniswap(
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts)
    {
        _assertValidPair(makerToken, takerToken);
        uint256 numSamples = makerTokenAmounts.length;
        takerTokenAmounts = new uint256[](numSamples);
        IUniswapExchangeQuotes takerTokenExchange = takerToken == _getWethAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(takerToken);
        IUniswapExchangeQuotes makerTokenExchange = makerToken == _getWethAddress() ?
            IUniswapExchangeQuotes(0) : _getUniswapExchange(makerToken);
        for (uint256 i = 0; i < numSamples; i++) {
            bool didSucceed = true;
            if (makerToken == _getWethAddress()) {
                (takerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                    address(takerTokenExchange),
                    takerTokenExchange.getTokenToEthOutputPrice.selector,
                    makerTokenAmounts[i]
                );
            } else if (takerToken == _getWethAddress()) {
                (takerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                    address(makerTokenExchange),
                    makerTokenExchange.getEthToTokenOutputPrice.selector,
                    makerTokenAmounts[i]
                );
            } else {
                uint256 ethSold;
                (ethSold, didSucceed) = _callUniswapExchangePriceFunction(
                    address(makerTokenExchange),
                    makerTokenExchange.getEthToTokenOutputPrice.selector,
                    makerTokenAmounts[i]
                );
                if (ethSold != 0) {
                    (takerTokenAmounts[i], didSucceed) = _callUniswapExchangePriceFunction(
                        address(takerTokenExchange),
                        takerTokenExchange.getTokenToEthOutputPrice.selector,
                        ethSold
                    );
                } else {
                    takerTokenAmounts[i] = 0;
                }
            }
            if (!didSucceed) {
                break;
            }
        }
    }

    /// @dev Sample sell quotes from Curve.
    /// @param curveAddress Address of the Curve contract.
    /// @param fromTokenIdx Index of the taker token (what to sell).
    /// @param toTokenIdx Index of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromCurve(
        address curveAddress,
        int128 fromTokenIdx,
        int128 toTokenIdx,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts)
    {
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);
        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                curveAddress.staticcall.gas(CURVE_CALL_GAS)(
                    abi.encodeWithSelector(
                        ICurve(0).get_dy_underlying.selector,
                        fromTokenIdx,
                        toTokenIdx,
                        takerTokenAmounts[i]
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

    /// @dev Overridable way to get token decimals.
    /// @param tokenAddress Address of the token.
    /// @return decimals The decimal places for the token.
    function _getTokenDecimals(address tokenAddress)
        internal
        view
        returns (uint8 decimals)
    {
        return LibERC20Token.decimals(tokenAddress);
    }

    /// @dev Gracefully calls a Uniswap pricing function.
    /// @param uniswapExchangeAddress Address of an `IUniswapExchangeQuotes` exchange.
    /// @param functionSelector Selector of the target function.
    /// @param inputAmount Quantity parameter particular to the pricing function.
    /// @return outputAmount The returned amount from the function call. Will be
    ///         zero if the call fails or if `uniswapExchangeAddress` is zero.
    function _callUniswapExchangePriceFunction(
        address uniswapExchangeAddress,
        bytes4 functionSelector,
        uint256 inputAmount
    )
        private
        view
        returns (uint256 outputAmount, bool didSucceed)
    {
        if (uniswapExchangeAddress == address(0)) {
            return (outputAmount, didSucceed);
        }
        bytes memory resultData;
        (didSucceed, resultData) =
            uniswapExchangeAddress.staticcall.gas(UNISWAP_CALL_GAS)(
                abi.encodeWithSelector(
                    functionSelector,
                    inputAmount
                ));
        if (didSucceed) {
            outputAmount = abi.decode(resultData, (uint256));
        }
    }

    /// @dev Retrive an existing Uniswap exchange contract.
    ///      Throws if the exchange does not exist.
    /// @param tokenAddress Address of the token contract.
    /// @return exchange `IUniswapExchangeQuotes` for the token.
    function _getUniswapExchange(address tokenAddress)
        private
        view
        returns (IUniswapExchangeQuotes exchange)
    {
        exchange = IUniswapExchangeQuotes(
            address(IUniswapExchangeFactory(_getUniswapExchangeFactoryAddress())
            .getExchange(tokenAddress))
        );
    }

    /// @dev Assert that the tokens in a trade pair are valid.
    /// @param makerToken Address of the maker token.
    /// @param takerToken Address of the taker token.
    function _assertValidPair(address makerToken, address takerToken)
        private
        pure
    {
        require(makerToken != takerToken, "ERC20BridgeSampler/INVALID_TOKEN_PAIR");
    }
}
