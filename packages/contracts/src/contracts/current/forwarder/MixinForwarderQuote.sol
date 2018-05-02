pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {

    /// @dev Performs the 0x Exchange validation and calculations, without performing any state changes.
    /// @param order An Order struct containing order specifications.
    /// @param takerAssetFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderQuote(Order memory order, uint256 takerAssetFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = getOrderHash(order);
        uint256 remainingTakerAssetAmount = safeSub(order.takerAssetAmount, EXCHANGE.getUnavailableTakerTokenAmount(orderHash));
        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            return fillResults;
        }
        // Validate order availability
        fillResults.takerAssetFilledAmount = min256(takerAssetFillAmount, remainingTakerAssetAmount);
        if (fillResults.takerAssetFilledAmount == 0) {
            return fillResults;
        }
        // Validate fill order rounding
        if (isRoundingError(fillResults.takerAssetFilledAmount, order.takerAssetAmount, order.makerAssetAmount)) {
            fillResults.takerAssetFilledAmount = 0;
            return fillResults;
        }
        fillResults.makerAssetFilledAmount = getPartialAmount(fillResults.takerAssetFilledAmount, order.takerAssetAmount, order.makerAssetAmount);
        if (order.makerFee > 0) {
            fillResults.makerFeePaid = getPartialAmount(fillResults.takerAssetFilledAmount, order.takerAssetAmount, order.makerFee);
        }
        if (order.takerFee > 0) {
            fillResults.takerFeePaid = getPartialAmount(fillResults.takerAssetFilledAmount, order.takerAssetAmount, order.takerFee);
        }
        return fillResults;
    }

    /// @dev Calculates a total for selling takerTokenFillAmount across all orders. Including the fees
    ///      required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param takerAssetFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function expectedMaketSellFillResults(Order[] memory orders, uint256 takerAssetFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData), "all orders must be the same token pair");
            uint256 remainingTakerAssetFillAmount = safeSub(takerAssetFillAmount, fillResult.takerAssetFilledAmount);

            Exchange.FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerAssetFillAmount);

            addFillResults(fillResult, quoteFillResult);
            if (fillResult.takerAssetFilledAmount == takerAssetFillAmount) {
                break;
            }
        }
        return fillResult;
    }

    /// @dev Calculates a quote total for buyTokens. This is useful for off-chain queries to 
    ///      ensure all calculations are performed atomically for consistent results
    /// @param orders An array of Order struct containing order specifications.
    /// @param feeOrders An array of Order struct containing order specifications.
    /// @param sellAssetAmount A number representing the amount of this order to fill.
    /// @return Quoted amounts which will be filled
    function buyTokensQuote(
        Order[] memory orders,
        Order[] memory feeOrders,
        uint256 sellAssetAmount)
        public
        view
        returns (Exchange.FillResults memory totalFillResult)
    {
        uint256 takerAssetBalance = sellAssetAmount;

        Exchange.FillResults memory expectedMarketSellFillResults = expectedMaketSellFillResults(orders, sellAssetAmount);
        Exchange.FillResults memory requestedTokensResult;
        if (expectedMarketSellFillResults.takerFeePaid > 0) {
            Exchange.FillResults memory expectedBuyFeesFillResults = computeBuyFeesFillResult(feeOrders, expectedMarketSellFillResults.takerFeePaid);
            takerAssetBalance = safeSub(takerAssetBalance, expectedBuyFeesFillResults.takerAssetFilledAmount);
            requestedTokensResult = expectedMaketSellFillResults(orders, takerAssetBalance);
            // Update our return FillResult with the additional fees
            totalFillResult.takerFeePaid = expectedBuyFeesFillResults.takerFeePaid;
        } else {
            // Quote our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = expectedMaketSellFillResults(orders, takerAssetBalance);
        }
        addFillResults(totalFillResult, requestedTokensResult);
        // Ensure the token abstraction was fair if fees were proportionally too high, we fail
        require(isAcceptableThreshold(sellAssetAmount, requestedTokensResult.takerAssetFilledAmount),
            "traded amount does not meet acceptable threshold");
        return totalFillResult;
    }

    /// @dev Calculates a quote total for buyFeeTokens. This is useful for off-chain queries 
    ///      ensuring all calculations are performed atomically for consistent results
    /// @param orders An array of Order struct containing order specifications.
    /// @param zrxAmount A number representing the amount zrx to buy
    /// @return Quoted amounts which will be filled
    function computeBuyFeesFillResult(
        Order[] memory orders,
        uint256 zrxAmount)
        public
        view
        returns (Exchange.FillResults memory totalFillResult)
    {
        address token = readAddress(orders[0].makerAssetData, 1);
        require(token == address(ZRX_TOKEN), "order taker asset must be ZRX");
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData), "all orders must be the same token pair");
            uint256 remainingMakerAssetFillAmount = safeSub(zrxAmount, totalFillResult.makerAssetFilledAmount);
            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerAssetFillAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                safeSub(orders[i].makerAssetAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingMakerAssetFillAmount);
            Exchange.FillResults memory singleFillResult = fillOrderQuote(orders[i], safeAdd(remainingTakerAssetFillAmount, 1));

            singleFillResult.makerAssetFilledAmount = safeSub(singleFillResult.makerAssetFilledAmount, singleFillResult.takerFeePaid);
            addFillResults(totalFillResult, singleFillResult);
            if (totalFillResult.makerAssetFilledAmount >= zrxAmount) {
                break;
            }
        }
        return totalFillResult;
    }

}