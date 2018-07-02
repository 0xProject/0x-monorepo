pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./MixinErrorMessages.sol";
import "../protocol/Exchange/Exchange.sol";
import "../utils/SafeMath/SafeMath.sol";
import "../utils/LibBytes/LibBytes.sol";

contract MixinBuyFeeTokens is
    MixinErrorMessages,
    LibFillResults,
    LibOrder,
    LibMath
{
    Exchange EXCHANGE;
    bytes internal ZRX_ASSET_DATA;
    bytes internal WETH_ASSET_DATA;

    /// @dev Buys feeAmount of ZRX fee tokens, taking into account the fees on buying fee tokens. This will guarantee
    ///      At least feeAmount of ZRX fee tokens are purchased (sometimes slightly over due to rounding issues).
    ///      It is possible that a request to buy 200 ZRX fee tokens will require purchasing 202 ZRX tokens
    ///      As 2 ZRX is required to purchase the 200 ZRX fee tokens. This guarantees at least 200 ZRX for future purchases.
    /// @param orders An array of Order struct containing order specifications for fees.
    /// @param signatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeAmount The number of requested ZRX fee tokens.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker. makerTokenAmount is the zrx amount deducted of fees
    function buyFeeTokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        uint256 feeAmount
    )
        internal
        returns (Exchange.FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            // All of these are ZRX/WETH, we can drop the respective assetData from callData
            orders[i].makerAssetData = ZRX_ASSET_DATA;
            orders[i].takerAssetData = WETH_ASSET_DATA;
            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(feeAmount, totalFillResults.makerAssetFilledAmount);
            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                safeSub(orders[i].makerAssetAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingMakerTokenFillAmount
            );
            // Attempt to sell the remaining amount of takerToken
            // Round up the amount to ensure we don't under buy by a fractional amount
            Exchange.FillResults memory singleFillResult = EXCHANGE.fillOrder(
                orders[i],
                safeAdd(remainingTakerTokenFillAmount, 1),
                signatures[i]
            );
            // We didn't buy the full amount when buying ZRX as some were taken for fees
            singleFillResult.makerAssetFilledAmount = safeSub(singleFillResult.makerAssetFilledAmount, singleFillResult.takerFeePaid);
            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResult);
            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerAssetFilledAmount >= feeAmount) {
                break;
            }
        }
        return totalFillResults;
    }
}
