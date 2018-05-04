pragma solidity ^0.4.22;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinForwarderQuote.sol";
import "./MixinERC721.sol";

contract MixinBuyNFTTokens is
    MixinForwarderCore,
    MixinForwarderQuote,
    MixinERC721
{
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
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function buyNFTTokens(
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
        uint256 remainingTakerTokenAmount = msg.value;
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        Exchange.FillResults memory totalFillResults = buyNFTTokensInternal(
            orders, signatures, feeOrders, feeSignatures, remainingTakerTokenAmount);

        remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, totalFillResults.takerAssetFilledAmount);
        withdrawPayAndDeductFee(remainingTakerTokenAmount, totalFillResults.takerAssetFilledAmount, feeProportion, feeRecipient);
        return totalFillResults;
    }

    function buyNFTTokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 takerTokenAmount)
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        uint256 totalFeeAmount;
        for (uint256 i = 0; i < orders.length; i++) {
            totalFeeAmount = safeAdd(totalFeeAmount, orders[i].takerFee);
        }
        if (totalFeeAmount > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future fill
            Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(feeOrders, feeSignatures, totalFeeAmount);
            totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
        }
        for (uint256 n = 0; n < orders.length; n++) {
            Exchange.FillResults memory fillOrderResults = EXCHANGE.fillOrder(
                orders[n],
                orders[n].takerAssetAmount,
                signatures[n]
            );
            addFillResults(totalFillResults, fillOrderResults);
            // Fail if it wasn't fully filled otherwise we will keep WETH
            require(fillOrderResults.takerAssetFilledAmount == orders[n].takerAssetAmount, "failed to completely fill order");
            address makerTokenAddress = readAddress(orders[n].makerAssetData, 1);
            uint256 tokenId = readUint256(orders[n].makerAssetData, 21);
            transferNFTToken(makerTokenAddress, msg.sender, tokenId);
        }
        // Prevent a user from overestimating the amount of ETH required
        require(isAcceptableThreshold(
            takerTokenAmount, totalFillResults.takerAssetFilledAmount), "traded amount does not meet acceptable threshold");
        return totalFillResults;
    }
}
