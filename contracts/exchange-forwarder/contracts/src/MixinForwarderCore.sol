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
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./interfaces/IAssets.sol";
import "./interfaces/IForwarderCore.sol";
import "./MixinExchangeWrapper.sol";
import "./MixinWeth.sol";


contract MixinForwarderCore is
    LibConstants,
    IAssets,
    IForwarderCore,
    MixinWeth,
    MixinExchangeWrapper
{
    using LibBytes for bytes;
    using LibSafeMath for uint256;

    /// @dev Constructor approves ERC20 proxy to transfer WETH on this contract's behalf.
    constructor ()
        public
    {
        address proxyAddress = EXCHANGE.getAssetProxy(IAssetData(address(0)).ERC20Token.selector);
        if (proxyAddress == address(0)) {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnregisteredAssetProxyError());
        }
        ETHER_TOKEN.approve(proxyAddress, MAX_UINT);

        address protocolFeeCollector = EXCHANGE.protocolFeeCollector();
        if (protocolFeeCollector != address(0)) {
            ETHER_TOKEN.approve(protocolFeeCollector, MAX_UINT);
        }
    }

    /// @dev Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
    ///      as possible, accounting for order and forwarder fees.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    /// @return ethFeePaid Amount of ETH spent on the given forwarder fee.
    function marketSellOrdersWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256 feePercentage,
        address payable feeRecipient
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount,
            uint256 ethFeePaid
        )
    {
        // Convert ETH to WETH.
        _convertEthToWeth();

        // Calculate amount of WETH that won't be spent on the forwarder fee.
        uint256 wethSellAmount = LibMath.getPartialAmountFloor(
            PERCENTAGE_DENOMINATOR,
            feePercentage.safeAdd(PERCENTAGE_DENOMINATOR),
            msg.value
        );

        // Spends up to wethSellAmount to fill orders, transfers purchased assets to msg.sender,
        // and pays WETH order fees.
        (
            wethSpentAmount,
            makerAssetAcquiredAmount
        ) = _marketSellWeth(
            orders,
            wethSellAmount,
            signatures
        );

        // Transfer feePercentage of total ETH spent on orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        ethFeePaid = _transferEthFeeAndRefund(
            wethSpentAmount,
            feePercentage,
            feeRecipient
        );
    }

    /// @dev Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
    ///      The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
    ///      pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param feePercentage Percentage of WETH sold that will payed as fee to forwarding contract feeRecipient.
    /// @param feeRecipient Address that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    /// @return ethFeePaid Amount of ETH spent on the given forwarder fee.
    function marketBuyOrdersWithEth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures,
        uint256 feePercentage,
        address payable feeRecipient
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount,
            uint256 ethFeePaid
        )
    {
        // Convert ETH to WETH.
        _convertEthToWeth();

        // Attempts to fill the desired amount of makerAsset and trasnfer purchased assets to msg.sender.
        (
            wethSpentAmount,
            makerAssetAcquiredAmount
        ) = _marketBuyExactAmountWithWeth(
            orders,
            makerAssetBuyAmount,
            signatures
        );

        // Transfer feePercentage of total ETH spent on orders to feeRecipient.
        // Refund remaining ETH to msg.sender.
        ethFeePaid = _transferEthFeeAndRefund(
            wethSpentAmount,
            feePercentage,
            feeRecipient
        );
    }
}
