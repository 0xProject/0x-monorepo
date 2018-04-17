pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {

    function fillOrderQuote(
        Order order,
        uint256 takerTokenFillAmount,
        bytes signature)
        public
        view
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

    function marketSellOrdersQuote(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        internal
        view
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, fillResult.takerTokenFilledAmount);
            FillResults memory quoteFillResult = fillOrderQuote(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]);

            addFillResults(fillResult, quoteFillResult);
            if (fillResult.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return fillResult;
    }

    function marketBuyOrdersQuote(
        Order[] orders,
        uint256 makerTokenFillAmount,
        bytes[] signatures)
        internal
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
            FillResults memory quoteFillResult = fillOrderQuote(
                orders[i],
                remainingTakerSellAmount,
                signatures[i]);

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