pragma solidity ^0.4.22;
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
        IAssetProxyDispatcher _tokenProxy,
        EtherToken _etherToken,
        ZRXToken _zrxToken)
        public
    {
        EXCHANGE = _exchange;
        TRANSFER_PROXY = _tokenProxy;
        ETHER_TOKEN = _etherToken;
        ZRX_TOKEN = _zrxToken;
    }

    /// @dev Initializes this contract, setting the allowances for the ZRX fee token and WETH.
    function setERC20ProxyApproval(uint8 assetProxyId)
        external
    {
        address proxyAddress = TRANSFER_PROXY.getAssetProxy(assetProxyId);
        ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
        ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
    }

    /// @dev Buys the tokens, performing fee abstraction if required. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all funds from the marketBuy of orders (less any fees required to be paid in ZRX)
    ///      If the purchased token amount does not meet some threshold (98%) then this function reverts.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyTokens(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures)
        payable
        public
        returns (Exchange.FillResults memory totalFillResult)
    {
        require(msg.value > 0, ERROR_INVALID_INPUT);
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), ERROR_INVALID_INPUT);

        ETHER_TOKEN.deposit.value(msg.value)();
        Exchange.FillResults memory fillTokensFillResult = marketBuyTokens(orders, signatures, feeOrders, feeSignatures, msg.value);
        addFillResults(totalFillResult, fillTokensFillResult);
        return totalFillResult;
    }

    /// @dev Buys the tokens, performing fee abstraction if required. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      This function allows for a deduction of a proportion of incoming ETH sent to the feeRecipient.
    ///      The caller is sent all tokens from the marketBuy of orders (less any fees required to be paid in ZRX)
    ///      If the purchased token amount does not meet some threshold (98%) then this function reverts.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the incoming ETH and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyTokensFee(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (Exchange.FillResults memory totalFillResult)
    {
        require(msg.value > 0, ERROR_INVALID_INPUT);
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), ERROR_INVALID_INPUT);
        require(feeProportion <= MAX_FEE, ERROR_INVALID_INPUT);

        uint256 remainingEthAmount = msg.value;
        if (feeProportion > 0 && feeRecipient != address(0x0)) {
            // 1.5% is 150, allowing for 2 decimal precision, i.e 0.05% is 5
            uint256 feeRecipientFeeAmount = safeDiv(safeMul(msg.value, feeProportion), PERCENTAGE_DENOMINATOR);
            remainingEthAmount = safeSub(msg.value, feeRecipientFeeAmount);
            // Transfer the fee to the fee recipient
            feeRecipient.transfer(feeRecipientFeeAmount);
        }

        ETHER_TOKEN.deposit.value(remainingEthAmount)();
        Exchange.FillResults memory fillTokensFillResult = marketBuyTokens(orders, signatures, feeOrders, feeSignatures, remainingEthAmount);
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
        returns (Exchange.FillResults memory totalFillResult)
    {
        uint256 takerTokenBalance = sellTokenAmount;
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1);

        Exchange.FillResults memory tokensSellQuote = marketSellOrdersQuote(orders, sellTokenAmount);

        if (tokensSellQuote.takerFeePaid > 0) {
            // Fees are required for these orders
            // Buy enough ZRX to cover the future market sell
            Exchange.FillResults memory feeTokensResult =
                buyFeeTokens(feeOrders, feeSignatures, tokensSellQuote.takerFeePaid);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerTokenFilledAmount);
            totalFillResult.takerFeePaid = feeTokensResult.takerFeePaid;
        }

        // Make our market sell to buy the requested tokens with the remaining balance
        Exchange.FillResults memory requestedTokensResult = EXCHANGE.marketSellOrders(orders, takerTokenBalance, signatures);
        // Ensure the token abstraction was fair 
        require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerTokenFilledAmount), ERROR_UNACCEPTABLE_THRESHOLD);
        // Update our return FillResult with the market sell
        addFillResults(totalFillResult, requestedTokensResult);
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, totalFillResult.makerTokenFilledAmount);
        return totalFillResult;
    }

    function marketBuyNFT(
        Order[] orders,
        bytes[] signatures,
        Order[] feeOrders,
        bytes[] feeSignatures)
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

        address makerTokenAddress;
        uint256 tokenId;
        for (uint256 n = 0; n < orders.length; n++) {
            Exchange.FillResults memory fillOrderResults = EXCHANGE.fillOrder(
                orders[n],
                orders[n].takerTokenAmount,
                signatures[n]
            );
            // Fail it it wasn't filled otherwise we will keep WETH
            // There is no acceptible threshold here as it is either buy it or nothing
            require(fillOrderResults.takerTokenFilledAmount == orders[n].takerTokenAmount, ERROR_FAILED_TO_FILL_ALL_ORDERS);
            makerTokenAddress = readAddress(orders[n].makerAssetData, 1);
            tokenId = readUint256(orders[n].makerAssetData, 21);
            transferNFTToken(makerTokenAddress, msg.sender, tokenId);
        }
    }

    /// @dev Buys the fee tokens as well as any fees required to buy the requested fee tokens.
    ///      It is possible that a request to buy 200 ZRX fee tokens will require purchasing 202 ZRX tokens
    ///      As 2 ZRX is required to purchase the 200 ZRX fee tokens.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeAmount The number of requested ZRX fee tokens.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyFeeTokens(
        Order[] feeOrders,
        bytes[] feeSignatures,
        uint256 feeAmount)
        private
        returns (Exchange.FillResults memory totalFillResult)
    {
        address token = readAddress(feeOrders[0].makerAssetData, 1);
        require(token == address(ZRX_TOKEN), ERROR_INVALID_INPUT);
        // Quote the fees
        Exchange.FillResults memory marketBuyFeeQuote = marketBuyOrdersQuote(feeOrders, feeAmount);
        // Buy enough ZRX to cover the future market sell as well as this market buy
        Exchange.FillResults memory marketBuyFillResult = EXCHANGE.marketBuyOrders(
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
        require(IToken(token).transfer(account, amount), ERROR_TRANSFER_FAILED);
    }
    function transferNFTToken(
        address token,
        address account,
        uint tokenId)
        internal
    {
        require(IToken(token).transfer(account, tokenId), ERROR_TRANSFER_FAILED);
    }
}