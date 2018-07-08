/*

  Copyright 2018 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../utils/LibBytes/LibBytes.sol";
import "./mixins/MFees.sol";
import "./mixins/MMarketBuyZrx.sol";
import "./mixins/MExpectedResults.sol";
import "./mixins/MTransfer.sol";
import "./mixins/MConstants.sol";
import "./mixins/MForwarderCore.sol";
import "../protocol/Exchange/libs/LibOrder.sol";
import "../protocol/Exchange/libs/LibFillResults.sol";


contract MixinForwarderCore is
    LibFillResults,
    MConstants,
    MExpectedResults,
    MFees,
    MMarketBuyZrx,
    MTransfer,
    MForwarderCore
{
    bytes4 public constant ERC20_DATA_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 public constant ERC721_DATA_ID = bytes4(keccak256("ERC721Token(address,uint256,bytes)"));

    /// @dev Market sells ETH for ERC20 tokens, performing fee abstraction if required. This does not support ERC721 tokens. This function is payable
    ///      and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      This function allows for a deduction of a proportion of incoming ETH sent to the feeRecipient.
    ///      The caller is sent all tokens from the operation.
    ///      If the purchased token amount does not meet an acceptable threshold then this function reverts.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the incoming ETH and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketSellEthForERC20(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint16  feeProportion,
        address feeRecipient
    )
        public
        payable
        returns (FillResults memory totalFillResults)
    {
        uint256 takerEthAmount = msg.value;
        require(
            takerEthAmount > 0,
            "VALUE_GREATER_THAN_ZERO"
        );
        // Deduct the fee from the total amount of ETH sent in
        uint256 ethFeeAmount = payEthFee(
            takerEthAmount,
            feeProportion,
            feeRecipient
        );
        uint256 wethSellAmount = safeSub(takerEthAmount, ethFeeAmount);

        // Deposit the remaining to be used for trading
        ETHER_TOKEN.deposit.value(wethSellAmount)();
        // Populate the known assetData, as it is always WETH the caller can provide null bytes to save gas
        // marketSellOrders fills the remaining
        address makerTokenAddress = LibBytes.readAddress(orders[0].makerAssetData, 16);
        orders[0].takerAssetData = WETH_ASSET_DATA;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            // If this is ZRX then we market sell from the orders, rather than a 2 step of buying ZRX fees from feeOrders
            // then buying ZRX from orders
            totalFillResults = marketSellEthForZRXInternal(
                orders,
                signatures,
                wethSellAmount
            );
        } else {
            totalFillResults = marketSellEthForERC20Internal(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                wethSellAmount
            );
        }
        // Prevent accidental WETH owned by this contract and it being spent
        require(
            takerEthAmount >= totalFillResults.takerAssetFilledAmount,
            "INVALID_MSG_VALUE"
        );
        // Ensure no WETH is left in this contract
        require(
            wethSellAmount == totalFillResults.takerAssetFilledAmount,
            "UNACCEPTABLE_THRESHOLD"
        );
        // Transfer all tokens to msg.sender
        transferERC20Token(
            makerTokenAddress,
            msg.sender,
            totalFillResults.makerAssetFilledAmount
        );
        return totalFillResults;
    }

    /// @dev Buys the exact amount of assets (ERC20 and ERC721), performing fee abstraction if required.
    ///      All order assets must be of the same type. Deducts a proportional fee to fee recipient.
    ///      This function is payable and will convert all incoming ETH into WETH and perform the trade on behalf of the caller.
    ///      The caller is sent all assets from the fill of orders. This function will revert unless the requested amount of assets are purchased.
    ///      Any excess ETH sent will be returned to the caller
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param makerTokenFillAmount The amount of maker asset to buy.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param feeProportion A proportion deducted off the ETH spent and sent to feeRecipient. The maximum value for this
    ///        is 1000, aka 10%. Supports up to 2 decimal places. I.e 0.59% is 59.
    /// @param feeRecipient An address of the fee recipient whom receives feeProportion of ETH.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketBuyTokensWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 makerTokenFillAmount,
        uint16  feeProportion,
        address feeRecipient
    )
        public
        payable
        returns (FillResults memory totalFillResults)
    {
        uint256 takerEthAmount = msg.value;
        require(
            takerEthAmount > 0,
            "VALUE_GREATER_THAN_ZERO"
        );
        require(
            makerTokenFillAmount > 0,
            "VALUE_GREATER_THAN_ZERO"
        );
        bytes4 assetDataId = LibBytes.readBytes4(orders[0].makerAssetData, 0);
        require(
            assetDataId == ERC20_DATA_ID || assetDataId == ERC721_DATA_ID,
            "UNSUPPORTED_TOKEN_PROXY"
        );

        ETHER_TOKEN.deposit.value(takerEthAmount)();
        if (assetDataId == ERC20_DATA_ID) {
            totalFillResults = marketBuyERC20TokensInternal(
                orders,
                signatures,
                feeOrders,
                feeSignatures,
                makerTokenFillAmount
            );
        } else if (assetDataId == ERC721_DATA_ID) {
            totalFillResults = batchBuyERC721TokensInternal(
                orders,
                signatures,
                feeOrders,
                feeSignatures
            );
        }
        // Prevent accidental WETH owned by this contract and it being spent
        require(
            takerEthAmount >= totalFillResults.takerAssetFilledAmount,
            "INVALID_MSG_VALUE"
        );
        withdrawPayAndDeductEthFee(
            safeSub(takerEthAmount, totalFillResults.takerAssetFilledAmount),
            totalFillResults.takerAssetFilledAmount,
            feeProportion,
            feeRecipient
        );
        return totalFillResults;
    }

    /// @dev Market sells WETH for ERC20 tokens.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param wethSellAmount The amount of WETH to sell.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketSellEthForERC20Internal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 wethSellAmount
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        uint256 remainingWethSellAmount = wethSellAmount;
        FillResults memory calculatedMarketSellResults = calculateMarketSellResults(orders, wethSellAmount);
        if (calculatedMarketSellResults.takerFeePaid > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future market buy
            FillResults memory feeTokensResults = marketBuyZrxInternal(
                feeOrders,
                feeSignatures,
                calculatedMarketSellResults.takerFeePaid
            );
            // Ensure the token abstraction was fair if fees were proportionally too high, we fail
            require(
                isAcceptableThreshold(
                    wethSellAmount,
                    safeSub(wethSellAmount, feeTokensResults.takerAssetFilledAmount)
                ),
                "UNACCEPTABLE_THRESHOLD"
            );
            remainingWethSellAmount = safeSub(remainingWethSellAmount, feeTokensResults.takerAssetFilledAmount);
            totalFillResults.takerFeePaid = feeTokensResults.takerFeePaid;
            totalFillResults.takerAssetFilledAmount = feeTokensResults.takerAssetFilledAmount;
        }
        // Make our market sell to buy the requested tokens with the remaining balance
        FillResults memory requestedTokensResults = EXCHANGE.marketSellOrders(
            orders,
            remainingWethSellAmount,
            signatures
        );
        // Update our return FillResult with the market sell
        addFillResults(totalFillResults, requestedTokensResults);
        return totalFillResults;
    }

    /// @dev Market sells WETH for ZRX tokens.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param wethSellAmount The amount of WETH to sell.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketSellEthForZRXInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256 wethSellAmount
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        // Make our market sell to buy the requested tokens with the remaining balance
        totalFillResults = EXCHANGE.marketSellOrders(
            orders,
            wethSellAmount,
            signatures
        );
        // Exchange does not special case ZRX in the makerAssetFilledAmount, if fees were deducted then using this amount
        // for future transfers is invalid.
        uint256 zrxAmountBought = safeSub(totalFillResults.makerAssetFilledAmount, totalFillResults.takerFeePaid);
        require(
            isAcceptableThreshold(totalFillResults.makerAssetFilledAmount, zrxAmountBought),
            "UNACCEPTABLE_THRESHOLD"
        );
        totalFillResults.makerAssetFilledAmount = zrxAmountBought;
        return totalFillResults;
    }

    /// @dev Buys an exact amount of an ERC20 token using WETH.
    /// @param orders Orders to fill. The maker asset is the ERC20 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @param makerTokenFillAmount Amount of the ERC20 token to buy.
    /// @return totalFillResults Aggregated fill results of buying the ERC20 and ZRX tokens.
    function marketBuyERC20TokensInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 makerTokenFillAmount
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults)
    {
        // We read the maker token address to check if it is ZRX and later use it for transfer
        address makerTokenAddress = LibBytes.readAddress(orders[0].makerAssetData, 16);
        // We assume that asset being bought by taker is the same for each order.
        // Rather than passing this in as calldata, we copy the makerAssetData from the first order onto all later orders.
        orders[0].takerAssetData = WETH_ASSET_DATA;
        // We can short cut here for effeciency and use buyFeeTokensInternal if maker asset token is ZRX
        // this buys us exactly that amount taking into account the fees. This saves gas and calculates the rate correctly
        FillResults memory marketBuyResults;
        if (makerTokenAddress == address(ZRX_TOKEN)) {
            marketBuyResults = marketBuyZrxInternal(
                orders,
                signatures,
                makerTokenFillAmount
            );
            // When buying ZRX we round up which can result in a small margin excess
            require(
                marketBuyResults.makerAssetFilledAmount >= makerTokenFillAmount,
                "UNACCEPTABLE_THRESHOLD"
            );
            addFillResults(totalFillResults, marketBuyResults);
            require(
                isAcceptableThreshold(
                    safeAdd(totalFillResults.makerAssetFilledAmount, totalFillResults.takerFeePaid), // Total ZRX
                    totalFillResults.makerAssetFilledAmount // amount going to msg.sender
                ),
                "UNACCEPTABLE_THRESHOLD"
            );
        } else {
            FillResults memory calculatedMarketBuyResults = calculateMarketBuyResults(orders, makerTokenFillAmount);
            if (calculatedMarketBuyResults.takerFeePaid > 0) {
                // Fees are required for these orders. Buy enough ZRX to cover the future market buy
                FillResults memory zrxMarketBuyResults = marketBuyZrxInternal(
                    feeOrders,
                    feeSignatures,
                    calculatedMarketBuyResults.takerFeePaid
                );
                totalFillResults.takerAssetFilledAmount = zrxMarketBuyResults.takerAssetFilledAmount;
                totalFillResults.takerFeePaid = zrxMarketBuyResults.takerFeePaid;
            }
            // Make our market buy of the requested tokens with the remaining balance
            marketBuyResults = EXCHANGE.marketBuyOrders(
                orders,
                makerTokenFillAmount,
                signatures
            );
            require(
                marketBuyResults.makerAssetFilledAmount == makerTokenFillAmount,
                "UNACCEPTABLE_THRESHOLD"
            );
            addFillResults(totalFillResults, marketBuyResults);
            require(
                isAcceptableThreshold(
                    totalFillResults.takerAssetFilledAmount,
                    marketBuyResults.takerAssetFilledAmount
                ),
                "UNACCEPTABLE_THRESHOLD"
            );
        }
        // Transfer all purchased tokens to msg.sender
        transferERC20Token(
            makerTokenAddress,
            msg.sender,
            marketBuyResults.makerAssetFilledAmount
        );
        return totalFillResults;
    }

    /// @dev Buys an all of the ERC721 tokens in the orders.
    /// @param orders Orders to fill. The maker asset is the ERC721 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @return totalFillResults Aggregated fill results of buying the ERC721 tokens and ZRX tokens.
    function batchBuyERC721TokensInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults)
    {
        uint256 totalZrxFeeAmount;
        uint256 ordersLength = orders.length;
        uint256[] memory takerAssetFillAmounts = new uint256[](ordersLength);
        for (uint256 i = 0; i < ordersLength; i++) {
            // Total up the fees
            totalZrxFeeAmount = safeAdd(totalZrxFeeAmount, orders[i].takerFee);
            // We assume that asset being bought by taker is the same for each order.
            // Rather than passing this in as calldata, we set the takerAssetData as WETH asset data
            orders[i].takerAssetData = WETH_ASSET_DATA;
            // Populate takerAssetFillAmounts for later batchFill
            takerAssetFillAmounts[i] = orders[i].takerAssetAmount;
        }
        if (totalZrxFeeAmount > 0) {
            // Fees are required for these orders. Buy enough ZRX to cover the future fill
            FillResults memory zrxMarketBuyResults = marketBuyZrxInternal(
                feeOrders,
                feeSignatures,
                totalZrxFeeAmount
            );
            totalFillResults.takerFeePaid = zrxMarketBuyResults.takerFeePaid;
            totalFillResults.takerAssetFilledAmount = zrxMarketBuyResults.takerAssetFilledAmount;
        }
        FillResults memory batchFillResults = EXCHANGE.batchFillOrKillOrders(
            orders,
            takerAssetFillAmounts,
            signatures
        );
        addFillResults(totalFillResults, batchFillResults);
        require(
            isAcceptableThreshold(
                totalFillResults.takerAssetFilledAmount,
                batchFillResults.takerAssetFilledAmount
            ),
            "UNACCEPTABLE_THRESHOLD"
        );
        // Transfer all of the tokens filled from the batchFill
        for (i = 0; i < ordersLength; i++) {
            transferERC721Token(
                orders[i].makerAssetData,
                msg.sender
            );
        }
        return totalFillResults;
    }
}
