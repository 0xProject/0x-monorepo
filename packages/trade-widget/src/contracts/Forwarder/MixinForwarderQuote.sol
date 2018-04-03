pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../current/protocol/Exchange/Exchange.sol";
import "./MixinForwarderCore.sol";

contract MixinForwarderQuote is MixinForwarderCore {
    function marketSellOrdersQuote(
        Order[] orders,
        uint256 takerTokenFillAmount,
        bytes[] signatures)
        internal
        view
        returns (FillResults memory fillResult)
    {
        var (makerTokenFilledAmount,
            takerTokenFilledAmount,
            makerFeeAmountPaid,
            takerFeeAmountPaid) = 
        Exchange(exchange).marketSellOrdersQuote(orders, takerTokenFillAmount, signatures);
        fillResult.makerAmountSold = makerTokenFilledAmount;
        fillResult.takerAmountSold = takerTokenFilledAmount;
        fillResult.makerFeePaid = makerFeeAmountPaid;
        fillResult.takerFeePaid = takerFeeAmountPaid;
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
        var (makerTokenFilledAmount,
            takerTokenFilledAmount,
            makerFeeAmountPaid,
            takerFeeAmountPaid) = 
        Exchange(exchange).marketBuyOrdersQuote(orders, takerBuyAmount, signatures);
        fillResult.makerAmountSold = makerTokenFilledAmount;
        fillResult.takerAmountSold = takerTokenFilledAmount;
        fillResult.makerFeePaid = makerFeeAmountPaid;
        fillResult.takerFeePaid = takerFeeAmountPaid;
        return fillResult;
    }
}