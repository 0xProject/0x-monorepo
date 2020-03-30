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
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-extensions/contracts/src/LibAssetDataTransfer.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./interfaces/IExchangeV2.sol";


contract MixinExchangeWrapper {

    // The v2 order id is the first 4 bytes of the ExchangeV2 order schema hash.
    // bytes4(keccak256(abi.encodePacked(
    //     "Order(",
    //     "address makerAddress,",
    //     "address takerAddress,",
    //     "address feeRecipientAddress,",
    //     "address senderAddress,",
    //     "uint256 makerAssetAmount,",
    //     "uint256 takerAssetAmount,",
    //     "uint256 makerFee,",
    //     "uint256 takerFee,",
    //     "uint256 expirationTimeSeconds,",
    //     "uint256 salt,",
    //     "bytes makerAssetData,",
    //     "bytes takerAssetData",
    //     ")"
    // )));
    bytes4 constant public EXCHANGE_V2_ORDER_ID = 0x770501f8;
    bytes4 constant internal ERC20_BRIDGE_PROXY_ID = 0xdc1600f3;

     // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    IExchangeV2 internal EXCHANGE_V2;
    // solhint-enable var-name-mixedcase

    using LibBytes for bytes;
    using LibAssetDataTransfer for bytes;
    using LibSafeMath for uint256;

    constructor (
        address _exchange,
        address _exchangeV2
    )
        public
    {
        EXCHANGE = IExchange(_exchange);
        EXCHANGE_V2 = IExchangeV2(_exchangeV2);
    }

    struct SellFillResults {
        uint256 wethSpentAmount;
        uint256 makerAssetAcquiredAmount;
        uint256 protocolFeePaid;
    }

    /// @dev Fills the input order.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function _fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        if (_isV2Order(order)) {
            return _fillV2OrderNoThrow(
                order,
                takerAssetFillAmount,
                signature
            );
        }

        return _fillV3OrderNoThrow(
            order,
            takerAssetFillAmount,
            signature
        );
    }

    /// @dev Executes a single call of fillOrder according to the wethSellAmount and
    ///      the amount already sold.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingTakerAssetFillAmount Remaining amount of WETH to sell.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketSellSingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingTakerAssetFillAmount
    )
        internal
        returns (SellFillResults memory sellFillResults)
    {
        // If the maker asset is ERC20Bridge, take a snapshot of the Forwarder contract's balance.
        bytes4 makerAssetProxyId = order.makerAssetData.readBytes4(0);
        address tokenAddress;
        uint256 balanceBefore;
        if (makerAssetProxyId == ERC20_BRIDGE_PROXY_ID) {
            tokenAddress = order.makerAssetData.readAddress(16);
            balanceBefore = IERC20Token(tokenAddress).balanceOf(address(this));
        }
        // No taker fee or percentage fee
        if (
            order.takerFee == 0 ||
            _areUnderlyingAssetsEqual(order.takerFeeAssetData, order.makerAssetData)
        ) {
            // Attempt to sell the remaining amount of WETH
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            sellFillResults.wethSpentAmount = singleFillResults.takerAssetFilledAmount;
            sellFillResults.protocolFeePaid = singleFillResults.protocolFeePaid;

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            sellFillResults.makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount
                .safeSub(singleFillResults.takerFeePaid);

        // WETH fee
        } else if (_areUnderlyingAssetsEqual(order.takerFeeAssetData, order.takerAssetData)) {

            // We will first sell WETH as the takerAsset, then use it to pay the takerFee.
            // This ensures that we reserve enough to pay the taker and protocol fees.
            uint256 takerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.takerAssetAmount.safeAdd(order.takerFee),
                remainingTakerAssetFillAmount
            );

            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                takerAssetFillAmount,
                signature
            );

            // WETH is also spent on the taker fee, so we add it here.
            sellFillResults.wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.takerFeePaid);
            sellFillResults.makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;
            sellFillResults.protocolFeePaid = singleFillResults.protocolFeePaid;

        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        // Account for the ERC20Bridge transfering more of the maker asset than expected.
        if (makerAssetProxyId == ERC20_BRIDGE_PROXY_ID) {
            uint256 balanceAfter = IERC20Token(tokenAddress).balanceOf(address(this));
            sellFillResults.makerAssetAcquiredAmount = LibSafeMath.max256(
                balanceAfter.safeSub(balanceBefore),
                sellFillResults.makerAssetAcquiredAmount
            );
        }

        order.makerAssetData.transferOut(sellFillResults.makerAssetAcquiredAmount);
        return sellFillResults;
    }


    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH has been sold by taker.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketSellNoThrow(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 protocolFee = tx.gasprice.safeMul(EXCHANGE.protocolFeeMultiplier());

        for (uint256 i = 0; i != orders.length; i++) {
            // Preemptively skip to avoid division by zero in _marketSellSingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            // The remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = wethSellAmount
                .safeSub(totalWethSpentAmount)
                .safeSub(_isV2Order(orders[i]) ? 0 : protocolFee);

            SellFillResults memory sellFillResults = _marketSellSingleOrder(
                orders[i],
                signatures[i],
                remainingTakerAssetFillAmount
            );

            totalWethSpentAmount = totalWethSpentAmount
                .safeAdd(sellFillResults.wethSpentAmount)
                .safeAdd(sellFillResults.protocolFeePaid);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount
                .safeAdd(sellFillResults.makerAssetAcquiredAmount);

            // Stop execution if the entire amount of WETH has been sold
            if (totalWethSpentAmount >= wethSellAmount) {
                break;
            }
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of WETH (exclusive of protocol fee)
    ///      has been sold by taker.
    /// @param orders Array of order specifications.
    /// @param wethSellAmount Desired amount of WETH to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketSellExactAmountNoThrow(
        LibOrder.Order[] memory orders,
        uint256 wethSellAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 totalProtocolFeePaid;

        for (uint256 i = 0; i != orders.length; i++) {
            // Preemptively skip to avoid division by zero in _marketSellSingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            // The remaining amount of WETH to sell
            uint256 remainingTakerAssetFillAmount = wethSellAmount
                .safeSub(totalWethSpentAmount);

            SellFillResults memory sellFillResults = _marketSellSingleOrder(
                orders[i],
                signatures[i],
                remainingTakerAssetFillAmount
            );

            totalWethSpentAmount = totalWethSpentAmount
                .safeAdd(sellFillResults.wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount
                .safeAdd(sellFillResults.makerAssetAcquiredAmount);
            totalProtocolFeePaid = totalProtocolFeePaid.safeAdd(sellFillResults.protocolFeePaid);

            // Stop execution if the entire amount of WETH has been sold
            if (totalWethSpentAmount >= wethSellAmount) {
                break;
            }
        }
        totalWethSpentAmount = totalWethSpentAmount.safeAdd(totalProtocolFeePaid);
    }

    /// @dev Executes a single call of fillOrder according to the makerAssetBuyAmount and
    ///      the amount already bought.
    /// @param order A single order specification.
    /// @param signature Signature for the given order.
    /// @param remainingMakerAssetFillAmount Remaining amount of maker asset to buy.
    /// @return wethSpentAmount Amount of WETH spent on the given order.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given order.
    function _marketBuySingleOrder(
        LibOrder.Order memory order,
        bytes memory signature,
        uint256 remainingMakerAssetFillAmount
    )
        internal
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        )
    {
        // No taker fee or WETH fee
        if (
            order.takerFee == 0 ||
            _areUnderlyingAssetsEqual(order.takerFeeAssetData, order.takerAssetData)
        ) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            // WETH is also spent on the protocol and taker fees, so we add it here.
            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.takerFeePaid)
                .safeAdd(singleFillResults.protocolFeePaid);

            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount;

        // Percentage fee
        } else if (_areUnderlyingAssetsEqual(order.takerFeeAssetData, order.makerAssetData)) {
            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = LibMath.getPartialAmountCeil(
                order.takerAssetAmount,
                order.makerAssetAmount.safeSub(order.takerFee),
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            LibFillResults.FillResults memory singleFillResults = _fillOrderNoThrow(
                order,
                remainingTakerAssetFillAmount,
                signature
            );

            wethSpentAmount = singleFillResults.takerAssetFilledAmount
                .safeAdd(singleFillResults.protocolFeePaid);

            // Subtract fee from makerAssetFilledAmount for the net amount acquired.
            makerAssetAcquiredAmount = singleFillResults.makerAssetFilledAmount
                .safeSub(singleFillResults.takerFeePaid);

        // Unsupported fee
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedFeeError(order.takerFeeAssetData));
        }

        return (wethSpentAmount, makerAssetAcquiredAmount);
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is acquired.
    ///      Note that the Forwarder may fill more than the makerAssetBuyAmount so that, after percentage fees
    ///      are paid, the net amount acquired after fees is equal to makerAssetBuyAmount (modulo rounding).
    ///      The asset being sold by taker must always be WETH.
    /// @param orders Array of order specifications.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to fill.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return totalWethSpentAmount Total amount of WETH spent on the given orders.
    /// @return totalMakerAssetAcquiredAmount Total amount of maker asset acquired from the given orders.
    function _marketBuyFillOrKill(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures
    )
        internal
        returns (
            uint256 totalWethSpentAmount,
            uint256 totalMakerAssetAcquiredAmount
        )
    {
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {
            // Preemptively skip to avoid division by zero in _marketBuySingleOrder
            if (orders[i].makerAssetAmount == 0 || orders[i].takerAssetAmount == 0) {
                continue;
            }

            uint256 remainingMakerAssetFillAmount = makerAssetBuyAmount
                .safeSub(totalMakerAssetAcquiredAmount);

            // If the maker asset is ERC20Bridge, take a snapshot of the Forwarder contract's balance.
            bytes4 makerAssetProxyId = orders[i].makerAssetData.readBytes4(0);
            address tokenAddress;
            uint256 balanceBefore;
            if (makerAssetProxyId == ERC20_BRIDGE_PROXY_ID) {
                tokenAddress = orders[i].makerAssetData.readAddress(16);
                balanceBefore = IERC20Token(tokenAddress).balanceOf(address(this));
            }

            (
                uint256 wethSpentAmount,
                uint256 makerAssetAcquiredAmount
            ) = _marketBuySingleOrder(
                orders[i],
                signatures[i],
                remainingMakerAssetFillAmount
            );

            // Account for the ERC20Bridge transfering more of the maker asset than expected.
            if (makerAssetProxyId == ERC20_BRIDGE_PROXY_ID) {
                uint256 balanceAfter = IERC20Token(tokenAddress).balanceOf(address(this));
                makerAssetAcquiredAmount = LibSafeMath.max256(
                    balanceAfter.safeSub(balanceBefore),
                    makerAssetAcquiredAmount
                );
            }

            orders[i].makerAssetData.transferOut(makerAssetAcquiredAmount);

            totalWethSpentAmount = totalWethSpentAmount
                .safeAdd(wethSpentAmount);
            totalMakerAssetAcquiredAmount = totalMakerAssetAcquiredAmount
                .safeAdd(makerAssetAcquiredAmount);

            // Stop execution if the entire amount of makerAsset has been bought
            if (totalMakerAssetAcquiredAmount >= makerAssetBuyAmount) {
                break;
            }
        }

        if (totalMakerAssetAcquiredAmount < makerAssetBuyAmount) {
            LibRichErrors.rrevert(LibForwarderRichErrors.CompleteBuyFailedError(
                makerAssetBuyAmount,
                totalMakerAssetAcquiredAmount
            ));
        }
    }

    /// @dev Fills the input ExchangeV2 order. The `makerFeeAssetData` must be
    //       equal to EXCHANGE_V2_ORDER_ID (0x770501f8).
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function _fillV2OrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        // Strip v3 specific fields from order
        IExchangeV2.Order memory v2Order = IExchangeV2.Order({
            makerAddress: order.makerAddress,
            takerAddress: order.takerAddress,
            feeRecipientAddress: order.feeRecipientAddress,
            senderAddress: order.senderAddress,
            makerAssetAmount: order.makerAssetAmount,
            takerAssetAmount: order.takerAssetAmount,
            // NOTE: We assume fees are 0 for all v2 orders. Orders with non-zero fees will fail to be filled.
            makerFee: 0,
            takerFee: 0,
            expirationTimeSeconds: order.expirationTimeSeconds,
            salt: order.salt,
            makerAssetData: order.makerAssetData,
            takerAssetData: order.takerAssetData
        });

        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            IExchangeV2(address(0)).fillOrder.selector,
            v2Order,
            takerAssetFillAmount,
            signature
        );

        address exchange = address(EXCHANGE_V2);
        (bool didSucceed, bytes memory returnData) = exchange.call(fillOrderCalldata);
        if (didSucceed) {
            assert(returnData.length == 128);
            // NOTE: makerFeePaid, takerFeePaid, and protocolFeePaid will always be 0 for v2 orders
            (fillResults.makerAssetFilledAmount, fillResults.takerAssetFilledAmount) = abi.decode(returnData, (uint256, uint256));
        }

        // fillResults values will be 0 by default if call was unsuccessful
        return fillResults;
    }

    /// @dev Fills the input ExchangeV3 order.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function _fillV3OrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            IExchange(address(0)).fillOrder.selector,
            order,
            takerAssetFillAmount,
            signature
        );

        address exchange = address(EXCHANGE);
        (bool didSucceed, bytes memory returnData) = exchange.call(fillOrderCalldata);
        if (didSucceed) {
            assert(returnData.length == 160);
            fillResults = abi.decode(returnData, (LibFillResults.FillResults));
        }

        // fillResults values will be 0 by default if call was unsuccessful
        return fillResults;
    }

    /// @dev Checks whether one asset is effectively equal to another asset.
    ///      This is the case if they have the same ERC20Proxy/ERC20BridgeProxy asset data, or if
    ///      one is the ERC20Bridge equivalent of the other.
    /// @param assetData1 Byte array encoded for the takerFee asset proxy.
    /// @param assetData2 Byte array encoded for the maker asset proxy.
    /// @return areEqual Whether or not the underlying assets are equal.
    function _areUnderlyingAssetsEqual(
        bytes memory assetData1,
        bytes memory assetData2
    )
        internal
        pure
        returns (bool)
    {
        bytes4 assetProxyId1 = assetData1.readBytes4(0);
        bytes4 assetProxyId2 = assetData2.readBytes4(0);
        bytes4 erc20ProxyId = IAssetData(address(0)).ERC20Token.selector;
        bytes4 erc20BridgeProxyId = IAssetData(address(0)).ERC20Bridge.selector;

        if (
            (assetProxyId1 == erc20ProxyId || assetProxyId1 == erc20BridgeProxyId) &&
            (assetProxyId2 == erc20ProxyId || assetProxyId2 == erc20BridgeProxyId)
        ) {
            // Compare the underlying token addresses.
            address token1 = assetData1.readAddress(16);
            address token2 = assetData2.readAddress(16);
            return (token1 == token2);
        } else {
            return assetData1.equals(assetData2);
        }
    }

    /// @dev Checks whether an order is a v2 order.
    /// @param order Order struct containing order specifications.
    /// @return True if the order's `makerFeeAssetData` is set to the v2 order id.
    function _isV2Order(LibOrder.Order memory order)
        internal
        pure
        returns (bool)
    {
        return order.makerFeeAssetData.length > 3 && order.makerFeeAssetData.readBytes4(0) == EXCHANGE_V2_ORDER_ID;
    }
}
