pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinForwarderQuote.sol";
import "./MixinERC20.sol";

contract MixinBuyExactTokens is
    MixinForwarderCore,
    MixinForwarderQuote,
    MixinERC20
{
    /// @dev Buys the exact amount of tokens, performing fee abstraction if required and deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all tokens from the fill of orders. This function will revert unless all tokens are purchased.
    ///      Any excess ETH sent will be returned to the caller
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param tokenAmount The amount of maker asset tokens to buy.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the incoming ETH and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function buyExactTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 tokenAmount,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (Exchange.FillResults)
    {
        require(msg.value > 0, "msg.value must be greater than 0");
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), "order taker asset must be Wrapped ETH");

        uint256 remainingTakerTokenAmount = msg.value;
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        Exchange.FillResults memory totalFillResult = buyExactTokensInternal(orders, signatures, feeOrders, feeSignatures, tokenAmount);
        require(totalFillResult.makerAssetFilledAmount >= tokenAmount, "traded amount does not meet acceptable threshold");
        remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, totalFillResult.takerAssetFilledAmount);

        // Return all of the excess WETH if any 
        if (remainingTakerTokenAmount > 0) {
            ETHER_TOKEN.withdraw(remainingTakerTokenAmount);
            // Fees proportional to the amount traded
            // uint256 totalFeeAmount = safeSub(remainingTakerTokenAmount, payAndDeductFee(totalFillResult.takerAssetFilledAmount, feeProportion, feeRecipient));
            // remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, totalFeeAmount);
            // TODO allow fee deduction proportional to amount traded if specified
            msg.sender.transfer(remainingTakerTokenAmount);
        }
        return totalFillResult;
    }

    function buyExactTokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 tokenAmount)
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1); 
        // We can short cut here for effeciency and use buyFeeTokens if maker asset token is ZRX
        // this buys us exactly that amount taking into account the fees
        Exchange.FillResults memory requestedTokensResult;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            // TODO we read address twice here if it is ZRX
            requestedTokensResult = buyFeeTokensInternal(orders, signatures, tokenAmount);
        } else {
            Exchange.FillResults memory expectedMarketBuyFillResults = expectedMaketBuyFillResults(orders, tokenAmount);
            if (expectedMarketBuyFillResults.takerFeePaid > 0) {
                // Fees are required for these orders. Buy enough ZRX to cover the future market buy
                Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(feeOrders, feeSignatures, expectedMarketBuyFillResults.takerFeePaid);
                totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
                totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            }
            // Make our market sell to buy the requested tokens with the remaining balance
            requestedTokensResult = EXCHANGE.marketBuyOrders(orders, tokenAmount, signatures);
        }
        addFillResults(totalFillResults, requestedTokensResult);
        require(totalFillResults.makerAssetFilledAmount >= tokenAmount, "traded amount did not meet acceptable threshold");
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, totalFillResults.makerAssetFilledAmount);
        return totalFillResults;
    }
}
