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

    uint16  constant public EXTERNAL_QUERY_GAS_LIMIT = 4999;    // Changes to state require at least 5000 gas
    uint16  constant public MAX_FEE = 1000; // 10%

    uint16  constant ALLOWABLE_EXCHANGE_PERC = 9800; // 98%
    uint256 constant MAX_UINT = 2 ** 256 - 1;
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
        require(msg.value > 0);
        require(orders[0].takerTokenAddress == address(etherToken));
        etherToken.deposit.value(msg.value)();
        return fillTokenOrders(orders, signatures, feeOrders, feeSignatures, msg.value);
    }

    function fillOrdersFee(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (FillResults totalFillResult)
    {
        require(msg.value > 0);
        require(orders[0].takerTokenAddress == address(etherToken));
        require(feeProportion <= MAX_FEE);

        uint256 remainingEthAmount = msg.value;
        if (feeProportion > 0 && feeRecipient != address(0x0)) {
            // 1.5% is 150, allowing for 2 decimal precision, i.e 0.05% is 5
            uint256 feeRecipientFeeAmount = safeDiv(safeMul(msg.value, feeProportion), 10000);
            remainingEthAmount = safeSub(msg.value, feeRecipientFeeAmount);
            // Transfer the fee to the fee recipient
            feeRecipient.transfer(feeRecipientFeeAmount);
        }
        etherToken.deposit.value(remainingEthAmount)();
        return fillTokenOrders(orders, signatures, feeOrders, feeSignatures, remainingEthAmount);
    }

    function fillTokenOrders(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint256 sellTokenAmount)
        public
        returns (FillResults totalFillResult)
    {
        uint256 takerTokenBalance = sellTokenAmount;
        FillResults memory requestedTokensQuoteResult = 
            marketSellOrdersQuote(orders, sellTokenAmount, signatures);
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
                safeAdd(
                    requestedTokensQuoteResult.takerFeePaid,
                    feeTokensQuoteResult.takerFeePaid),
                feeSignatures);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerAmountSold);
        }

        FillResults memory requestedTokensResult = marketSellOrders(orders, takerTokenBalance, signatures);
        totalFillResult.takerAmountSold = requestedTokensResult.takerAmountSold;
        totalFillResult.makerAmountSold = requestedTokensResult.makerAmountSold;
        totalFillResult.makerFeePaid = requestedTokensResult.makerFeePaid;
        totalFillResult.takerFeePaid = safeAdd(totalFillResult.takerFeePaid, requestedTokensResult.takerFeePaid);

        // Ensure the token abstraction was fair 
        require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerAmountSold));

        // Transfer all tokens to msg.sender
        transferToken(orders[0].makerTokenAddress, msg.sender, totalFillResult.makerAmountSold);
        return totalFillResult;
    }

    // There are issues in solidity when referencing another contracts structure in return types
    // Here we map to our structure of FillResults temporarily
    // this is using an old/temporary implementation of market sell and buy which returns more data.
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
        internal
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

    function transferToken(address token, address account, uint amount)
        internal
    {
        require(Token(token).transfer(account, amount));
    }

    function isAcceptableThreshold(uint256 requestedTokenAmount, uint256 soldTokenAmount)
        public
        constant
        returns (bool)
    {
        uint256 exchangedProportion = safeDiv(safeMul(requestedTokenAmount, ALLOWABLE_EXCHANGE_PERC), 10000);
        return soldTokenAmount >= exchangedProportion;
    }
}
