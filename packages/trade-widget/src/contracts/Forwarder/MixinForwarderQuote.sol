pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {

    function fillOrderQuote(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        returns (FillResults memory fillResults)
    {
        // Compute the order hash
        bytes32 orderHash = exchange.getOrderHash(order);
        uint256 remainingTakerTokenAmount = safeSub(
            order.takerTokenAmount,
            exchange.getUnavailableTakerTokenAmount(orderHash));

        // Validate order expiration
        if (block.timestamp >= order.expirationTimeSeconds) {
            return fillResults;
        }

        // Validate order availability
        fillResults.takerAmountSold = min256(takerTokenFillAmount, remainingTakerTokenAmount);
        if (fillResults.takerAmountSold == 0) {
            return fillResults;
        }

        // Validate fill order rounding
        if (isRoundingError(fillResults.takerAmountSold, order.takerTokenAmount, order.makerTokenAmount)) {
            return fillResults;
        }

        // Validate order is not cancelled
        // TODO when exchange has cancelled function public view
        // if (Exchange(exchange).cancelled(orderHash)) {
        //     return fillResults;
        // }

        fillResults.makerAmountSold = exchange.getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFeeAmount > 0) {
                fillResults.makerFeePaid = exchange.getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerFeeAmount);
            }
            if (order.takerFeeAmount > 0) {
                fillResults.takerFeePaid = exchange.getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.takerFeeAmount);
            }
        }

        return fillResults;
    }

    function marketSellOrdersQuote(
        Order[] orders,
        uint256 takerSellAmount,
        bytes[] signatures)
        internal
        view
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerTokenFillAmount = safeSub(takerSellAmount, fillResult.takerAmountSold);
            FillResults memory quoteFillResult = fillOrderQuote(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]);

            fillResult.makerAmountSold = safeAdd(fillResult.makerAmountSold, quoteFillResult.makerAmountSold);
            fillResult.takerAmountSold = safeAdd(fillResult.takerAmountSold, quoteFillResult.takerAmountSold);
            fillResult.makerFeePaid = safeAdd(fillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            fillResult.takerFeePaid = safeAdd(fillResult.takerFeePaid, quoteFillResult.takerFeePaid);

            if (fillResult.takerAmountSold == takerSellAmount) {
                break;
            }
        }
        return fillResult;
    }

    function marketBuyOrdersQuote(
        Order[] orders,
        uint256 takerBuyAmount,
        bytes[] signatures)
        internal
        view
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(takerBuyAmount, fillResult.takerAmountSold);
            uint256 remainingTakerSellAmount = exchange.getPartialAmount(
                remainingTakerBuyAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount
            );
            FillResults memory quoteFillResult = fillOrderQuote(
                orders[i],
                remainingTakerSellAmount,
                signatures[i]);

            fillResult.makerAmountSold = safeAdd(fillResult.makerAmountSold, quoteFillResult.makerAmountSold);
            fillResult.takerAmountSold = safeAdd(fillResult.takerAmountSold, quoteFillResult.takerAmountSold);
            fillResult.makerFeePaid = safeAdd(fillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            fillResult.takerFeePaid = safeAdd(fillResult.takerFeePaid, quoteFillResult.takerFeePaid);

            if (fillResult.makerAmountSold == takerBuyAmount) {
                break;
            }
        }
        return fillResult;
    }

    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public pure
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