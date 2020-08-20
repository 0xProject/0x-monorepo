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

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";


contract NativeOrderSampler {
    using LibSafeMath for uint256;
    using LibBytes for bytes;

    /// @dev The Exchange ERC20Proxy ID.
    bytes4 private constant ERC20_ASSET_PROXY_ID = 0xf47261b0;
    /// @dev Gas limit for calls to `getOrderFillableTakerAmount()`.
    uint256 constant internal DEFAULT_CALL_GAS = 200e3; // 200k

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    ///      maker/taker asset amounts (returning 0).
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param exchange The V3 exchange.
    /// @return orderFillableTakerAssetAmounts How much taker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableTakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures,
        IExchange exchange
    )
        public
        view
        returns (uint256[] memory orderFillableTakerAssetAmounts)
    {
        orderFillableTakerAssetAmounts = new uint256[](orders.length);
        for (uint256 i = 0; i != orders.length; i++) {
            // solhint-disable indent
            (bool didSucceed, bytes memory resultData) =
                address(this)
                    .staticcall
                    .gas(DEFAULT_CALL_GAS)
                    (abi.encodeWithSelector(
                       this.getOrderFillableTakerAmount.selector,
                       orders[i],
                       orderSignatures[i],
                       exchange
                    ));
            // solhint-enable indent
            orderFillableTakerAssetAmounts[i] = didSucceed
                ? abi.decode(resultData, (uint256))
                : 0;
        }
    }

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param exchange The V3 exchange.
    /// @return orderFillableMakerAssetAmounts How much maker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableMakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures,
        IExchange exchange
    )
        public
        view
        returns (uint256[] memory orderFillableMakerAssetAmounts)
    {
        orderFillableMakerAssetAmounts = getOrderFillableTakerAssetAmounts(
            orders,
            orderSignatures,
            exchange
        );
        // `orderFillableMakerAssetAmounts` now holds taker asset amounts, so
        // convert them to maker asset amounts.
        for (uint256 i = 0; i < orders.length; ++i) {
            if (orderFillableMakerAssetAmounts[i] != 0) {
                orderFillableMakerAssetAmounts[i] = LibMath.getPartialAmountCeil(
                    orderFillableMakerAssetAmounts[i],
                    orders[i].takerAssetAmount,
                    orders[i].makerAssetAmount
                );
            }
        }
    }

    /// @dev Get the fillable taker amount of an order, taking into account
    ///      order state, maker fees, and maker balances.
    function getOrderFillableTakerAmount(
        LibOrder.Order memory order,
        bytes memory signature,
        IExchange exchange
    )
        public
        view
        returns (uint256 fillableTakerAmount)
    {
        if (signature.length == 0 ||
            order.makerAssetAmount == 0 ||
            order.takerAssetAmount == 0)
        {
            return 0;
        }

        LibOrder.OrderInfo memory orderInfo = exchange.getOrderInfo(order);
        if (orderInfo.orderStatus != LibOrder.OrderStatus.FILLABLE) {
            return 0;
        }
        if (!exchange.isValidHashSignature(orderInfo.orderHash, order.makerAddress, signature)) {
            return 0;
        }
        address spender = exchange.getAssetProxy(ERC20_ASSET_PROXY_ID);
        IERC20Token makerToken = _getTokenFromERC20AssetData(order.makerAssetData);
        if (makerToken == IERC20Token(0)) {
            return 0;
        }
        IERC20Token makerFeeToken = order.makerFee > 0
            ? _getTokenFromERC20AssetData(order.makerFeeAssetData)
            : IERC20Token(0);
        uint256 remainingTakerAmount = order.takerAssetAmount
            .safeSub(orderInfo.orderTakerAssetFilledAmount);
        fillableTakerAmount = remainingTakerAmount;
        // The total fillable maker amount is the remaining fillable maker amount
        // PLUS maker fees, if maker fees are denominated in the maker token.
        uint256 totalFillableMakerAmount = LibMath.safeGetPartialAmountFloor(
            remainingTakerAmount,
            order.takerAssetAmount,
            makerFeeToken == makerToken
                ? order.makerAssetAmount.safeAdd(order.makerFee)
                : order.makerAssetAmount
        );
        // The spendable amount of maker tokens (by the maker) is the lesser of
        // the maker's balance and the allowance they've granted to the ERC20Proxy.
        uint256 spendableMakerAmount = LibSafeMath.min256(
            makerToken.balanceOf(order.makerAddress),
            makerToken.allowance(order.makerAddress, spender)
        );
        // Scale the fillable taker amount by the ratio of the maker's
        // spendable maker amount over the total fillable maker amount.
        if (spendableMakerAmount < totalFillableMakerAmount) {
            fillableTakerAmount = LibMath.getPartialAmountCeil(
                spendableMakerAmount,
                totalFillableMakerAmount,
                remainingTakerAmount
            );
        }
        // If the maker fee is denominated in another token, constrain
        // the fillable taker amount by how much the maker can pay of that token.
        if (makerFeeToken != makerToken && makerFeeToken != IERC20Token(0)) {
            uint256 spendableExtraMakerFeeAmount = LibSafeMath.min256(
                makerFeeToken.balanceOf(order.makerAddress),
                makerFeeToken.allowance(order.makerAddress, spender)
            );
            if (spendableExtraMakerFeeAmount < order.makerFee) {
                fillableTakerAmount = LibSafeMath.min256(
                    fillableTakerAmount,
                    LibMath.getPartialAmountCeil(
                        spendableExtraMakerFeeAmount,
                        order.makerFee,
                        remainingTakerAmount
                    )
                );
            }
        }
    }

    function _getTokenFromERC20AssetData(bytes memory assetData)
        private
        pure
        returns (IERC20Token token)
    {
        if (assetData.length == 0) {
            return IERC20Token(address(0));
        }
        if (assetData.length != 36 ||
            assetData.readBytes4(0) != ERC20_ASSET_PROXY_ID)
        {
            return IERC20Token(address(0));
        }
        return IERC20Token(assetData.readAddress(16));
    }
}
