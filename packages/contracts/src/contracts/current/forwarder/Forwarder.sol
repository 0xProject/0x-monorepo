pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinERC721Receiver.sol";
import "./MixinForwarderCore.sol";
import "./MixinForwarderQuote.sol";

contract Forwarder is
    MixinForwarderCore,
    MixinForwarderQuote,
    MixinERC721Receiver
{

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

    function buyTokens(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures)
        payable
        public
        returns (FillResults memory totalFillResult)
    {
        require(msg.value > 0);
        require(orders[0].takerTokenAddress == address(etherToken));

        etherToken.deposit.value(msg.value)();
        FillResults memory fillTokensFillResult = marketBuyTokens(orders, signatures, feeOrders, feeSignatures, msg.value);
        addFillResults(totalFillResult, fillTokensFillResult);
        return totalFillResult;
    }

    function buyTokensFee(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (FillResults memory totalFillResult)
    {
        require(msg.value > 0);
        require(orders[0].takerTokenAddress == address(etherToken));
        require(feeProportion <= MAX_FEE);

        uint256 remainingEthAmount = msg.value;
        if (feeProportion > 0 && feeRecipient != address(0x0)) {
            // 1.5% is 150, allowing for 2 decimal precision, i.e 0.05% is 5
            uint256 feeRecipientFeeAmount = safeDiv(safeMul(msg.value, feeProportion), PERCENTAGE_DENOMINATOR);
            remainingEthAmount = safeSub(msg.value, feeRecipientFeeAmount);
            // Transfer the fee to the fee recipient
            feeRecipient.transfer(feeRecipientFeeAmount);
        }

        etherToken.deposit.value(remainingEthAmount)();
        FillResults memory fillTokensFillResult = marketBuyTokens(orders, signatures, feeOrders, feeSignatures, remainingEthAmount);
        addFillResults(totalFillResult, fillTokensFillResult);
        return totalFillResult;
    }


    function marketBuyTokens(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint256 sellTokenAmount)
        private
        returns (FillResults memory totalFillResult)
    {
        uint256 takerTokenBalance = sellTokenAmount;

        FillResults memory tokensSellQuote = 
            marketSellOrdersQuote(orders, sellTokenAmount, signatures);

        if (tokensSellQuote.takerFeePaid > 0) {
            // Fees are required for these orders
            // Buy enough ZRX to cover the future market sell
            FillResults memory feeTokensResult =
                buyFeeTokens(feeOrders, feeSignatures, tokensSellQuote.takerFeePaid);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerTokenFilledAmount);
            totalFillResult.takerFeePaid = feeTokensResult.takerFeePaid;
        }

        // Make our market sell to buy the requested tokens with the remaining balance
        Exchange.FillResults memory requestedTokensResult = exchange.marketSellOrders(orders, takerTokenBalance, signatures);
        // Ensure the token abstraction was fair 
        require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerTokenFilledAmount));
        // Update our return FillResult with the market sell
        addFillResults(totalFillResult, requestedTokensResult);
        // Transfer all tokens to msg.sender
        transferToken(orders[0].makerTokenAddress, msg.sender, totalFillResult.makerTokenFilledAmount);
        return totalFillResult;
    }

    function marketBuyNFT(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint256[] tokenIds)
        private
    {
        uint256 totalFeeAmount;
        for (uint256 i = 0; i < orders.length; i++) {
            totalFeeAmount = safeAdd(totalFeeAmount, orders[i].takerFee);
        }

        if (totalFeeAmount > 0) {
            // Fees are required for these orders
            // Buy enough ZRX to cover the future fill
            buyFeeTokens(feeOrders, feeSignatures, totalFeeAmount);
        }

        for (uint256 n = 0; n < orders.length; n++) {
            FillResults memory fillOrderResults = exchange.fillOrder(
                orders[n],
                orders[n].takerTokenAmount,
                signatures[n]
            );
            // Fail it it wasn't filled otherwise we will keep WETH
            require(fillOrderResults.takerTokenFilledAmount == orders[n].takerTokenAmount);
            // TODO read this through metadata
            transferNFTToken(orders[n].makerTokenAddress, msg.sender, tokenIds[n]);
        }
    }

    function buyFeeTokens(
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint256 feeAmount)
        private
        returns (FillResults memory totalFillResult)
    {
        require(feeOrders[0].makerTokenAddress == address(zrxToken));
        // Quote the fees
        FillResults memory marketBuyFeeQuote = marketBuyOrdersQuote(feeOrders, feeAmount, feeSignatures);
        // Buy enough ZRX to cover the future market sell as well as this market buy
        Exchange.FillResults memory marketBuyFillResult = exchange.marketBuyOrders(
            feeOrders,
            safeAdd(feeAmount, marketBuyFeeQuote.takerFeePaid), // fees for fees
            feeSignatures);
        addFillResults(totalFillResult, marketBuyFillResult);
        return totalFillResult;
    }

    function transferToken(
        address token,
        address account,
        uint amount)
        internal
    {
        require(IToken(token).transfer(account, amount));
    }
    function transferNFTToken(
        address token,
        address account,
        uint tokenId)
        internal
    {
        require(IToken(token).transfer(account, tokenId));
    }
}