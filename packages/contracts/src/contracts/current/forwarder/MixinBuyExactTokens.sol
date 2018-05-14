pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinForwarderExpectedResults.sol";
import "./MixinERC20.sol";
import "./MixinERC721.sol";

contract MixinBuyExactTokens is
    MixinForwarderCore,
    MixinForwarderExpectedResults,
    MixinERC20,
    MixinERC721
{
    /// @dev Buys the exact amount of tokens (ERC20 and ERC721), performing fee abstraction if required. Deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all tokens from the fill of orders. This function will revert unless the requested amount of tokens are purchased.
    ///      Any excess ETH sent will be returned to the caller
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param tokenAmount The amount of maker asset tokens to buy. Optional for ERC721.
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
        returns (Exchange.FillResults memory totalFillResults)
    {
        require(msg.value > 0, "msg.value must be greater than 0");
        address token = readAddress(orders[0].takerAssetData, 1);
        require(token == address(ETHER_TOKEN), "order taker asset must be Wrapped ETH");
        uint8 proxyId = uint8(orders[0].makerAssetData[0]);
        require(proxyId == 1 || proxyId == 2, "unsupported token proxy");

        uint256 remainingTakerTokenAmount = msg.value;
        ETHER_TOKEN.deposit.value(remainingTakerTokenAmount)();
        if (proxyId == 1) {
            totalFillResults = buyExactTokensInternal(orders, signatures, feeOrders, feeSignatures, tokenAmount);
        } else if (proxyId == 2) {
            totalFillResults = buyNFTTokensInternal(orders, signatures, feeOrders, feeSignatures, remainingTakerTokenAmount);
        }
        remainingTakerTokenAmount = safeSub(remainingTakerTokenAmount, totalFillResults.takerAssetFilledAmount);
        withdrawPayAndDeductFee(remainingTakerTokenAmount, totalFillResults.takerAssetFilledAmount, feeProportion, feeRecipient);
        return totalFillResults;
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
        // We can short cut here for effeciency and use buyFeeTokensInternal if maker asset token is ZRX
        // this buys us exactly that amount taking into account the fees saving gas
        Exchange.FillResults memory requestedTokensResult;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            requestedTokensResult = buyFeeTokensInternal(orders, signatures, tokenAmount);
            require(requestedTokensResult.makerAssetFilledAmount >= tokenAmount, "traded amount did not meet acceptable threshold");
        } else {
            Exchange.FillResults memory expectedMarketBuyFillResults = expectedMaketBuyFillResults(orders, tokenAmount);
            if (expectedMarketBuyFillResults.takerFeePaid > 0) {
                // Fees are required for these orders. Buy enough ZRX to cover the future market buy
                Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(feeOrders, feeSignatures, expectedMarketBuyFillResults.takerFeePaid);
                totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
                totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            }
            // Make our market buy of the requested tokens with the remaining balance
            requestedTokensResult = EXCHANGE.marketBuyOrders(orders, tokenAmount, signatures);
            require(requestedTokensResult.makerAssetFilledAmount == tokenAmount, "traded amount did not meet acceptable threshold");
        }
        addFillResults(totalFillResults, requestedTokensResult);
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, totalFillResults.makerAssetFilledAmount);
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
            // Fail if it wasn't fully filled otherwise we will keep WETH
            Exchange.FillResults memory fillOrderResults = EXCHANGE.fillOrKillOrder(
                orders[n],
                orders[n].takerAssetAmount,
                signatures[n]
            );
            addFillResults(totalFillResults, fillOrderResults);
            address makerTokenAddress = readAddress(orders[n].makerAssetData, 1);
            uint256 tokenId = readUint256(orders[n].makerAssetData, 21);
            transferNFTToken(makerTokenAddress, msg.sender, tokenId);
        }
        // Prevent a user from paying too high of fees during fee abstraction
        require(isAcceptableThreshold(
            takerTokenAmount, totalFillResults.takerAssetFilledAmount), "traded amount does not meet acceptable threshold");
        return totalFillResults;
    }
}
