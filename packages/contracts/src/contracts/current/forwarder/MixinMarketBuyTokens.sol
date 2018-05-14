pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinForwarderExpectedResults.sol";
import "./MixinERC20.sol";

contract MixinMarketBuyTokens is
    MixinForwarderCore,
    MixinForwarderExpectedResults,
    MixinERC20
{
    /// @dev Buys the tokens, performing fee abstraction if required. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      This function allows for a deduction of a proportion of incoming ETH sent to the feeRecipient.
    ///      The caller is sent all tokens from the marketSell of orders (less any fees required to be paid in ZRX)
    ///      If the purchased token amount does not meet some threshold (98%) then this function reverts.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the incoming ETH and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketBuyTokens(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (Exchange.FillResults)
    {
        require(msg.value > 0, "msg.value must be greater than 0");
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), "order taker asset must be Wrapped ETH");

        uint256 remainingTakerTokenAmount = payAndDeductFee(msg.value, feeProportion, feeRecipient);
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        return marketSellTokensInternal(orders, signatures, feeOrders, feeSignatures, remainingTakerTokenAmount);
    }

    function marketSellTokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 sellTokenAmount)
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        uint256 takerTokenBalance = sellTokenAmount;
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1);

        Exchange.FillResults memory expectedMarketSellResults = expectedMarketSellFillResults(orders, sellTokenAmount);
        if (expectedMarketSellResults.takerFeePaid > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future market buy
            Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(
                feeOrders, feeSignatures, expectedMarketSellResults.takerFeePaid);
            takerTokenBalance = safeSub(takerTokenBalance, feeTokensResult.takerAssetFilledAmount);
            totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
        }
        // Make our market sell to buy the requested tokens with the remaining balance
        Exchange.FillResults memory requestedTokensResult = EXCHANGE.marketSellOrders(orders, takerTokenBalance, signatures);
        // Update our return FillResult with the market sell
        addFillResults(totalFillResults, requestedTokensResult);
        // Ensure the token abstraction was fair if fees were proportionally too high, we fail
        require(isAcceptableThreshold(sellTokenAmount, requestedTokensResult.takerAssetFilledAmount),
            "traded amount did not meet acceptable threshold");
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, requestedTokensResult.makerAssetFilledAmount);
        return totalFillResults;
    }
}
