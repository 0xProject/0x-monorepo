pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {

    /// @dev Performs the 0x Exchange validation and calculations, without performing any state changes.
    /// @param order An Order struct containing order specifications.
    /// @param takerTokenFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderQuote(Order order, uint256 takerTokenFillAmount)
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
            return fillResults;
        }

        // Validate order is not cancelled
        // TODO when exchange has cancelled function public view
        // if (Exchange(exchange).cancelled(orderHash)) {
        //     return fillResults;
        // }

        fillResults.makerTokenFilledAmount = EXCHANGE.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFee > 0) {
                fillResults.makerFeePaid = EXCHANGE.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
            }
            if (order.takerFee > 0) {
                fillResults.takerFeePaid = EXCHANGE.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
            }
        }

        return fillResults;
    }

    /// @dev Calculates a total for selling takerTokenFillAmount across all orders. Including the fees
    ///      required to be paid. 
    /// @param orders An array of Order struct containing order specifications.
    /// @param takerTokenFillAmount A number representing the amount of this order to fill.
    /// @return Amounts filled and fees paid by maker and taker.
    function marketSellOrdersQuote(Order[] orders, uint256 takerTokenFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].takerAssetData, orders[0].takerAssetData));
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
    function marketBuyOrdersQuote(Order[] orders, uint256 makerTokenFillAmount)
        public
        view
        returns (Exchange.FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(areBytesEqual(orders[i].takerAssetData, orders[0].takerAssetData));
            uint256 remainingTakerBuyAmount = safeSub(makerTokenFillAmount, fillResult.takerTokenFilledAmount);
            uint256 remainingTakerSellAmount = EXCHANGE.getPartialAmount(
                remainingTakerBuyAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount
            );

            Exchange.FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerSellAmount);

            addFillResults(fillResult, quoteFillResult);
            if (fillResult.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return fillResult;
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