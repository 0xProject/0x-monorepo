pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "./MixinERC721.sol";
import "./MixinForwarderCore.sol";
import "./MixinForwarderQuote.sol";

contract Forwarder is
    MixinForwarderCore,
    MixinForwarderQuote,
    MixinERC721
{
    function Forwarder(
        Exchange _exchange,
        IAssetProxyDispatcher _tokenProxy,
        EtherToken _etherToken,
        ZRXToken _zrxToken,
        uint8 assetProxyId)
        public
    {
        EXCHANGE = _exchange;
        TRANSFER_PROXY = _tokenProxy;
        ETHER_TOKEN = _etherToken;
        ZRX_TOKEN = _zrxToken;
        setERC20ProxyApproval(assetProxyId);
    }

    /// @dev Buys the tokens, performing fee abstraction if required. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all funds from the buy of orders (less any fees required to be paid in ZRX)
    ///      If the purchased token amount does not meet some threshold (98%) then this function reverts.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures)
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
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (Exchange.FillResults memory totalFillResult)
    {
        require(msg.value > 0, ERROR_INVALID_INPUT);
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), ERROR_INVALID_INPUT);

        uint256 remainingTakerTokenAmount = deductFees(msg.value, feeProportion, feeRecipient);
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        Exchange.FillResults memory fillTokensFillResult = marketBuyTokens(orders, signatures, feeOrders, feeSignatures, remainingTakerTokenAmount);
        addFillResults(totalFillResult, fillTokensFillResult);
        return totalFillResult;
    }

    /// @dev Buys the NFT tokens, performing fee abstraction if required. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all NFT's from the fill of orders
    ///      This function will revert unless all NFT's are purchased.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyNFTTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures)
        payable
        public
    {
        require(msg.value > 0, ERROR_INVALID_INPUT);
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), ERROR_INVALID_INPUT);

        ETHER_TOKEN.deposit.value(msg.value)();
        marketBuyNFTTokens(orders, signatures, feeOrders, feeSignatures, msg.value);
    }

    /// @dev Buys the NFT tokens, performing fee abstraction if required and deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all NFT's from the fill of orders. This function will revert unless all NFT's are purchased.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the incoming ETH and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return Amounts filled and fees paid by maker and taker.
    function buyNFTTokensFee(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
    {
        require(msg.value > 0, ERROR_INVALID_INPUT);
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), ERROR_INVALID_INPUT);
        uint256 remainingTakerTokenAmount = deductFees(msg.value, feeProportion, feeRecipient);
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        marketBuyNFTTokens(orders, signatures, feeOrders, feeSignatures, remainingTakerTokenAmount);
    }

    function deductFees(
        uint256 takerTokenAmount,
        uint16 feeProportion,
        address feeRecipient)
        internal
        returns (uint256 remainingTakerTokenAmount)
    {
        remainingTakerTokenAmount = takerTokenAmount;
        if (feeProportion > 0 && feeRecipient != address(0x0)) {
            require(feeProportion <= MAX_FEE, ERROR_INVALID_INPUT);
            // 1.5% is 150, allowing for 2 decimal precision, i.e 0.05% is 5
            uint256 feeRecipientFeeAmount = safeDiv(safeMul(remainingTakerTokenAmount, feeProportion), PERCENTAGE_DENOMINATOR);
            remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, feeRecipientFeeAmount);
            // Transfer the fee to the fee recipient
            feeRecipient.transfer(feeRecipientFeeAmount);
        }
        return remainingTakerTokenAmount;
    }

    function marketBuyNFTTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 takerTokenAmount)
        private
    {
        uint256 totalFeeAmount;
        uint256 totalTakerAmountSpent;
        for (uint256 i = 0; i < orders.length; i++) {
            totalFeeAmount = safeAdd(totalFeeAmount, orders[i].takerFee);
        }
        if (totalFeeAmount > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future fill
            Exchange.FillResults memory feeTokensResult = buyFeeTokens(feeOrders, feeSignatures, totalFeeAmount);
            totalTakerAmountSpent = safeAdd(totalTakerAmountSpent, feeTokensResult.takerTokenFilledAmount);
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
            // There is no acceptable threshold here as it is either buy it or nothing
            require(fillOrderResults.takerTokenFilledAmount == orders[n].takerTokenAmount, ERROR_FAILED_TO_FILL_ALL_ORDERS);
            totalTakerAmountSpent = safeAdd(totalTakerAmountSpent, fillOrderResults.takerTokenFilledAmount);
            makerTokenAddress = readAddress(orders[n].makerAssetData, 1);
            tokenId = readUint256(orders[n].makerAssetData, 21);
            transferNFTToken(makerTokenAddress, msg.sender, tokenId);
        }
        // Prevent a user from over estimating the amount of ETH required
        require(isAcceptableThreshold(msg.value, totalTakerAmountSpent), ERROR_UNACCEPTABLE_THRESHOLD);
    }

    function marketBuyTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 sellTokenAmount)
        private
        returns (Exchange.FillResults memory totalFillResult)
    {
        uint256 takerTokenBalance = sellTokenAmount;
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1);

        Exchange.FillResults memory tokensSellQuote = marketSellOrdersQuote(orders, sellTokenAmount);
        Exchange.FillResults memory requestedTokensResult;
        if (tokensSellQuote.takerFeePaid > 0) {
            // Fees are required for these orders
            // Buy enough ZRX to cover the future market sell
            Exchange.FillResults memory feeTokensResult = buyFeeTokens(feeOrders, feeSignatures, tokensSellQuote.takerFeePaid);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerTokenFilledAmount);
            // Make our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = EXCHANGE.marketSellOrders(orders, takerTokenBalance, signatures);
            // It's possibile to over-buy fees by a small amount as the marketSellQuote was based on 100% of ETH
            // and marketSell (after fee abstraction) less than 100%. If a user uses this enough it may be worth withdrawing
            balanceOf[msg.sender] += safeSub(feeTokensResult.makerTokenFilledAmount, requestedTokensResult.takerFeePaid);
            require(balanceOf[msg.sender] >= 0);
            // Update our return FillResult with the additional fees
            totalFillResult.takerFeePaid = feeTokensResult.takerFeePaid;
        } else {
            // Make our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = EXCHANGE.marketSellOrders(orders, takerTokenBalance, signatures);
        }
        // Update our return FillResult with the market sell
        addFillResults(totalFillResult, requestedTokensResult);
        // Ensure the token abstraction was fair if fees were proportionally too high, we fail
        require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerTokenFilledAmount), ERROR_UNACCEPTABLE_THRESHOLD);
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, requestedTokensResult.makerTokenFilledAmount);
        return totalFillResult;
    }

    /// @dev Withdraws an amount of ZRX tokens from using this contract.
    /// @param amount The amount of ZRX to withdraw.
    function withdraw(uint amount) public {
        require(balanceOf[msg.sender] >= amount);
        balanceOf[msg.sender] -= amount;
        ZRX_TOKEN.transfer(msg.sender, amount);
    }

    /// @dev Buys the fee tokens as well as any fees required to buy the requested fee tokens.
    ///      It is possible that a request to buy 200 ZRX fee tokens will require purchasing 202 ZRX tokens
    ///      As 2 ZRX is required to purchase the 200 ZRX fee tokens.
    /// @param orders An array of Order struct containing order specifications for fees.
    /// @param signatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeAmount The number of requested ZRX fee tokens.
    /// @return Amounts filled and fees paid by maker and taker. makerTokenAmount is the zrx amount deducted of fees
    function buyFeeTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        uint256 feeAmount)
        private
        returns (Exchange.FillResults memory totalFillResult)
    {
        address token = readAddress(orders[0].makerAssetData, 1);
        require(token == address(ZRX_TOKEN), ERROR_INVALID_INPUT);
        for (uint256 i = 0; i < orders.length; i++) {
            // Token being bought by taker must be the same for each order
            require(areBytesEqual(orders[i].makerAssetData, orders[0].makerAssetData));

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(feeAmount, totalFillResult.makerTokenFilledAmount);

            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                safeSub(orders[i].makerTokenAmount, orders[i].takerFee), // our exchange rate after fees 
                remainingMakerTokenFillAmount);

            // Attempt to sell the remaining amount of takerToken
            // Round up the amount to ensure we don't under buy by a fractional amount
            Exchange.FillResults memory singleFillResult = EXCHANGE.fillOrder(
                orders[i],
                safeAdd(remainingTakerTokenFillAmount, 1),
                signatures[i]
            );

            // We didn't buy the full amount when buying ZRX as some were taken for fees
            singleFillResult.makerTokenFilledAmount = safeSub(singleFillResult.makerTokenFilledAmount, singleFillResult.takerFeePaid);
            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResult, singleFillResult);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResult.makerTokenFilledAmount == feeAmount) {
                break;
            }
        }
        return totalFillResult;
    }

    /// @dev Sets the allowances on the proxy for this contract
    function setERC20ProxyApproval(uint8 assetProxyId)
        internal
    {
        address proxyAddress = TRANSFER_PROXY.getAssetProxy(assetProxyId);
        ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
        ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
    }

    function transferToken(
        address token,
        address account,
        uint amount)
        internal
    {
        require(IToken(token).transfer(account, amount), ERROR_TRANSFER_FAILED);
    }
}