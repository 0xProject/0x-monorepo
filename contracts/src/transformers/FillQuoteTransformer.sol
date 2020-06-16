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
import "./Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that fills an ERC20 market sell/buy quote.
contract FillQuoteTransformer is
    Transformer
{
    using LibERC20TokenV06 for IERC20TokenV06;
    using LibERC20Transformer for IERC20TokenV06;
    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;

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

    /// @dev The Exchange ERC20Proxy ID.
    bytes4 private constant ERC20_ASSET_PROXY_ID = 0xf47261b0;
    /// @dev Maximum uint256 value.
    uint256 private constant MAX_UINT256 = uint256(-1);

    /// @dev The Exchange contract.
    IExchange public immutable exchange;
    /// @dev The ERC20Proxy address.
    address public immutable erc20Proxy;

    /// @dev Create this contract.
    /// @param exchange_ The Exchange V3 instance.
    constructor(IExchange exchange_)
        public
        Transformer()
    {
        exchange = exchange_;
        erc20Proxy = exchange_.getAssetProxy(ERC20_ASSET_PROXY_ID);
    }

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
        returns (bytes4 success)
    {
        TransformData memory data = abi.decode(data_, (TransformData));

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

        if (data.side == Side.Sell && data.fillAmount == MAX_UINT256) {
            // If `sellAmount == -1 then we are selling
            // the entire balance of `sellToken`. This is useful in cases where
            // the exact sell amount is not exactly known in advance, like when
            // unwrapping Chai/cUSDC/cDAI.
            data.fillAmount = data.sellToken.getTokenBalanceOf(address(this));
        }

        // Approve the ERC20 proxy to spend `sellToken`.
        data.sellToken.approveIfBelow(erc20Proxy, data.fillAmount);

        // Fill the orders.
        uint256 singleProtocolFee = exchange.protocolFeeMultiplier().safeMul(tx.gasprice);
        uint256 ethRemaining = address(this).balance;
        uint256 boughtAmount = 0;
        uint256 soldAmount = 0;
        for (uint256 i = 0; i < data.orders.length; ++i) {
            // Check if we've hit our targets.
            if (data.side == Side.Sell) {
                // Market sell check.
                if (soldAmount >= data.fillAmount) {
                    break;
                }
            } else {
                // Market buy check.
                if (boughtAmount >= data.fillAmount) {
                    break;
                }
            }

            // Ensure we have enough ETH to cover the protocol fee.
            if (ethRemaining < singleProtocolFee) {
                LibTransformERC20RichErrors
                    .InsufficientProtocolFeeError(ethRemaining, singleProtocolFee)
                    .rrevert();
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
                    data.fillAmount.safeSub(soldAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : MAX_UINT256
                    ),
                    singleProtocolFee
                );
            } else {
                // Market buy.
                results = _buyFromOrder(
                    data.buyToken,
                    data.sellToken,
                    data.orders[i],
                    data.signatures[i],
                    data.fillAmount.safeSub(boughtAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : MAX_UINT256
                    ),
                    singleProtocolFee
                );
            }

            // Accumulate totals.
            soldAmount = soldAmount.safeAdd(results.takerTokenSoldAmount);
            boughtAmount = boughtAmount.safeAdd(results.makerTokenBoughtAmount);
            ethRemaining = ethRemaining.safeSub(results.protocolFeePaid);
        }

        // Ensure we hit our targets.
        if (data.side == Side.Sell) {
            // Market sell check.
            if (soldAmount < data.fillAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillSellQuoteError(
                        address(data.sellToken),
                        soldAmount,
                        data.fillAmount
                    ).rrevert();
            }
        } else {
            // Market buy check.
            if (boughtAmount < data.fillAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillBuyQuoteError(
                        address(data.buyToken),
                        boughtAmount,
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
    /// @param protocolFee The protocol fee needed to fill `order`.
    function _sellToOrder(
        IERC20TokenV06 makerToken,
        IERC20TokenV06 takerToken,
        IExchange.Order memory order,
        bytes memory signature,
        uint256 sellAmount,
        uint256 protocolFee
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

        // Clamp fill amount to order size.
        takerTokenFillAmount = LibSafeMathV06.min256(
            takerTokenFillAmount,
            order.takerAssetAmount
        );

        // Perform the fill.
        return _fillOrder(
            order,
            signature,
            takerTokenFillAmount,
            protocolFee,
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
    /// @param protocolFee The protocol fee needed to fill `order`.
    function _buyFromOrder(
        IERC20TokenV06 makerToken,
        IERC20TokenV06 takerToken,
        IExchange.Order memory order,
        bytes memory signature,
        uint256 buyAmount,
        uint256 protocolFee
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

        // Clamp to order size.
        takerTokenFillAmount = LibSafeMathV06.min256(
            order.takerAssetAmount,
            takerTokenFillAmount
        );

        // Perform the fill.
        return _fillOrder(
            order,
            signature,
            takerTokenFillAmount,
            protocolFee,
            makerToken,
            takerFeeToken == takerToken
        );
    }

    /// @dev Attempt to fill an order. If the fill reverts, the revert will be
    ///      swallowed and `results` will be zeroed out.
    /// @param order The order to fill.
    /// @param signature The order signature.
    /// @param takerAssetFillAmount How much taker asset to fill.
    /// @param protocolFee The protocol fee needed to fill this order.
    /// @param makerToken The maker token.
    /// @param isTakerFeeInTakerToken Whether the taker fee token is the same as the
    ///        taker token.
    function _fillOrder(
        IExchange.Order memory order,
        bytes memory signature,
        uint256 takerAssetFillAmount,
        uint256 protocolFee,
        IERC20TokenV06 makerToken,
        bool isTakerFeeInTakerToken
    )
        private
        returns (FillOrderResults memory results)
    {
        // Track changes in the maker token balance.
        uint256 initialMakerTokenBalance = makerToken.balanceOf(address(this));
        try
            exchange.fillOrder
                {value: protocolFee}
                (order, takerAssetFillAmount, signature)
            returns (IExchange.FillResults memory fillResults)
        {
            // Update maker quantity based on changes in token balances.
            results.makerTokenBoughtAmount = makerToken.balanceOf(address(this))
                .safeSub(initialMakerTokenBalance);
            // We can trust the other fill result quantities.
            results.protocolFeePaid = fillResults.protocolFeePaid;
            results.takerTokenSoldAmount = fillResults.takerAssetFilledAmount;
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
