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
        returns (FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = exchange.getOrderHash(order);
        uint256 remainingTakerTokenAmount = safeSub(order.takerTokenAmount, exchange.getUnavailableTakerTokenAmount(orderHash));

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

        fillResults.makerTokenFilledAmount = exchange.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFee > 0) {
                fillResults.makerFeePaid = exchange.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.makerFee);
            }
            if (order.takerFee > 0) {
                fillResults.takerFeePaid = exchange.getPartialAmount(fillResults.takerTokenFilledAmount, order.takerTokenAmount, order.takerFee);
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
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, fillResult.takerTokenFilledAmount);

            FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerTokenFillAmount);

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
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(makerTokenFillAmount, fillResult.takerTokenFilledAmount);
            uint256 remainingTakerSellAmount = exchange.getPartialAmount(
                remainingTakerBuyAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount
            );

            FillResults memory quoteFillResult = fillOrderQuote(orders[i], remainingTakerSellAmount);

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