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
    uint8 public constant ERC20_PROXY_ID = 1;
    uint8 public constant ERC721_PROXY_ID = 2;

    /// @dev Buys the exact amount of assets (ERC20 and ERC721), performing fee abstraction if required.
    ///      All order assets must be of the same type. Deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all assets from the fill of orders. This function will revert unless the requested amount of assets are purchased.
    ///      Any excess ETH sent will be returned to the caller
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param makerAssetAmount The amount of maker asset to buy.
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
        uint256 makerAssetAmount,
        uint16  feeProportion,
        address feeRecipient
    )
        payable
        public
        returns (Exchange.FillResults memory totalFillResults)
    {
        require(
            msg.value > 0,
            VALUE_GREATER_THAN_ZERO
        );
        uint256 remainingTakerAssetAmount = msg.value;
        // Read the last byte which indicates the proxy id, without popping
        uint8 proxyId = uint8(orders[0].makerAssetData[orders[0].makerAssetData.length - 1]);
        require(proxyId == ERC20_PROXY_ID || proxyId == ERC721_PROXY_ID, UNSUPPORTED_TOKEN_PROXY);

        ETHER_TOKEN.deposit.value(remainingTakerAssetAmount)();
        if (proxyId == ERC20_PROXY_ID) {
            totalFillResults = buyExactERC20TokensInternal(orders, signatures, feeOrders, feeSignatures, makerAssetAmount);
        } else if (proxyId == ERC721_PROXY_ID) {
            totalFillResults = buyExactERC721TokensInternal(orders, signatures, feeOrders, feeSignatures, makerAssetAmount);
        }
        remainingTakerAssetAmount = safeSub(remainingTakerAssetAmount, totalFillResults.takerAssetFilledAmount);
        // Prevent a user from paying too much in fees through fee abstraction
        require(
            isAcceptableThreshold(
                remainingTakerAssetAmount,
                totalFillResults.takerAssetFilledAmount
            ),
            UNACCEPTABLE_THRESHOLD
        );
        withdrawPayAndDeductFee(
            remainingTakerAssetAmount,
            totalFillResults.takerAssetFilledAmount,
            feeProportion,
            feeRecipient
        );
        return totalFillResults;
    }

    /// @dev Buys an exact amount of an ERC20 token using WETH.
    /// @param orders Orders to fill. The maker asset is the ERC20 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @param makerAssetAmount Amount of the ERC20 token to buy.
    /// @return totalFillResults Aggregated fill results of buying the ERC20 and ZRX tokens.
    function buyExactERC20TokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 makerAssetAmount
    )
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        address makerTokenAddress = readAddress(orders[0].makerAssetData, 0);
        // Populate the known assetData, as it is always WETH the caller can provide null bytes to save gas
        for (uint256 i = 0; i < orders.length; i++) {
            orders[i].makerAssetData = orders[0].makerAssetData;
            orders[i].takerAssetData = WETH_ASSET_DATA;
        }
        // We can short cut here for effeciency and use buyFeeTokensInternal if maker asset token is ZRX
        // this buys us exactly that amount taking into account the fees. This saves gas and calculates the rate correctly
        Exchange.FillResults memory requestedTokensResults;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            requestedTokensResults = buyFeeTokensInternal(orders, signatures, makerAssetAmount);
            // When buying ZRX we round up which can result in a small margin excess
            require(
                requestedTokensResults.makerAssetFilledAmount >= makerAssetAmount,
                UNACCEPTABLE_THRESHOLD
            );
        } else {
            Exchange.FillResults memory calculatedMarketBuyResults = calculateMarketBuyFillResults(orders, makerAssetAmount);
            if (calculatedMarketBuyResults.takerFeePaid > 0) {
                // Fees are required for these orders. Buy enough ZRX to cover the future market buy
                Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(
                    feeOrders,
                    feeSignatures,
                    calculatedMarketBuyResults.takerFeePaid
                );
                totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
                totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            }
            // Make our market buy of the requested tokens with the remaining balance
            requestedTokensResults = EXCHANGE.marketBuyOrders(orders, makerAssetAmount, signatures);
            require(
                requestedTokensResults.makerAssetFilledAmount == makerAssetAmount,
                UNACCEPTABLE_THRESHOLD
            );
        }
        addFillResults(totalFillResults, requestedTokensResults);
        // Transfer all tokens to msg.sender
        transferToken(makerTokenAddress, msg.sender, requestedTokensResults.makerAssetFilledAmount);
        return totalFillResults;
    }

    /// @dev Buys an all of the ERC721 tokens in the orders.
    /// @param orders Orders to fill. The maker asset is the ERC721 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @param makerAssetAmount Amount of the ERC721 tokens to buy, should match orders length.
    /// @return totalFillResults Aggregated fill results of buying the ERC721 tokens and ZRX tokens.
    function buyExactERC721TokensInternal(
        Order[] memory orders,
        bytes[] memory signatures,
        Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 makerAssetAmount
    )
        private
        returns (Exchange.FillResults memory totalFillResults)
    {
        require(
            makerAssetAmount == orders.length,
            ASSET_AMOUNT_MATCH_ORDER_SIZE
        );
        uint256 totalFeeAmount;
        // Total up the fees
        for (uint256 i = 0; i < orders.length; i++) {
            totalFeeAmount = safeAdd(totalFeeAmount, orders[i].takerFee);
        }
        if (totalFeeAmount > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future fill
            Exchange.FillResults memory feeTokensResult = buyFeeTokensInternal(feeOrders, feeSignatures, totalFeeAmount);
            totalFillResults.takerFeePaid = feeTokensResult.takerFeePaid;
            totalFillResults.takerAssetFilledAmount = feeTokensResult.takerAssetFilledAmount;
        }
        for (i = 0; i < orders.length; i++) {
            // Populate the known takerAssetData as it is always WETH
            orders[i].takerAssetData = WETH_ASSET_DATA;
            // Fail if it wasn't fully filled otherwise we will keep WETH
            Exchange.FillResults memory fillOrderResults = EXCHANGE.fillOrKillOrder(
                orders[i],
                orders[i].takerAssetAmount,
                signatures[i]
            );
            addFillResults(totalFillResults, fillOrderResults);
            transferERC721Token(orders[i].makerAssetData, address(this), msg.sender, fillOrderResults.makerAssetFilledAmount);
        }
        return totalFillResults;
    }
}
