pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderExchange is MixinForwarderCore {
    // Add the functionality here until it is merged into v2-prototype
    function marketSellOrders(
        Order[] orders,
        uint256 takerSellAmount,
        bytes[] signatures)
        public
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerTokenFillAmount = safeSub(takerSellAmount, fillResult.takerAmountSold);
            uint256 takerTokenFilledAmount  =
                exchange.fillOrder(
                    orders[i],
                    remainingTakerTokenFillAmount,
                    signatures[i]);

            uint256 makerTokenFilledAmount = exchange.getPartialAmount(
                takerTokenFilledAmount,
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount);

            fillResult.makerAmountSold = safeAdd(fillResult.makerAmountSold, makerTokenFilledAmount);
            fillResult.takerAmountSold = safeAdd(fillResult.takerAmountSold, takerTokenFilledAmount);
            // fillResult.makerFeePaid = safeAdd(quoteFillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            // fillResult.takerFeePaid = safeAdd(quoteFillResult.takerFeePaid, quoteFillResult.takerFeePaid);

            if (fillResult.takerAmountSold == takerSellAmount) {
                break;
            }
        }
        return fillResult;
    }


    function marketBuyOrders(
        Order[] orders,
        uint256 takerBuyAmount,
        bytes[] signatures)
        public
        returns (FillResults memory fillResult)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);
            uint256 remainingTakerBuyAmount = safeSub(takerBuyAmount, fillResult.makerAmountSold);
            uint256 remainingTakerSellAmount = exchange.getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingTakerBuyAmount
            );
            uint256 takerTokenFilledAmount  =
                exchange.fillOrder(
                    orders[i],
                    remainingTakerSellAmount,
                    signatures[i]);

            fillResult.makerAmountSold = safeAdd(fillResult.makerAmountSold, remainingTakerSellAmount);
            fillResult.takerAmountSold = safeAdd(fillResult.takerAmountSold, takerTokenFilledAmount);
            // fillResult.makerFeePaid = safeAdd(quoteFillResult.makerFeePaid, quoteFillResult.makerFeePaid);
            // fillResult.takerFeePaid = safeAdd(quoteFillResult.takerFeePaid, quoteFillResult.takerFeePaid);

            if (fillResult.makerAmountSold == takerBuyAmount) {
                break;
            }
        }
        return fillResult;
    }
    // function marketBuyOrders(
    //     Order[] orders,
    //     uint256 takerTokenFillAmount,
    //     bytes[] signatures)
    //     public
    //     returns (FillResults memory fillResult)
    // {
    //     var (makerTokenFilledAmount,
    //         takerTokenFilledAmount,
    //         makerFeeAmountPaid,
    //         takerFeeAmountPaid) = 
    //     Exchange(exchange).marketBuyOrders(orders, takerTokenFillAmount, signatures);
    //     fillResult.makerAmountSold = makerTokenFilledAmount;
    //     fillResult.takerAmountSold = takerTokenFilledAmount;
    //     fillResult.makerFeePaid = makerFeeAmountPaid;
    //     fillResult.takerFeePaid = takerFeeAmountPaid;
    //     return fillResult;
    // }
    // function marketSellOrders(
    //     Order[] orders,
    //     uint256 takerTokenFillAmount,
    //     bytes[] signatures)
    //     public
    //     returns (FillResults memory fillResult)
    // {
    //     var (makerTokenFilledAmount,
    //         takerTokenFilledAmount,
    //         makerFeeAmountPaid,
    //         takerFeeAmountPaid) = 
    //     Exchange(exchange).marketFillOrders(orders, takerTokenFillAmount, signatures);
    //     fillResult.makerAmountSold = makerTokenFilledAmount;
    //     fillResult.takerAmountSold = takerTokenFilledAmount;
    //     fillResult.makerFeePaid = makerFeeAmountPaid;
    //     fillResult.takerFeePaid = takerFeeAmountPaid;
    //     return fillResult;
    // }
}