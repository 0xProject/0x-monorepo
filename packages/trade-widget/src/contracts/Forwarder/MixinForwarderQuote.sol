pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../current/protocol/Exchange/Exchange.sol";
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
        bytes32 orderHash = Exchange(exchange).getOrderHash(order);
        uint256 remainingTakerTokenAmount =
            safeSub(order.takerTokenAmount,
                    Exchange(exchange).getUnavailableTakerTokenAmount(orderHash));

        // Validate order and maker only if first time seen
        // TODO: Read filled and cancelled only once
        if (safeSub(order.takerTokenAmount, remainingTakerTokenAmount) == 0) {
            require(order.makerTokenAmount > 0);
            require(order.takerTokenAmount > 0);
            require(Exchange(exchange).isValidSignature(orderHash, order.makerAddress, signature));
        }

        // Validate taker
        if (order.takerAddress != address(0)) {
            require(order.takerAddress == msg.sender);
        }
        require(takerTokenFillAmount > 0);

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

        fillResults.makerAmountSold = Exchange(exchange).getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerTokenAmount);

        if (order.feeRecipientAddress != address(0)) {
            if (order.makerFeeAmount > 0) {
                fillResults.makerFeePaid = Exchange(exchange).getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.makerFeeAmount);
            }
            if (order.takerFeeAmount > 0) {
                fillResults.takerFeePaid = Exchange(exchange).getPartialAmount(fillResults.takerAmountSold, order.takerTokenAmount, order.takerFeeAmount);
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
            FillResults memory quoteFillResult = 
            fillOrderQuote(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]);

            fillResult.makerAmountSold = safeAdd(quoteFillResult.makerAmountSold, quoteFillResult.makerAmountSold);
            fillResult.takerAmountSold = safeAdd(quoteFillResult.takerAmountSold, quoteFillResult.takerAmountSold);
            fillResult.makerFeePaid = safeAdd(quoteFillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            fillResult.takerFeePaid = safeAdd(quoteFillResult.takerFeePaid, quoteFillResult.takerFeePaid);

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
            uint256 remainingTakerSellAmount = Exchange(exchange).getPartialAmount(
                remainingTakerBuyAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount
            );
            FillResults memory quoteFillResult = 
            fillOrderQuote(
                orders[i],
                remainingTakerSellAmount,
                signatures[i]);

            fillResult.makerAmountSold = safeAdd(quoteFillResult.makerAmountSold, quoteFillResult.makerAmountSold);
            fillResult.takerAmountSold = safeAdd(quoteFillResult.takerAmountSold, quoteFillResult.takerAmountSold);
            fillResult.makerFeePaid = safeAdd(quoteFillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            fillResult.takerFeePaid = safeAdd(quoteFillResult.takerFeePaid, quoteFillResult.takerFeePaid);

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
        // function marketSellOrdersQuote(
    //     Order[] orders,
    //     uint256 takerTokenFillAmount,
    //     bytes[] signatures)
    //     internal
    //     view
    //     returns (FillResults memory fillResult)
    // {
    //     var (makerTokenFilledAmount,
    //         takerTokenFilledAmount,
    //         makerFeeAmountPaid,
    //         takerFeeAmountPaid) = 
    //     Exchange(exchange).marketSellOrdersQuote(orders, takerTokenFillAmount, signatures);
    //     fillResult.makerAmountSold = makerTokenFilledAmount;
    //     fillResult.takerAmountSold = takerTokenFilledAmount;
    //     fillResult.makerFeePaid = makerFeeAmountPaid;
    //     fillResult.takerFeePaid = takerFeeAmountPaid;
    //     return fillResult;
    // }

    // function marketBuyOrdersQuote(
    //     Order[] orders,
    //     uint256 takerBuyAmount,
    //     bytes[] signatures)
    //     internal
    //     view
    //     returns (FillResults memory fillResult)
    // {
    //     var (makerTokenFilledAmount,
    //         takerTokenFilledAmount,
    //         makerFeeAmountPaid,
    //         takerFeeAmountPaid) = 
    //     Exchange(exchange).marketBuyOrdersQuote(orders, takerBuyAmount, signatures);
    //     fillResult.makerAmountSold = makerTokenFilledAmount;
    //     fillResult.takerAmountSold = takerTokenFilledAmount;
    //     fillResult.makerFeePaid = makerFeeAmountPaid;
    //     fillResult.takerFeePaid = takerFeeAmountPaid;
    //     return fillResult;
    // }
}