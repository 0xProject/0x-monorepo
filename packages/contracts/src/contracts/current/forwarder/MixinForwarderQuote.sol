pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {

    /// @dev Performs the 0x Exchange validation and calculations, without performing any state changes.
    /// @param order An Order struct containing order specifications.
    /// @param takerTokenFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderQuote(Order memory order, uint256 takerTokenFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = EXCHANGE.getOrderHash(order);
        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, EXCHANGE.getUnavailableTakerTokenAmount(orderHash));

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            return fillResults;
        }

        // Validate order availability
        fillResults.takerTokenFilledAmount = min256(takerTokenFillAmount, remainingTakerTokenAmount);
        if (fillResults.takerTokenFilledAmount == 0) {
            return fillResults;
        }

        // Validate fill order rounding
        if (isRoundingError(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount)) {
            fillResults.takerTokenFilledAmount = 0;
            return fillResults;
        }

        // Validate order is not cancelled
        // TODO when exchange has cancelled function public view
        // if (Exchange(exchange).cancelled(orderHash)) {
        //     return fillResults;
        // }

        fillResults.makerTokenFilledAmount = getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFee > 0) {
                fillResults.makerFeePaid = getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
            }
            if (order.takerFee > 0) {
                fillResults.takerFeePaid = getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
            }
        }

        return fillResults;
    }

    /// @dev Calculates a total for selling takerTokenFillAmount across all orders. Including the fees
    ///      required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param takerTokenFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function marketSellOrdersQuote(Order[] memory orders, uint256 takerTokenFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData));
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, fillResult.takerTokenFilledAmount);

            Exchange.FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerTokenFillAmount);

            addFillResults(fillResult, quoteFillResult);
            if (fillResult.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return fillResult;
    }

    /// @dev Calculates a total for buying makerTokenFillAmount across all orders. Including the fees
    ///      required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param makerTokenFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function marketBuyOrdersQuote(Order[] memory orders, uint256 makerTokenFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData));
            uint256 remainingMakerTokenFillAmount = safeSub(makerTokenFillAmount, fillResult.takerTokenFilledAmount);
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingMakerTokenFillAmount
            );  

            Exchange.FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerTokenFillAmount);

            addFillResults(fillResult, quoteFillResult);
            if (fillResult.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return fillResult;
    }

    /// @dev Calculates a quote total for buyTokens. This is useful for off-chain queries to 
    ///      ensure all calculations are performed atomically for consistent results
    /// @param orders An array of Order struct containing order specifications.
    /// @param feeOrders An array of Order struct containing order specifications.
    /// @param sellTokenAmount A number representing the amount of this order to fill.
    /// @return Quoted amounts which will be filled
    function buyTokensQuote(
        Order[] memory orders,
        Order[] memory feeOrders,
        uint256 sellTokenAmount)
        public
        view
        returns (Exchange.FillResults memory totalFillResult)
    {
        uint256 takerTokenBalance = sellTokenAmount;

        Exchange.FillResults memory tokensSellQuote = marketSellOrdersQuote(orders, sellTokenAmount);
        Exchange.FillResults memory requestedTokensResult;
        if (tokensSellQuote.takerFeePaid > 0) {
            // Fees are required for these orders
            // Buy enough ZRX to cover the future market sell
            Exchange.FillResults memory feeTokensResult = buyFeeTokensQuote(feeOrders, tokensSellQuote.takerFeePaid);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerTokenFilledAmount);
            // Make our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = marketSellOrdersQuote(orders, takerTokenBalance);
            // Update our return FillResult with the additional fees
            totalFillResult.takerFeePaid = feeTokensResult.takerFeePaid;
        } else {
            // Make our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = marketSellOrdersQuote(orders, takerTokenBalance);
        }
        // Update our return FillResult with the market sell
        addFillResults(totalFillResult, requestedTokensResult);
        // Ensure the token abstraction was fair if fees were proportionally too high, we fail
        // require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerTokenFilledAmount), ERROR_UNACCEPTABLE_THRESHOLD);
        return totalFillResult;
    }
    function buyFeeTokensQuote(
        Order[] memory feeOrders,
        uint256 feeAmount)
        public
        view
        returns (Exchange.FillResults memory totalFillResult)
    {
        address token = readAddress(feeOrders[0].makerAssetData, 1);
        require(token == address(ZRX_TOKEN), ERROR_INVALID_INPUT);
        // Quote the fees
        Exchange.FillResults memory marketBuyFeeQuote = marketBuyOrdersQuote(feeOrders, feeAmount);
        // Buy enough ZRX to cover the future market sell as well as this market buy
        Exchange.FillResults memory marketBuyFillResult = marketBuyOrdersQuote(
            feeOrders,
            safeAdd(feeAmount, marketBuyFeeQuote.takerFeePaid));
        addFillResults(totalFillResult, marketBuyFillResult);
        return totalFillResult;
    }
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public
        pure
        returns (bool isError)
    {
        uint256 remainder = mulmod(target, numerator, denominator);
        if (remainder == 0) {
            return false; // No rounding error.
        }

        uint256 errPercentageTimes1000000 = safeDiv(
            safeMul(remainder, 1000000),
            safeMul(numerator, target)
        );
        isError = errPercentageTimes1000000 > 1000;
        return isError;
    }
}