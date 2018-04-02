pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

// import "../../../../contracts/src/contracts/current/protocol/Exchange/Exchange.sol";
import "../current/protocol/Exchange/Exchange.sol";
import "../../../../contracts/src/contracts/current/protocol/TokenTransferProxy/TokenTransferProxy.sol";
import { WETH9 as EtherToken } from  "../../../../contracts/src/contracts/current/tokens/WETH9/WETH9.sol";

contract Forwarder is SafeMath, LibOrder {

    Exchange exchange;
    TokenTransferProxy tokenProxy;
    EtherToken etherToken;
    Token zrxToken;

    uint256 constant MAX_UINT = 2 ** 256 - 1;
    uint16 constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;    // Changes to state require at least 5000 gas
    struct FillResults {
        uint256 makerAmountSold;
        uint256 takerAmountSold;
        uint256 makerFeePaid;
        uint256 takerFeePaid;
    }

    function Forwarder(
        Exchange _exchange,
        TokenTransferProxy _tokenProxy,
        EtherToken _etherToken,
        Token _zrxToken)
        public
    {
        exchange = _exchange;
        tokenProxy = _tokenProxy;
        etherToken = _etherToken;
        zrxToken = _zrxToken;
    }

    function initialize()
        external
    {
        etherToken.approve(address(tokenProxy), MAX_UINT);
        zrxToken.approve(address(tokenProxy), MAX_UINT);
    }

    function fillOrders(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures)
        payable
        public
        returns (FillResults totalFillResult)
    {
        assert(msg.value > 0);
        // market fill ensures ALL of the orders are the same
        assert(orders[0].takerTokenAddress == address(etherToken));

        etherToken.deposit.value(msg.value)();
        uint256 wethBalance = msg.value;
        FillResults memory requestedTokensQuoteResult = 
            marketSellOrdersQuote(orders, msg.value, signatures);
        if (requestedTokensQuoteResult.takerFeePaid > 0) {
            // Fees are required for these orders
            FillResults memory feeTokensQuoteResult =
                marketBuyOrdersQuote(
                    feeOrders,
                    requestedTokensQuoteResult.takerFeePaid,
                    feeSignatures);

            FillResults memory feeTokensResult = 
                marketBuyOrders(
                feeOrders,
                requestedTokensQuoteResult.takerFeePaid,
                // safeAdd(
                //     requestedTokensQuoteResult.takerFeePaid,
                //     feeTokensQuoteResult.takerFeePaid),
                feeSignatures);
            wethBalance = safeSub(wethBalance, feeTokensResult.takerAmountSold);
        }

        // uint256 wethBalance = Token(orders[0].takerTokenAddress).balanceOf(address(this));
        // TODO check some % threshold for an ok order, say atleast 98% of msg.value was filled
        FillResults memory requestedTokensResult = marketSellOrders(orders, wethBalance, signatures);
        totalFillResult.takerAmountSold = requestedTokensResult.takerAmountSold;
        totalFillResult.makerAmountSold = requestedTokensResult.makerAmountSold;
        totalFillResult.makerFeePaid = requestedTokensResult.makerFeePaid;
        totalFillResult.takerFeePaid = safeAdd(totalFillResult.takerFeePaid, requestedTokensResult.takerFeePaid);

        // uint256 tokenBalance = Token(orders[0].makerTokenAddress).balanceOf(address(this));
        // transferToken(orders[0].makerTokenAddress, msg.sender, tokenBalance);
        transferToken(orders[0].makerTokenAddress, msg.sender, totalFillResult.makerAmountSold);
        return totalFillResult;
    }

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

    function marketSellOrdersQuote(
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
        public
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

    function marketBuyOrdersQuoteMe(
        Order[] orders,
        uint256 takerBuyAmount,
        bytes[] signatures)
        public
        returns (
            uint256 makerTokenFilledAmount,
            uint256 takerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        )
    {
        var (makerTokenFilledAmountQuote,
            takerTokenFilledAmountQuote,
            makerFeeAmountPaidQuote,
            takerFeeAmountPaidQuote) = 
        Exchange(exchange).marketBuyOrdersQuote(orders, takerBuyAmount, signatures);
        makerTokenFilledAmount = makerTokenFilledAmountQuote;
        takerTokenFilledAmount = takerTokenFilledAmountQuote;
        makerFeeAmountPaid = makerFeeAmountPaidQuote;
        takerFeeAmountPaid = takerFeeAmountPaidQuote;
        return (makerTokenFilledAmount, takerTokenFilledAmount, makerFeeAmountPaid, takerFeeAmountPaid);
    }

    function marketSellOrdersQuoteMe(
        Order[] orders,
        uint256 takerBuyAmount,
        bytes[] signatures)
        public
        returns (
            uint256 makerTokenFilledAmount,
            uint256 takerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        )
    {
        var (makerTokenFilledAmountQuote,
            takerTokenFilledAmountQuote,
            makerFeeAmountPaidQuote,
            takerFeeAmountPaidQuote) = 
        Exchange(exchange).marketSellOrdersQuote(orders, takerBuyAmount, signatures);
        makerTokenFilledAmount = makerTokenFilledAmountQuote;
        takerTokenFilledAmount = takerTokenFilledAmountQuote;
        makerFeeAmountPaid = makerFeeAmountPaidQuote;
        takerFeeAmountPaid = takerFeeAmountPaidQuote;
        return (makerTokenFilledAmount, takerTokenFilledAmount, makerFeeAmountPaid, takerFeeAmountPaid);
    }

    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        internal
        view
        returns (uint256)
    {
        return safeDiv(safeMul(numerator, target), denominator);
    }

    function transferToken(address token, address account, uint amount)
        internal
    {
        require(Token(token).transfer(account, amount));
    }
}
