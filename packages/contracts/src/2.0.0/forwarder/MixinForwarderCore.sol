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
        require(
            orders.length > 0,
            "INVALID_ORDERS_LENGTH"
        );

        // Convert ETH to WETH.
        convertEthToWeth();

        uint256 makerAssetAmountPurchased;
        uint256 wethAvailable;
        if (orders[0].makerAssetData.equals(ZRX_ASSET_DATA)) {
            // Calculate amount of WETH that won't be spent on ETH fees.
            wethAvailable = getPartialAmount(
                PERCENTAGE_DENOMINATOR,
                safeAdd(PERCENTAGE_DENOMINATOR, feePercentage),
                msg.value
            );
            // Market sell available WETH.
            // ZRX fees are paid with this contract's balance.
            orderFillResults = marketSellWeth(
                orders,
                wethAvailable,
                signatures
            );
            // The fee amount must be deducted from the amount transfered back to sender.
            makerAssetAmountPurchased = safeSub(orderFillResults.makerAssetFilledAmount, orderFillResults.takerFeePaid);
        } else {
            // 5% of WETH is reserved for filling feeOrders and paying feeRecipient.
            wethAvailable = getPartialAmount(
                MAX_WETH_FILL_PERCENTAGE,
                PERCENTAGE_DENOMINATOR,
                msg.value
            );
            // Market sell 95% of WETH.
            // ZRX fees are payed with this contract's balance.
            orderFillResults = marketSellWeth(
                orders,
                wethAvailable,
                signatures
            );
            // Buy back all ZRX spent on fees.
            feeOrderFillResults = marketBuyZrx(
                feeOrders,
                orderFillResults.takerFeePaid,
                feeSignatures
            );
            makerAssetAmountPurchased = orderFillResults.makerAssetFilledAmount;
        }

        // Ensure that no extra WETH owned by this contract has been sold.
        uint256 totalWethSold = safeAdd(orderFillResults.takerAssetFilledAmount, feeOrderFillResults.takerAssetFilledAmount);
        require(
            totalWethSold <= msg.value,
            "OVERSOLD_WETH"
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
        require(
            orders.length > 0,
            "INVALID_ORDERS_LENGTH"
        );

        // Convert ETH to WETH.
        convertEthToWeth();

        uint256 makerAssetAmountPurchased;
        if (orders[0].makerAssetData.equals(ZRX_ASSET_DATA)) {
            // If the makerAsset is ZRX, it is not necessary to pay fees out of this
            // contracts's ZRX balance because fees are factored into the price of the order.
            orderFillResults = marketBuyZrx(
                orders,
                makerAssetFillAmount,
                signatures
            );
            // The fee amount must be deducted from the amount transfered back to sender.
            makerAssetAmountPurchased = safeSub(orderFillResults.makerAssetFilledAmount, orderFillResults.takerFeePaid);
        } else {
            // Attemp to purchase desired amount of makerAsset.
            // ZRX fees are payed with this contract's balance.
            orderFillResults = marketBuyAsset(
                orders,
                makerAssetFillAmount,
                signatures
            );
            // Buy back all ZRX spent on fees.
            feeOrderFillResults = marketBuyZrx(
                feeOrders,
                orderFillResults.takerFeePaid,
                feeSignatures
            );
            makerAssetAmountPurchased = orderFillResults.makerAssetFilledAmount;
        }

        // Ensure that no extra WETH owned by this contract has been sold.
        uint256 totalWethSold = safeAdd(orderFillResults.takerAssetFilledAmount, feeOrderFillResults.takerAssetFilledAmount);
        require(
            totalWethSold <= msg.value,
            "OVERSOLD_WETH"
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

    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset. 
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by maker and taker.
    function marketSellWeth(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (FillResults memory fillResults)
    {
        // `marketSellOrders` uses the first order's takerAssetData for all passed in orders.
        orders[0].takerAssetData = WETH_ASSET_DATA;

        // All orders are required to have the same makerAssetData. We save on gas by reusing the makerAssetData of the first order.
        for (uint256 i = 0; i < orders.length; i++) {
            orders[i].makerAssetData = orders[0].makerAssetData;
        }

        // Sell WETH until entire amount has been sold or all orders have been filled.
        fillResults = EXCHANGE.marketSellOrdersNoThrow(
            orders,
            wethSellAmount,
            signatures
        );

        return fillResults;
    }

    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset. 
    /// @param makerAssetFillAmount Desired amount of makerAsset to buy.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by maker and taker.
    function marketBuyAsset(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures
    )
        internal
        returns (FillResults memory fillResults)
    {
        bytes memory wethAssetData = WETH_ASSET_DATA;

        // All orders are required to have WETH as takerAssetData. We save on gas by populating the orders here, rather than passing in any extra calldata.
        for (uint256 i = 0; i < orders.length; i++) {
            orders[i].takerAssetData = wethAssetData;
        }

        // Purchase makerAsset until entire amount has been bought or all orders have been filled.
        fillResults = EXCHANGE.marketBuyOrdersNoThrow(
            orders,
            makerAssetFillAmount,
            signatures
        );

        return fillResults;
    }

    /// @dev Buys zrxBuyAmount of ZRX fee tokens, taking into account ZRX fees for each order. This will guarantee
    ///      that at least zrxBuyAmount of ZRX is purchased (sometimes slightly over due to rounding issues).
    ///      It is possible that a request to buy 200 ZRX will require purchasing 202 ZRX
    ///      as 2 ZRX is required to purchase the 200 ZRX fee tokens. This guarantees at least 200 ZRX for future purchases.
    /// @param orders Array of order specifications containing ZRX as makerAsset and WETH as takerAsset.
    /// @param zrxBuyAmount Desired amount of ZRX to buy.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return totalFillResults Amounts filled and fees paid by maker and taker.
    function marketBuyZrx(
        LibOrder.Order[] memory orders,
        uint256 zrxBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (FillResults memory totalFillResults)
    {
        // Do nothing if zrxBuyAmount == 0
        if (zrxBuyAmount > 0) {

            bytes memory zrxAssetData = ZRX_ASSET_DATA;
            bytes memory wethAssetData = WETH_ASSET_DATA;
            uint256 zrxPurchased = 0;

            for (uint256 i = 0; i < orders.length; i++) {

                // All of these are ZRX/WETH, so we can drop the respective assetData from calldata.
                orders[i].makerAssetData = zrxAssetData;
                orders[i].takerAssetData = wethAssetData;

                // Calculate the remaining amount of ZRX to buy.
                uint256 remainingZrxBuyAmount = safeSub(zrxBuyAmount, zrxPurchased);
    
                // Convert the remaining amount of ZRX to buy into remaining amount
                // of WETH to sell, assuming entire amount can be sold in the current order.
                uint256 remainingWethSellAmount = getPartialAmount(
                    orders[i].takerAssetAmount,
                    safeSub(orders[i].makerAssetAmount, orders[i].takerFee),  // our exchange rate after fees 
                    remainingZrxBuyAmount
                );

                // Attempt to sell the remaining amount of WETH.
                FillResults memory singleFillResult = EXCHANGE.fillOrderNoThrow(
                    orders[i],
                    safeAdd(remainingWethSellAmount, 1),
                    signatures[i]
                );

                // Update amounts filled and fees paid by maker and taker.
                addFillResults(totalFillResults, singleFillResult);
                zrxPurchased = safeSub(totalFillResults.makerAssetFilledAmount, totalFillResults.takerFeePaid);

                // Stop execution if the entire amount of ZRX has been bought.
                if (zrxPurchased >= zrxBuyAmount) {
                    break;
                }
            }

            // Ensure that all ZRX spent while filling primary orders has been repurchased.
            require(
                zrxPurchased >= zrxBuyAmount,
                "COMPLETE_FILL_FAILED"
            );
        }
        return totalFillResults;
    }
}
