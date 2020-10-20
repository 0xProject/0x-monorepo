/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibMathV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";


interface IExchange {

    /// @dev V3 Order structure.
    struct Order {
        // Address that created the order.
        address makerAddress;
        // Address that is allowed to fill the order.
        // If set to 0, any address is allowed to fill the order.
        address takerAddress;
        // Address that will recieve fees when order is filled.
        address feeRecipientAddress;
        // Address that is allowed to call Exchange contract methods that affect this order.
        // If set to 0, any address is allowed to call these methods.
        address senderAddress;
        // Amount of makerAsset being offered by maker. Must be greater than 0.
        uint256 makerAssetAmount;
        // Amount of takerAsset being bid on by maker. Must be greater than 0.
        uint256 takerAssetAmount;
        // Fee paid to feeRecipient by maker when order is filled.
        uint256 makerFee;
        // Fee paid to feeRecipient by taker when order is filled.
        uint256 takerFee;
        // Timestamp in seconds at which order expires.
        uint256 expirationTimeSeconds;
        // Arbitrary number to facilitate uniqueness of the order's hash.
        uint256 salt;
        // Encoded data that can be decoded by a specified proxy contract when transferring makerAsset.
        // The leading bytes4 references the id of the asset proxy.
        bytes makerAssetData;
        // Encoded data that can be decoded by a specified proxy contract when transferring takerAsset.
        // The leading bytes4 references the id of the asset proxy.
        bytes takerAssetData;
        // Encoded data that can be decoded by a specified proxy contract when transferring makerFeeAsset.
        // The leading bytes4 references the id of the asset proxy.
        bytes makerFeeAssetData;
        // Encoded data that can be decoded by a specified proxy contract when transferring takerFeeAsset.
        // The leading bytes4 references the id of the asset proxy.
        bytes takerFeeAssetData;
    }

    // A valid order remains fillable until it is expired, fully filled, or cancelled.
    // An order's status is unaffected by external factors, like account balances.
    enum OrderStatus {
        INVALID,                     // Default value
        INVALID_MAKER_ASSET_AMOUNT,  // Order does not have a valid maker asset amount
        INVALID_TAKER_ASSET_AMOUNT,  // Order does not have a valid taker asset amount
        FILLABLE,                    // Order is fillable
        EXPIRED,                     // Order has already expired
        FULLY_FILLED,                // Order is fully filled
        CANCELLED                    // Order has been cancelled
    }

    /// @dev Order information returned by `getOrderInfo()`.
    struct OrderInfo {
        OrderStatus orderStatus;              // Status that describes order's validity and fillability.
        bytes32 orderHash;                    // EIP712 typed data hash of the order (see LibOrder.getTypedDataHash).
        uint256 orderTakerAssetFilledAmount;  // Amount of order that has already been filled.
    }

    /// @dev Gets information about an order: status, hash, and amount filled.
    /// @param order Order to gather information on.
    /// @return orderInfo Information about the order and its state.
    function getOrderInfo(IExchange.Order calldata order)
        external
        view
        returns (IExchange.OrderInfo memory orderInfo);

    /// @dev Verifies that a hash has been signed by the given signer.
    /// @param hash Any 32-byte hash.
    /// @param signature Proof that the hash has been signed by signer.
    /// @return isValid `true` if the signature is valid for the given hash and signer.
    function isValidHashSignature(
        bytes32 hash,
        address signerAddress,
        bytes calldata signature
    )
        external
        view
        returns (bool isValid);

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(bytes4 assetProxyId)
        external
        view
        returns (address);
}

contract NativeOrderSampler {
    using LibSafeMathV06 for uint256;
    using LibBytesV06 for bytes;

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
        IExchange.Order[] memory orders,
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
        IExchange.Order[] memory orders,
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
                orderFillableMakerAssetAmounts[i] = LibMathV06.getPartialAmountCeil(
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
        IExchange.Order memory order,
        bytes memory signature,
        IExchange exchange
    )
        virtual
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

        IExchange.OrderInfo memory orderInfo = exchange.getOrderInfo(order);
        if (orderInfo.orderStatus != IExchange.OrderStatus.FILLABLE) {
            return 0;
        }
        if (!exchange.isValidHashSignature(orderInfo.orderHash, order.makerAddress, signature)) {
            return 0;
        }
        address spender = exchange.getAssetProxy(ERC20_ASSET_PROXY_ID);
        IERC20TokenV06 makerToken = _getTokenFromERC20AssetData(order.makerAssetData);
        if (makerToken == IERC20TokenV06(0)) {
            return 0;
        }
        IERC20TokenV06 makerFeeToken = order.makerFee > 0
            ? _getTokenFromERC20AssetData(order.makerFeeAssetData)
            : IERC20TokenV06(0);
        uint256 remainingTakerAmount = order.takerAssetAmount
            .safeSub(orderInfo.orderTakerAssetFilledAmount);
        fillableTakerAmount = remainingTakerAmount;
        // The total fillable maker amount is the remaining fillable maker amount
        // PLUS maker fees, if maker fees are denominated in the maker token.
        uint256 totalFillableMakerAmount = LibMathV06.safeGetPartialAmountFloor(
            remainingTakerAmount,
            order.takerAssetAmount,
            makerFeeToken == makerToken
                ? order.makerAssetAmount.safeAdd(order.makerFee)
                : order.makerAssetAmount
        );
        // The spendable amount of maker tokens (by the maker) is the lesser of
        // the maker's balance and the allowance they've granted to the ERC20Proxy.
        uint256 spendableMakerAmount = LibSafeMathV06.min256(
            makerToken.balanceOf(order.makerAddress),
            makerToken.allowance(order.makerAddress, spender)
        );
        // Scale the fillable taker amount by the ratio of the maker's
        // spendable maker amount over the total fillable maker amount.
        if (spendableMakerAmount < totalFillableMakerAmount) {
            fillableTakerAmount = LibMathV06.getPartialAmountCeil(
                spendableMakerAmount,
                totalFillableMakerAmount,
                remainingTakerAmount
            );
        }
        // If the maker fee is denominated in another token, constrain
        // the fillable taker amount by how much the maker can pay of that token.
        if (makerFeeToken != makerToken && makerFeeToken != IERC20TokenV06(0)) {
            uint256 spendableExtraMakerFeeAmount = LibSafeMathV06.min256(
                makerFeeToken.balanceOf(order.makerAddress),
                makerFeeToken.allowance(order.makerAddress, spender)
            );
            if (spendableExtraMakerFeeAmount < order.makerFee) {
                fillableTakerAmount = LibSafeMathV06.min256(
                    fillableTakerAmount,
                    LibMathV06.getPartialAmountCeil(
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
        returns (IERC20TokenV06 token)
    {
        if (assetData.length == 0) {
            return IERC20TokenV06(address(0));
        }
        if (assetData.length != 36 ||
            assetData.readBytes4(0) != ERC20_ASSET_PROXY_ID)
        {
            return IERC20TokenV06(address(0));
        }
        return IERC20TokenV06(assetData.readAddress(16));
    }
}
