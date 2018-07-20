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

import "./mixins/MWeth.sol";
import "./mixins/MAssets.sol";
import "./mixins/MConstants.sol";
import "./mixins/MExchangeWrapper.sol";
import "./mixins/MForwarderCore.sol";
import "../utils/LibBytes/LibBytes.sol";
import "../protocol/Exchange/libs/LibOrder.sol";
import "../protocol/Exchange/libs/LibFillResults.sol";
import "../protocol/Exchange/libs/LibMath.sol";


contract MixinForwarderCore is
    LibFillResults,
    LibMath,
    MConstants,
    MWeth,
    MAssets,
    MExchangeWrapper,
    MForwarderCore
{

    using LibBytes for bytes;

    /// @dev Constructor approves ERC20 proxy to transfer ZRX and WETH on this contract's behalf.
    constructor ()
        public
    {
        address proxyAddress = EXCHANGE.getAssetProxy(ERC20_DATA_ID);
        if (proxyAddress != address(0)) {
            ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
            ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
        }
    }

    /// @dev Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
    ///      Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
    ///      5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset. 
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feeOrders Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
    /// @param feeSignatures Proofs that feeOrders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return Amounts filled and fees paid by maker and taker for both sets of orders.
    function marketSellOrdersWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256  feePercentage,
        address feeRecipient
    )
        public
        payable
        returns (
            FillResults memory orderFillResults,
            FillResults memory feeOrderFillResults
        )
    {
        // Convert ETH to WETH.
        convertEthToWeth();

        uint256 wethSellAmount;
        uint256 zrxBuyAmount;
        uint256 makerAssetAmountPurchased;
        if (orders[0].makerAssetData.equals(ZRX_ASSET_DATA)) {
            // Calculate amount of WETH that won't be spent on ETH fees.
            wethSellAmount = getPartialAmount(
                PERCENTAGE_DENOMINATOR,
                safeAdd(PERCENTAGE_DENOMINATOR, feePercentage),
                msg.value
            );
            // Market sell available WETH.
            // ZRX fees are paid with this contract's balance.
            orderFillResults = marketSellWeth(
                orders,
                wethSellAmount,
                signatures
            );
            // The fee amount must be deducted from the amount transfered back to sender.
            makerAssetAmountPurchased = safeSub(orderFillResults.makerAssetFilledAmount, orderFillResults.takerFeePaid);
        } else {
            // 5% of WETH is reserved for filling feeOrders and paying feeRecipient.
            wethSellAmount = getPartialAmount(
                MAX_WETH_FILL_PERCENTAGE,
                PERCENTAGE_DENOMINATOR,
                msg.value
            );
            // Market sell 95% of WETH.
            // ZRX fees are payed with this contract's balance.
            orderFillResults = marketSellWeth(
                orders,
                wethSellAmount,
                signatures
            );
            // Buy back all ZRX spent on fees.
            zrxBuyAmount = orderFillResults.takerFeePaid;
            feeOrderFillResults = marketBuyZrxWithWeth(
                feeOrders,
                zrxBuyAmount,
                feeSignatures
            );
            makerAssetAmountPurchased = orderFillResults.makerAssetFilledAmount;
        }

        // Ensure that all ZRX fees have been repurchased and no extra WETH owned by this contract has been sold.
        assertValidFillResults(
            orderFillResults,
            feeOrderFillResults,
            zrxBuyAmount
        );

        // Transfer feePercentage of total ETH spent on primary orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        transferEthFeeAndRefund(
            orderFillResults.takerAssetFilledAmount,
            feeOrderFillResults.takerAssetFilledAmount,
            feePercentage,
            feeRecipient
        );

        // Transfer purchased assets to msg.sender.
        transferPurchasedAssetToSender(orders[0].makerAssetData, makerAssetAmountPurchased);
    }

    /// @dev Attempt to purchase makerAssetFillAmount of makerAsset by selling ETH provided with transaction.
    ///      Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset. 
    /// @param makerAssetFillAmount Desired amount of makerAsset to purchase.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feeOrders Array of order specifications containing ZRX as makerAsset and WETH as takerAsset. Used to purchase ZRX for primary order fees.
    /// @param feeSignatures Proofs that feeOrders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return Amounts filled and fees paid by maker and taker for both sets of orders.
    function marketBuyOrdersWithEth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256  feePercentage,
        address feeRecipient
    )
        public
        payable
        returns (
            FillResults memory orderFillResults,
            FillResults memory feeOrderFillResults
        )
    {
        // Convert ETH to WETH.
        convertEthToWeth();

        uint256 zrxBuyAmount;
        uint256 makerAssetAmountPurchased;
        if (orders[0].makerAssetData.equals(ZRX_ASSET_DATA)) {
            // If the makerAsset is ZRX, it is not necessary to pay fees out of this
            // contracts's ZRX balance because fees are factored into the price of the order.
            orderFillResults = marketBuyZrxWithWeth(
                orders,
                makerAssetFillAmount,
                signatures
            );
            // The fee amount must be deducted from the amount transfered back to sender.
            makerAssetAmountPurchased = safeSub(orderFillResults.makerAssetFilledAmount, orderFillResults.takerFeePaid);
        } else {
            // Attemp to purchase desired amount of makerAsset.
            // ZRX fees are payed with this contract's balance.
            orderFillResults = marketBuyWithWeth(
                orders,
                makerAssetFillAmount,
                signatures
            );
            // Buy back all ZRX spent on fees.
            zrxBuyAmount = orderFillResults.takerFeePaid;
            feeOrderFillResults = marketBuyZrxWithWeth(
                feeOrders,
                zrxBuyAmount,
                feeSignatures
            );
            makerAssetAmountPurchased = orderFillResults.makerAssetFilledAmount;
        }

        // Ensure that all ZRX fees have been repurchased and no extra WETH owned by this contract has been sold.
        assertValidFillResults(
            orderFillResults,
            feeOrderFillResults,
            zrxBuyAmount
        );

        // Transfer feePercentage of total ETH spent on primary orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        transferEthFeeAndRefund(
            orderFillResults.takerAssetFilledAmount,
            feeOrderFillResults.takerAssetFilledAmount,
            feePercentage,
            feeRecipient
        );

        // Transfer purchased assets to msg.sender.
        transferPurchasedAssetToSender(orders[0].makerAssetData, makerAssetAmountPurchased);
    }

    /// @dev Ensures that all ZRX fees have been repurchased and no extra WETH owned by this contract has been sold.
    /// @param orderFillResults Amounts filled and fees paid for primary orders.
    /// @param feeOrderFillResults Amounts filled and fees paid for fee orders.
    /// @param zrxBuyAmount The amount of ZRX that needed to be repurchased after filling primary orders.
    function assertValidFillResults(
        FillResults memory orderFillResults,
        FillResults memory feeOrderFillResults,
        uint256 zrxBuyAmount
    )
        internal
        view
    {
        // Ensure that all ZRX spent while filling primary orders has been repurchased.
        uint256 zrxPurchased = safeSub(feeOrderFillResults.makerAssetFilledAmount, feeOrderFillResults.takerFeePaid);
        require(
            zrxPurchased >= zrxBuyAmount,
            "COMPLETE_FILL_FAILED"
        );

        // Ensure that no extra WETH owned by this contract has been sold.
        uint256 wethSold = safeAdd(orderFillResults.takerAssetFilledAmount, feeOrderFillResults.takerAssetFilledAmount);
        require(
            wethSold <= msg.value,
            "OVERSOLD_WETH"
        );
    }
}
