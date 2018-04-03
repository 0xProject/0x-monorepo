pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";

contract MixinForwarderExchange is MixinForwarderCore {
    // There are issues in solidity when referencing another contracts structure in return types
    // Here we map to our structure of FillResults temporarily
    // this is using an old/temporary implementation of market sell and buy which returns more data.
    // Once merged this can be cleaned up
    function marketSellOrders(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        public
        returns (FillResults memory fillResult)
    {
        var (makerTokenFilledAmount,
            takerTokenFilledAmount,
            makerFeeAmountPaid,
            takerFeeAmountPaid) = 
        Exchange(exchange).marketFillOrders(orders, takerTokenFillAmount, signatures);
        fillResult.makerAmountSold = makerTokenFilledAmount;
        fillResult.takerAmountSold = takerTokenFilledAmount;
        fillResult.makerFeePaid = makerFeeAmountPaid;
        fillResult.takerFeePaid = takerFeeAmountPaid;
        return fillResult;
    }

    function marketBuyOrders(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        public
        returns (FillResults memory fillResult)
    {
        var (makerTokenFilledAmount,
            takerTokenFilledAmount,
            makerFeeAmountPaid,
            takerFeeAmountPaid) = 
        Exchange(exchange).marketBuyOrders(orders, takerTokenFillAmount, signatures);
        fillResult.makerAmountSold = makerTokenFilledAmount;
        fillResult.takerAmountSold = takerTokenFilledAmount;
        fillResult.makerFeePaid = makerFeeAmountPaid;
        fillResult.takerFeePaid = takerFeeAmountPaid;
        return fillResult;
    }
}