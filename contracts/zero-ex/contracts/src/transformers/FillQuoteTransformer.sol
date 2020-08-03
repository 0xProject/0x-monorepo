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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibMathV06.sol";
import "../errors/LibTransformERC20RichErrors.sol";
import "../vendor/v3/IExchange.sol";
import "../vendor/v3/IERC20Bridge.sol";
import "./Transformer.sol";
import "./LibERC20Transformer.sol";
import "../fixins/FixinGasToken.sol";

interface ITrade {
    function trade(
        address toTokenAddress,
        uint256 sellAmount,
        bytes calldata bridgeData
    )
        external
        returns (uint256);
}


/// @dev A transformer that fills an ERC20 market sell/buy quote.
///      This transformer shortcuts bridge orders and fills them directly
contract FillQuoteTransformer is
    Transformer,
    FixinGasToken
{
    using LibERC20TokenV06 for IERC20TokenV06;
    using LibERC20Transformer for IERC20TokenV06;
    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;
    using LibBytesV06 for bytes;

    /// @dev Whether we are performing a market sell or buy.
    enum Side {
        Sell,
        Buy
    }

    /// @dev Transform data to ABI-encode and pass into `transform()`.
    struct TransformData {
        // Whether we aer performing a market sell or buy.
        Side side;
        // The token being sold.
        // This should be an actual token, not the ETH pseudo-token.
        IERC20TokenV06 sellToken;
        // The token being bought.
        // This should be an actual token, not the ETH pseudo-token.
        IERC20TokenV06 buyToken;
        // The orders to fill.
        IExchange.Order[] orders;
        // Signatures for each respective order in `orders`.
        bytes[] signatures;
        // Maximum fill amount for each order. This may be shorter than the
        // number of orders, where missing entries will be treated as `uint256(-1)`.
        // For sells, this will be the maximum sell amount (taker asset).
        // For buys, this will be the maximum buy amount (maker asset).
        uint256[] maxOrderFillAmounts;
        // Amount of `sellToken` to sell or `buyToken` to buy.
        // For sells, this may be `uint256(-1)` to sell the entire balance of
        // `sellToken`.
        uint256 fillAmount;
    }

    /// @dev Results of a call to `_fillOrder()`.
    struct FillOrderResults {
        // The amount of taker tokens sold, according to balance checks.
        uint256 takerTokenSoldAmount;
        // The amount of maker tokens sold, according to balance checks.
        uint256 makerTokenBoughtAmount;
        // The amount of protocol fee paid.
        uint256 protocolFeePaid;
    }

    /// @dev Intermediate state variables to get around stack limits.
    struct FillState {
        uint256 ethRemaining;
        uint256 boughtAmount;
        uint256 soldAmount;
        uint256 protocolFee;
        uint256 takerTokenBalanceRemaining;
    }

    /// @dev Emitted when a trade is skipped due to a lack of funds
    ///      to pay the 0x Protocol fee.
    /// @param ethBalance The current eth balance.
    /// @param ethNeeded The current eth balance required to pay
    ///        the protocol fee.
    event ProtocolFeeUnfunded(
        uint256 ethBalance,
        uint256 ethNeeded
    );

    /// @dev The Exchange ERC20Proxy ID.
    bytes4 private constant ERC20_ASSET_PROXY_ID = 0xf47261b0;
    /// @dev The Exchange ERC20BridgeProxy ID.
    bytes4 private constant ERC20_BRIDGE_PROXY_ID = 0xdc1600f3;
    /// @dev Maximum uint256 value.
    uint256 private constant MAX_UINT256 = uint256(-1);

    /// @dev The Exchange contract.
    IExchange public constant exchange = IExchange(0x61935CbDd02287B511119DDb11Aeb42F1593b7Ef);
    /// @dev The ERC20Proxy address.
    address public constant erc20Proxy = 0x95E6F48254609A6ee006F7D493c8e5fB97094ceF;

    ///// @dev The Exchange contract.
    //IExchange public immutable exchange;
    ///// @dev The ERC20Proxy address.
    //address public immutable erc20Proxy;

    ///// @dev Create this contract.
    ///// @param exchange_ The Exchange V3 instance.
    //constructor(IExchange exchange_)
    //    public
    //    Transformer()
    //{
    //    exchange = exchange_;
    //    erc20Proxy = exchange_.getAssetProxy(ERC20_ASSET_PROXY_ID);
    //}

    /// @dev Sell this contract's entire balance of of `sellToken` in exchange
    ///      for `buyToken` by filling `orders`. Protocol fees should be attached
    ///      to this call. `buyToken` and excess ETH will be transferred back to the caller.
    /// @param data_ ABI-encoded `TransformData`.
    /// @return success The success bytes (`LibERC20Transformer.TRANSFORMER_SUCCESS`).
    function transform(
        bytes32, // callDataHash,
        address payable, // taker,
        bytes calldata data_
    )
        external
        override
        freesGasTokensFromCollector
        returns (bytes4 success)
    {
        TransformData memory data = abi.decode(data_, (TransformData));
        FillState memory state;

        // Validate data fields.
        if (data.sellToken.isTokenETH() || data.buyToken.isTokenETH()) {
            LibTransformERC20RichErrors.InvalidTransformDataError(
                LibTransformERC20RichErrors.InvalidTransformDataErrorCode.INVALID_TOKENS,
                data_
            ).rrevert();
        }
        if (data.orders.length != data.signatures.length) {
            LibTransformERC20RichErrors.InvalidTransformDataError(
                LibTransformERC20RichErrors.InvalidTransformDataErrorCode.INVALID_ARRAY_LENGTH,
                data_
            ).rrevert();
        }

        state.takerTokenBalanceRemaining = data.sellToken.getTokenBalanceOf(address(this));
        if (data.side == Side.Sell && data.fillAmount == MAX_UINT256) {
            // If `sellAmount == -1 then we are selling
            // the entire balance of `sellToken`. This is useful in cases where
            // the exact sell amount is not exactly known in advance, like when
            // unwrapping Chai/cUSDC/cDAI.
            data.fillAmount = state.takerTokenBalanceRemaining;
        }

        // Approve the ERC20 proxy to spend `sellToken`.
        data.sellToken.approveIfBelow(erc20Proxy, data.fillAmount);

        // Fill the orders.
        state.protocolFee = exchange.protocolFeeMultiplier().safeMul(tx.gasprice);
        state.ethRemaining = address(this).balance;
        for (uint256 i = 0; i < data.orders.length; ++i) {
            // Check if we've hit our targets.
            if (data.side == Side.Sell) {
                // Market sell check.
                if (state.soldAmount >= data.fillAmount) {
                    break;
                }
            } else {
                // Market buy check.
                if (state.boughtAmount >= data.fillAmount) {
                    break;
                }
            }

            // Fill the order.
            FillOrderResults memory results;
            if (data.side == Side.Sell) {
                // Market sell.
                results = _sellToOrder(
                    data.buyToken,
                    data.sellToken,
                    data.orders[i],
                    data.signatures[i],
                    data.fillAmount.safeSub(state.soldAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : MAX_UINT256
                    ),
                    state
                );
            } else {
                // Market buy.
                results = _buyFromOrder(
                    data.buyToken,
                    data.sellToken,
                    data.orders[i],
                    data.signatures[i],
                    data.fillAmount.safeSub(state.boughtAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : MAX_UINT256
                    ),
                    state
                );
            }

            // Accumulate totals.
            state.soldAmount = state.soldAmount.safeAdd(results.takerTokenSoldAmount);
            state.boughtAmount = state.boughtAmount.safeAdd(results.makerTokenBoughtAmount);
            state.ethRemaining = state.ethRemaining.safeSub(results.protocolFeePaid);
            state.takerTokenBalanceRemaining = state.takerTokenBalanceRemaining.safeSub(results.takerTokenSoldAmount);
        }

        // Ensure we hit our targets.
        if (data.side == Side.Sell) {
            // Market sell check.
            if (state.soldAmount < data.fillAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillSellQuoteError(
                        address(data.sellToken),
                        state.soldAmount,
                        data.fillAmount
                    ).rrevert();
            }
        } else {
            // Market buy check.
            if (state.boughtAmount < data.fillAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillBuyQuoteError(
                        address(data.buyToken),
                        state.boughtAmount,
                        data.fillAmount
                    ).rrevert();
            }
        }
        return LibERC20Transformer.TRANSFORMER_SUCCESS;
    }

    /// @dev Try to sell up to `sellAmount` from an order.
    /// @param makerToken The maker/buy token.
    /// @param takerToken The taker/sell token.
    /// @param order The order to fill.
    /// @param signature The signature for `order`.
    /// @param sellAmount Amount of taker token to sell.
    /// @param state Intermediate state variables to get around stack limits.
    function _sellToOrder(
        IERC20TokenV06 makerToken,
        IERC20TokenV06 takerToken,
        IExchange.Order memory order,
        bytes memory signature,
        uint256 sellAmount,
        FillState memory state
    )
        private
        returns (FillOrderResults memory results)
    {
        IERC20TokenV06 takerFeeToken =
            _getTokenFromERC20AssetData(order.takerFeeAssetData);

        uint256 takerTokenFillAmount = sellAmount;

        if (order.takerFee != 0) {
            if (takerFeeToken == makerToken) {
                // Taker fee is payable in the maker token, so we need to
                // approve the proxy to spend the maker token.
                // It isn't worth computing the actual taker fee
                // since `approveIfBelow()` will set the allowance to infinite. We
                // just need a reasonable upper bound to avoid unnecessarily re-approving.
                takerFeeToken.approveIfBelow(erc20Proxy, order.takerFee);
            } else if (takerFeeToken == takerToken){
                // Taker fee is payable in the taker token, so we need to
                // reduce the fill amount to cover the fee.
                // takerTokenFillAmount' =
                //   (takerTokenFillAmount * order.takerAssetAmount) /
                //   (order.takerAssetAmount + order.takerFee)
                takerTokenFillAmount = LibMathV06.getPartialAmountCeil(
                    order.takerAssetAmount,
                    order.takerAssetAmount.safeAdd(order.takerFee),
                    sellAmount
                );
            } else {
                //  Only support taker or maker asset denominated taker fees.
                LibTransformERC20RichErrors.InvalidTakerFeeTokenError(
                    address(takerFeeToken)
                ).rrevert();
            }
        }

        // Perform the fill.
        return _fillOrder(
            order,
            signature,
            takerTokenFillAmount,
            state,
            makerToken,
            takerFeeToken == takerToken
        );
    }

    /// @dev Try to buy up to `buyAmount` from an order.
    /// @param makerToken The maker/buy token.
    /// @param takerToken The taker/sell token.
    /// @param order The order to fill.
    /// @param signature The signature for `order`.
    /// @param buyAmount Amount of maker token to buy.
    /// @param state Intermediate state variables to get around stack limits.
    function _buyFromOrder(
        IERC20TokenV06 makerToken,
        IERC20TokenV06 takerToken,
        IExchange.Order memory order,
        bytes memory signature,
        uint256 buyAmount,
        FillState memory state
    )
        private
        returns (FillOrderResults memory results)
    {
        IERC20TokenV06 takerFeeToken =
            _getTokenFromERC20AssetData(order.takerFeeAssetData);
        // Compute the default taker token fill amount.
        uint256 takerTokenFillAmount = LibMathV06.getPartialAmountCeil(
            buyAmount,
            order.makerAssetAmount,
            order.takerAssetAmount
        );

        if (order.takerFee != 0) {
            if (takerFeeToken == makerToken) {
                // Taker fee is payable in the maker token.
                // Adjust the taker token fill amount to account for maker
                // tokens being lost to the taker fee.
                // takerTokenFillAmount' =
                //  (order.takerAssetAmount * buyAmount) /
                //  (order.makerAssetAmount - order.takerFee)
                takerTokenFillAmount = LibMathV06.getPartialAmountCeil(
                    buyAmount,
                    order.makerAssetAmount.safeSub(order.takerFee),
                    order.takerAssetAmount
                );
                // Approve the proxy to spend the maker token.
                // It isn't worth computing the actual taker fee
                // since `approveIfBelow()` will set the allowance to infinite. We
                // just need a reasonable upper bound to avoid unnecessarily re-approving.
                takerFeeToken.approveIfBelow(erc20Proxy, order.takerFee);
            } else if (takerFeeToken != takerToken) {
                //  Only support taker or maker asset denominated taker fees.
                LibTransformERC20RichErrors.InvalidTakerFeeTokenError(
                    address(takerFeeToken)
                ).rrevert();
            }
        }

        // Perform the fill.
        return _fillOrder(
            order,
            signature,
            takerTokenFillAmount,
            state,
            makerToken,
            takerFeeToken == takerToken
        );
    }

    /// @dev Attempt to fill an order. If the fill reverts, the revert will be
    ///      swallowed and `results` will be zeroed out.
    /// @param order The order to fill.
    /// @param signature The order signature.
    /// @param takerAssetFillAmount How much taker asset to fill.
    /// @param state Intermediate state variables to get around stack limits.
    /// @param makerToken The maker token.
    /// @param isTakerFeeInTakerToken Whether the taker fee token is the same as the
    ///        taker token.
    function _fillOrder(
        IExchange.Order memory order,
        bytes memory signature,
        uint256 takerAssetFillAmount,
        FillState memory state,
        IERC20TokenV06 makerToken,
        bool isTakerFeeInTakerToken
    )
        private
        returns (FillOrderResults memory results)
    {
        // Clamp to remaining taker asset amount or order size.
        uint256 availableTakerAssetFillAmount =
            takerAssetFillAmount.min256(order.takerAssetAmount);
        availableTakerAssetFillAmount =
            availableTakerAssetFillAmount.min256(state.takerTokenBalanceRemaining);
        // If it is a Bridge order we fill this directly
        // rather than filling via 0x Exchange
        if (order.makerAssetData.readBytes4(0) == ERC20_BRIDGE_PROXY_ID) {
            // Calculate the amount (in maker token) we expect to receive
            // from the bridge
            uint256 outputTokenAmount = LibMathV06.getPartialAmountFloor(
                availableTakerAssetFillAmount,
                order.takerAssetAmount,
                order.makerAssetAmount
            );
            address iTradeDirect = address(0);
            if (order.makerAddress == 0x1796Cd592d19E3bcd744fbB025BB61A6D8cb2c09) {
                // CurveBridge
                // iTradeDirect = 0x1111111111111111111111111111111111111111;
            } else if (order.makerAddress == 0x36691C4F426Eb8F42f150ebdE43069A31cB080AD) {
                // Uniswap bridge
                // iTradeDirect = 0x2222222222222222222222222222222222222222;
            } else if (order.makerAddress == 0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48) {
                // Uniswap v2
                iTradeDirect = 0x3333333333333333333333333333333333333333;
            } else if (order.makerAddress == 0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4) {
                // Balancer
                // iTradeDirect = 0x4444444444444444444444444444444444444444;
            }
            if (iTradeDirect != address(0)) {
                // TODO handle revert
                results.makerTokenBoughtAmount = _fillBridgeDirect(
                    iTradeDirect,
                    order.makerAssetData,
                    availableTakerAssetFillAmount
                );
                results.takerTokenSoldAmount = availableTakerAssetFillAmount;
            } else {
                (bool success, bytes memory data) = address(_implementation).delegatecall(
                    abi.encodeWithSelector(
                        this.fillBridgeOrder.selector,
                        order.makerAddress,
                        order.makerAssetData,
                        order.takerAssetData,
                        availableTakerAssetFillAmount,
                        outputTokenAmount
                    )
                );
                // Swallow failures, leaving all results as zero.
                // TransformERC20 asserts the overall price is as expected. It is possible
                // a subsequent fill can net out at the expected price so we do not assert
                // the trade balance
                if (success) {
                    results.makerTokenBoughtAmount = makerToken
                        .balanceOf(address(this))
                        .safeSub(state.boughtAmount);
                    results.takerTokenSoldAmount = availableTakerAssetFillAmount;
                    // protocol fee paid remains 0
                } else {
                    // TODO REMOVE
                    assembly { revert(add(data, 32), mload(data)) }
                }
            }
        } else {
            // Emit an event if we do not have sufficient ETH to cover the protocol fee.
            if (state.ethRemaining < state.protocolFee) {
                emit ProtocolFeeUnfunded(state.ethRemaining, state.protocolFee);
                return results;
            }
            try
                exchange.fillOrder
                    {value: state.protocolFee}
                    (order, availableTakerAssetFillAmount, signature)
                returns (IExchange.FillResults memory fillResults)
            {
                results.makerTokenBoughtAmount = fillResults.makerAssetFilledAmount;
                results.takerTokenSoldAmount = fillResults.takerAssetFilledAmount;
                results.protocolFeePaid = fillResults.protocolFeePaid;
                // If the taker fee is payable in the taker asset, include the
                // taker fee in the total amount sold.
                if (isTakerFeeInTakerToken) {
                    results.takerTokenSoldAmount =
                        results.takerTokenSoldAmount.safeAdd(fillResults.takerFeePaid);
                }
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
            }
        }
    }

    /// @dev Attempt to fill an ERC20 Bridge order directly.
    /// @param bridgeDelegateAddress The address of the contract to delegate call.
    /// @param makerAssetData The encoded ERC20BridgeProxy asset data.
    /// @param inputTokenAmount How much taker asset to fill clamped to the available balance.
    function _fillBridgeDirect(
        address bridgeDelegateAddress,
        bytes memory makerAssetData,
        uint256 inputTokenAmount
    )
        private
        returns (uint256 boughtAmount)
    {
        // Track changes in the maker token balance.
        (
            address tokenAddress,
            address bridgeAddress,
            bytes memory bridgeData
        ) = abi.decode(
            makerAssetData.sliceDestructive(4, makerAssetData.length),
            (address, address, bytes)
        );
        (bool success, bytes memory resultData) = address(bridgeDelegateAddress).delegatecall(
            abi.encodeWithSelector(
                ITrade(address(0)).trade.selector,
                tokenAddress,
                inputTokenAmount,
                bridgeData
            )
        );
        if (!success) {
            // return 0;
            assembly { revert(add(resultData, 32), mload(resultData)) }
        }
        boughtAmount = abi.decode(resultData, (uint256));
    }
    /// @dev Attempt to fill an ERC20 Bridge order. If the fill reverts,
    ///      or the amount filled was not sufficient this reverts.
    /// @param makerAddress The address of the maker.
    /// @param makerAssetData The encoded ERC20BridgeProxy asset data.
    /// @param takerAssetData The encoded ERC20 asset data.
    /// @param inputTokenAmount How much taker asset to fill clamped to the available balance.
    /// @param outputTokenAmount How much maker asset to receive.
    function fillBridgeOrder(
        address makerAddress,
        bytes calldata makerAssetData,
        bytes calldata takerAssetData,
        uint256 inputTokenAmount,
        uint256 outputTokenAmount
    )
        external
    {
        // Track changes in the maker token balance.
        (
            address tokenAddress,
            address bridgeAddress,
            bytes memory bridgeData
        ) = abi.decode(
            makerAssetData.sliceDestructive(4, makerAssetData.length),
            (address, address, bytes)
        );
        require(bridgeAddress != address(this), "INVALID_BRIDGE_ADDRESS");
        //address iTradeDirect = address(0);
        //if (bridgeAddress == 0x1796Cd592d19E3bcd744fbB025BB61A6D8cb2c09) {
        //    // CurveBridge
        //    //iTradeDirect = 0x1111111111111111111111111111111111111111;
        //} else if (bridgeAddress == 0x36691C4F426Eb8F42f150ebdE43069A31cB080AD) {
        //    // iTradeDirect = 0x2222222222222222222222222222222222222222;
        //} else if (bridgeAddress == 0xDcD6011f4C6B80e470D9487f5871a0Cba7C93f48) {
        //    // iTradeDirect = 0x3333333333333333333333333333333333333333;
        //} else if (bridgeAddress == 0xfe01821Ca163844203220cd08E4f2B2FB43aE4E4) {
        //    // iTradeDirect = 0x4444444444444444444444444444444444444444;
        //}
        //if (iTradeDirect != address(0)) {
        //    (bool success, bytes memory resultData) = address(iTradeDirect).delegatecall(
        //        abi.encodeWithSelector(
        //            ITrade(address(0)).trade.selector,
        //            tokenAddress,
        //            inputTokenAmount,
        //            bridgeData
        //        )
        //    );
        //    if (!success) {
        //        assembly { revert(add(resultData, 32), mload(resultData)) }
        //    }
        //} else {
            // Transfer the tokens to the bridge to perform the work
            _getTokenFromERC20AssetData(takerAssetData).compatTransfer(
                bridgeAddress,
                inputTokenAmount
            );
            IERC20Bridge(bridgeAddress).bridgeTransferFrom(
                tokenAddress,
                makerAddress,
                address(this),
                outputTokenAmount, // amount to transfer back from the bridge
                bridgeData
            );
        //}
    }

    /// @dev Extract the token from plain ERC20 asset data.
    ///      If the asset-data is empty, a zero token address will be returned.
    /// @param assetData The order asset data.
    function _getTokenFromERC20AssetData(bytes memory assetData)
        private
        pure
        returns (IERC20TokenV06 token)
    {
        if (assetData.length == 0) {
            return IERC20TokenV06(address(0));
        }
        if (assetData.length != 36 ||
            LibBytesV06.readBytes4(assetData, 0) != ERC20_ASSET_PROXY_ID)
        {
            LibTransformERC20RichErrors
                .InvalidERC20AssetDataError(assetData)
                .rrevert();
        }
        return IERC20TokenV06(LibBytesV06.readAddress(assetData, 16));
    }
}
