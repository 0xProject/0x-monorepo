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
import "./IERC20Transformer.sol";
import "./LibERC20Transformer.sol";


/// @dev A transformer that fills an ERC20 market sell/buy quote.
contract FillQuoteTransformer is
    IERC20Transformer
{
    /// @dev Transform data to ABI-encode and pass into `transform()`.
    struct TransformData {
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
        // Amount of `sellToken` to sell. May be `uint256(-1)` to sell entire
        // amount of `sellToken` received. Zero if performing a market buy.
        uint256 sellAmount;
        // Amount of `buyToken` to buy. Zero if performing a market sell.
        uint256 buyAmount;
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
    bytes4 constant private ERC20_ASSET_PROXY_ID = 0xf47261b0;

    /// @dev The Exchange contract.
    IExchange public immutable exchange;
    /// @dev The nonce of the deployer when deploying this contract.
    uint256 public immutable deploymentNonce;
    /// @dev The ERC20Proxy address.
    address public immutable erc20Proxy;

    using LibERC20TokenV06 for IERC20TokenV06;
    using LibERC20Transformer for IERC20TokenV06;
    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;

    /// @dev Create this contract.
    /// @param exchange_ The Exchange V3 instance.
    /// @param deploymentNonce_ The nonce of the deployer when deploying this contract.
    constructor(IExchange exchange_, uint256 deploymentNonce_) public {
        exchange = exchange_;
        erc20Proxy = exchange_.getAssetProxy(ERC20_ASSET_PROXY_ID);
        deploymentNonce = deploymentNonce_;
    }

    /// @dev Sell this contract's entire balance of of `sellToken` in exchange
    ///      for `buyToken` by filling `orders`. Protocol fees should be attached
    ///      to this call. `buyToken` and excess ETH will be transferred back to the caller.
    ///      This function cannot be re-entered.
    /// @param data_ ABI-encoded `TransformData`.
    /// @return rlpDeploymentNonce RLP-encoded deployment nonce of the deployer
    ///         when this transformer was deployed. This is used to verify that
    ///         this transformer was deployed by a trusted contract.
    function transform(
        bytes32, // callDataHash,
        address payable, // taker,
        bytes calldata data_
    )
        external
        override
        returns (bytes memory rlpDeploymentNonce)
    {
        TransformData memory data = abi.decode(data_, (TransformData));

        // Validate data fields.
        if (data.sellToken.isTokenETH() ||
            data.buyToken.isTokenETH() ||
            data.orders.length != data.signatures.length)
        {
            LibTransformERC20RichErrors.InvalidTransformDataError(data_).rrevert();
        }

        // If `sellAmount == -1` and `buyAmount == 0` then we are selling
        // the entire balance of `sellToken`. This is useful in cases where
        // the exact sell amount is not exactly known in advance, like when
        // unwrapping Chai/cUSDC/cDAI.
        if (data.sellAmount == uint256(-1) && data.buyAmount == 0) {
            data.sellAmount = data.sellToken.getTokenBalanceOf(address(this));
        }

        // Approve the ERC20 proxy to spend `sellToken`.
        data.sellToken.approveIfBelow(erc20Proxy, data.sellAmount);

        // Fill the orders.
        uint256 singleProtocolFee = exchange.protocolFeeMultiplier().safeMul(tx.gasprice);
        uint256 ethRemaining = address(this).balance;
        uint256 boughtAmount = 0;
        uint256 soldAmount = 0;
        for (uint256 i = 0; i < data.orders.length; ++i) {
            // Check if we've hit our targets.
            if (data.buyAmount == 0) {
                // Market sell check.
                if (soldAmount >= data.sellAmount) {
                    break;
                }
            } else {
                // Market buy check.
                if (boughtAmount >= data.buyAmount) {
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
            if (data.buyAmount == 0) {
                // Market sell.
                results = _sellToOrder(
                    data.buyToken,
                    data.sellToken,
                    data.orders[i],
                    data.signatures[i],
                    data.sellAmount.safeSub(soldAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : uint256(-1)
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
                    data.buyAmount.safeSub(boughtAmount).min256(
                        data.maxOrderFillAmounts.length > i
                        ? data.maxOrderFillAmounts[i]
                        : uint256(-1)
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
        if (data.buyAmount == 0) {
            // Market sell check.
            if (soldAmount < data.sellAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillSellQuoteError(
                        address(data.sellToken),
                        soldAmount,
                        data.sellAmount
                    ).rrevert();
            }
        } else {
            // Market buy check.
            if (boughtAmount < data.buyAmount) {
                LibTransformERC20RichErrors
                    .IncompleteFillBuyQuoteError(
                        address(data.buyToken),
                        boughtAmount,
                        data.buyAmount
                    ).rrevert();
            }
        }
        return LibERC20Transformer.rlpEncodeNonce(deploymentNonce);
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
        IERC20TokenV06 takerFeeToken = order.takerFeeAssetData.length == 0
            ? IERC20TokenV06(address(0))
            : _getTokenFromERC20AssetData(order.takerFeeAssetData);

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
                    takerTokenFillAmount
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
        IERC20TokenV06 takerFeeToken = order.takerFeeAssetData.length == 0
            ? IERC20TokenV06(address(0))
            : _getTokenFromERC20AssetData(order.takerFeeAssetData);

        uint256 makerTokenFillAmount = buyAmount;

        if (order.takerFee != 0) {
            if (takerFeeToken == makerToken) {
                // Taker fee is payable in the maker token.
                // Increase the fill amount to account for maker tokens being
                // lost to the taker fee.
                // makerTokenFillAmount' =
                //  (order.makerAssetAmount * makerTokenFillAmount) /
                //  (order.makerAssetAmount - order.takerFee)
                makerTokenFillAmount = LibMathV06.getPartialAmountCeil(
                    order.makerAssetAmount,
                    order.makerAssetAmount.safeSub(order.takerFee),
                    makerTokenFillAmount
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

        // Convert maker fill amount to taker fill amount.
        uint256 takerTokenFillAmount = LibSafeMathV06.min256(
            order.takerAssetAmount,
            LibMathV06.getPartialAmountCeil(
                makerTokenFillAmount,
                order.makerAssetAmount,
                order.takerAssetAmount
            )
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
        results.makerTokenBoughtAmount = makerToken.balanceOf(address(this));
        try
            exchange.fillOrder
                {value: protocolFee}
                (order, takerAssetFillAmount, signature)
            returns (IExchange.FillResults memory fillResults)
        {
            // Update maker quantity based on changes in token balances.
            results.makerTokenBoughtAmount = makerToken.balanceOf(address(this))
                .safeSub(results.makerTokenBoughtAmount);
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
            // If the fill fails, zero out fill quantities.
            results.makerTokenBoughtAmount = 0;
        }
    }

    /// @dev Extract the token from plain ERC20 asset data.
    /// @param assetData The order asset data.
    function _getTokenFromERC20AssetData(bytes memory assetData)
        private
        pure
        returns (IERC20TokenV06 token)
    {
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
