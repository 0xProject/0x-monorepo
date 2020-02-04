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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-extensions/contracts/src/LibAssetDataTransfer.sol";
import "@0x/contracts-extensions/contracts/src/MixinWethUtils.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./MixinExchangeWrapper.sol";
import "./MixinReceiver.sol";
import "./interfaces/IForwarder.sol";


contract Forwarder is
    IForwarder,
    Ownable,
    MixinWethUtils,
    MixinExchangeWrapper,
    MixinReceiver
{
    using LibBytes for bytes;
    using LibAssetDataTransfer for bytes;
    using LibSafeMath for uint256;

    constructor (
        address _exchange,
        address _exchangeV2,
        address _weth
    )
        public
        Ownable()
        MixinWethUtils(
            _exchange,
            _weth
        )
        MixinExchangeWrapper(
            _exchange,
            _exchangeV2
        )
    {} // solhint-disable-line no-empty-blocks

    /// @dev Withdraws assets from this contract. It may be used by the owner to withdraw assets
    ///      that were accidentally sent to this contract.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of the asset to withdraw.
    function withdrawAsset(
        bytes calldata assetData,
        uint256 amount
    )
        external
        onlyOwner
    {
        assetData.transferOut(amount);
    }

    /// @dev Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
    ///      This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
    ///      Forwarder contract to the fee recipient.
    ///      This method needs to be called before forwarding orders of a maker asset that hasn't
    ///      previously been approved.
    /// @param assetData Byte array encoded for the respective asset proxy.
    function approveMakerAssetProxy(bytes calldata assetData)
        external
    {
        bytes4 proxyId = assetData.readBytes4(0);
        bytes4 erc20ProxyId = IAssetData(address(0)).ERC20Token.selector;

        // For now we only care about ERC20, since percentage fees on ERC721 tokens are invalid.
        if (proxyId == erc20ProxyId) {
            address proxyAddress = EXCHANGE.getAssetProxy(erc20ProxyId);
            if (proxyAddress == address(0)) {
                LibRichErrors.rrevert(LibForwarderRichErrors.UnregisteredAssetProxyError());
            }
            address token = assetData.readAddress(16);
            LibERC20Token.approve(token, proxyAddress, MAX_UINT256);
        }
    }

    /// @dev Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
    ///      as possible, accounting for order and forwarder fees.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    function marketSellOrdersWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // Pay ETH affiliate fees to all feeRecipient addresses
        uint256 wethRemaining = _transferEthFeesAndWrapRemaining(
            ethFeeAmounts,
            feeRecipients
        );
        // Spends up to wethRemaining to fill orders, transfers purchased assets to msg.sender,
        // and pays WETH order fees.
        (
            wethSpentAmount,
            makerAssetAcquiredAmount
        ) = _marketSellNoThrow(
            orders,
            wethRemaining,
            signatures
        );

        // Ensure that no extra WETH owned by this contract has been spent.
        if (wethSpentAmount > wethRemaining) {
            LibRichErrors.rrevert(LibForwarderRichErrors.OverspentWethError(
                wethSpentAmount,
                msg.value
            ));
        }

        // Calculate amount of WETH that hasn't been spent.
        wethRemaining = wethRemaining.safeSub(wethSpentAmount);

        // Refund remaining ETH to msg.sender.
        _unwrapAndTransferEth(wethRemaining);
    }

    /// @dev Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
    ///      The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
    ///      pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    function marketBuyOrdersWithEth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // Pay ETH affiliate fees to all feeRecipient addresses
        uint256 wethRemaining = _transferEthFeesAndWrapRemaining(
            ethFeeAmounts,
            feeRecipients
        );

        // Attempts to fill the desired amount of makerAsset and trasnfer purchased assets to msg.sender.
        (
            wethSpentAmount,
            makerAssetAcquiredAmount
        ) = _marketBuyFillOrKill(
            orders,
            makerAssetBuyAmount,
            signatures
        );

        // Ensure that no extra WETH owned by this contract has been spent.
        if (wethSpentAmount > wethRemaining) {
            LibRichErrors.rrevert(LibForwarderRichErrors.OverspentWethError(
                wethSpentAmount,
                msg.value
            ));
        }

        // Calculate amount of WETH that hasn't been spent.
        wethRemaining = wethRemaining.safeSub(wethSpentAmount);

        // Refund remaining ETH to msg.sender.
        _unwrapAndTransferEth(wethRemaining);
    }
}
