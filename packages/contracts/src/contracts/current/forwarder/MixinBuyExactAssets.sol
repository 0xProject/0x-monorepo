pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./MixinForwarderCore.sol";
import "./MixinForwarderExpectedResults.sol";
import "./MixinERC20.sol";
import "./MixinERC721.sol";

contract MixinBuyExactAssets is
    MixinForwarderCore,
    MixinForwarderExpectedResults,
    MixinERC20,
    MixinERC721
{
    /// @dev Buys the exact amount of assets (ERC20 and ERC721), performing fee abstraction if required.
    ///      All order assets must be of the same type. Deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all assets from the fill of orders. This function will revert unless the requested amount of assets are purchased.
    ///      Any excess ETH sent will be returned to the caller
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param assetAmount The amount of maker asset to buy.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the ETH spent and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function buyExactAssets(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 assetAmount,
        uint16  feeProportion,
        address feeRecipient)
        payable
        public
        returns (Exchange.FillResults memory totalFillResults)
    {
        require(msg.value > 0, VALUE_GT_ZERO);
        address takerAsset = readAddress(orders[0].takerAssetData, 1);
        require(takerAsset == address(ETHER_TOKEN), TAKER_ASSET_WETH);
        uint8 proxyId = uint8(orders[0].makerAssetData[0]);
        require(proxyId == 1 || proxyId == 2, UNSUPPORTED_TOKEN_PROXY);

        uint256 remainingTakerAssetAmount = msg.value;
        ETHER_TOKEN.deposit.value(remainingTakerAssetAmount)();
        if (proxyId == 1) {
            totalFillResults = buyExactERC20TokensInternal(orders, signatures, feeOrders, feeSignatures, assetAmount);
        } else if (proxyId == 2) {
            totalFillResults = buyExactERC721TokensInternal(orders, signatures, feeOrders, feeSignatures, assetAmount);
        }
        remainingTakerAssetAmount = safeSub(remainingTakerAssetAmount, totalFillResults.takerAssetFilledAmount);
        // Prevent a user from paying too high of fees during fee abstraction
        require(isAcceptableThreshold(
            remainingTakerAssetAmount, totalFillResults.takerAssetFilledAmount), NOT_ACCEPTABLE_THRESHOLD);
        withdrawPayAndDeductFee(remainingTakerAssetAmount, totalFillResults.takerAssetFilledAmount, feeProportion, feeRecipient);
        return totalFillResults;
    }

    function buyExactERC20TokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 assetAmount)
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1); 
        // We can short cut here for effeciency and use buyFeeTokensInternal if maker asset token is ZRX
        // this buys us exactly that amount taking into account the fees. This saves gas and calculates the rate correctly
        Exchange.FillResults memory requestedTokensResult;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            requestedTokensResult = buyFeeTokensInternal(orders, signatures, assetAmount);
            // When buying ZRX we round up which can result in a small margin excess
            require(requestedTokensResult.makerAssetFilledAmount >= assetAmount, NOT_ACCEPTABLE_THRESHOLD);
        } else {
            Exchange.FillResults memory calculatedMarketBuyResults = calculateMarketBuyFillResults(orders, assetAmount);
            if (calculatedMarketBuyResults.takerFeePaid > 0) {
                // Fees are required for these orders. Buy enough ZRX to cover the future market buy
                Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(
                    feeOrders, feeSignatures, calculatedMarketBuyResults.takerFeePaid);
                totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
                totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            }
            // Make our market buy of the requested tokens with the remaining balance
            requestedTokensResult = EXCHANGE.marketBuyOrders(orders, assetAmount, signatures);
            require(requestedTokensResult.makerAssetFilledAmount == assetAmount, NOT_ACCEPTABLE_THRESHOLD);
        }
        addFillResults(totalFillResults, requestedTokensResult);
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, totalFillResults.makerAssetFilledAmount);
        return totalFillResults;
    }

    function buyExactERC721TokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 assetAmount)
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        require(assetAmount == orders.length, ASSET_AMOUNT_MATCH_ORDER_SIZE);
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
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 1);
        for (uint256 n = 0; n < orders.length; n++) {
            // Fail if it wasn't fully filled otherwise we will keep WETH
            Exchange.FillResults memory fillOrderResults = EXCHANGE.fillOrKillOrder(
                orders[n],
                orders[n].takerAssetAmount,
                signatures[n]
            );
            addFillResults(totalFillResults, fillOrderResults);
            uint256 tokenId = readUint256(orders[n].makerAssetData, 21);
            transferNFTToken(makerTokenAddress, msg.sender, tokenId);
        }
        return totalFillResults;
    }
}
