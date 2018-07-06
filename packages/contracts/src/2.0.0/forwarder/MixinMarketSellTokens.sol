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

import "../protocol/Exchange/libs/LibOrder.sol";
import "../utils/LibBytes/LibBytes.sol";
import "./MixinWethFees.sol";
import "./MixinExpectedResults.sol";
import "./MixinERC20.sol";
import "./MixinConstants.sol";
import "./MixinMarketBuyZrx.sol";


contract MixinMarketSellTokens is
    MixinConstants,
    MixinWethFees,
    MixinMarketBuyZrx,
    MixinExpectedResults,
    MixinERC20
{
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
        transferToken(
            makerTokenAddress,
            msg.sender,
            totalFillResults.makerAssetFilledAmount
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

}
