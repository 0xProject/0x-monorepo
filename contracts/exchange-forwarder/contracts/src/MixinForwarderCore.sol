/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "./libs/LibConstants.sol";
import "./interfaces/IAssets.sol";
import "./interfaces/IForwarderCore.sol";
import "./MixinAssets.sol";
import "./MixinExchangeWrapper.sol";
import "./MixinWeth.sol";


contract MixinForwarderCore is
    LibFillResults,
    LibMath,
    LibConstants,
    IAssets,
    IForwarderCore,
    MixinWeth,
    MixinAssets,
    MixinExchangeWrapper
{
    using LibBytes for bytes;

    /// @dev Constructor approves ERC20 proxy to transfer ZRX and WETH on this contract's behalf.
    constructor ()
        public
    {
        address proxyAddress = EXCHANGE.getAssetProxy(ERC20_DATA_ID);
        require(
            proxyAddress != address(0),
            "UNREGISTERED_ASSET_PROXY"
        );
        ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
    }

    /// @dev Purchases as much of orders' makerAssets as possible by selling up to 95% of transaction's ETH value.
    ///      Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
    ///      5% of ETH value is reserved for paying fees to order feeRecipients (in ZRX) and forwarding contract feeRecipient (in ETH).
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return Amounts filled and fees paid by maker and taker for both sets of orders.
    function marketSellOrdersWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256 feePercentage,
        address payable feeRecipient
    )
        public
        payable
        returns (FillResults memory orderFillResults)
    {
        // Convert ETH to WETH.
        _convertEthToWeth();

        // Calculate amount of WETH that won't be spent on ETH fees.
        uint256 wethSellAmount = _getPartialAmountFloor(
            PERCENTAGE_DENOMINATOR,
            _safeAdd(PERCENTAGE_DENOMINATOR, feePercentage),
            msg.value
        );

        _approveMakerAssetProxy(orders[0].makerAssetData);

        // Market sell 95% of WETH.
        // ZRX fees are payed with this contract's balance.
        orderFillResults = _marketSellWeth(
            orders,
            wethSellAmount,
            signatures
        );

        // Transfer feePercentage of total ETH spent on primary orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        _transferEthFeeAndRefund(
            orderFillResults.takerAssetFilledAmount,
            feePercentage,
            feeRecipient
        );

        // Transfer purchased assets to msg.sender.
        _transferAssetToSender(
            orders[0].makerAssetData,
            orderFillResults.makerAssetFilledAmount
        );
    }

    /// @dev Attempt to purchase makerAssetFillAmount of makerAsset by selling ETH provided with transaction.
    ///      Any ZRX required to pay fees for primary orders will automatically be purchased by this contract.
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param makerAssetFillAmount Desired amount of makerAsset to purchase.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return Amounts filled and fees paid by maker and taker for both sets of orders.
    function marketBuyOrdersWithEth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures,
        uint256 feePercentage,
        address payable feeRecipient
    )
        public
        payable
        returns (FillResults memory orderFillResults)
    {
        // Convert ETH to WETH.
        _convertEthToWeth();

        _approveMakerAssetProxy(orders[0].makerAssetData);

        // Attempt to purchase desired amount of makerAsset.
        // ZRX fees are payed with this contract's balance.
        orderFillResults = _marketBuyExactAmountWithWeth(
            orders,
            makerAssetFillAmount,
            signatures
        );

        // Transfer feePercentage of total ETH spent on primary orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        _transferEthFeeAndRefund(
            orderFillResults.takerAssetFilledAmount,
            feePercentage,
            feeRecipient
        );

        // Transfer purchased assets to msg.sender.
        _transferAssetToSender(
            orders[0].makerAssetData,
            orderFillResults.makerAssetFilledAmount
        );
    }
}
