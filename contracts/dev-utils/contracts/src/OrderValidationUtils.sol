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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./LibAssetData.sol";


contract OrderValidationUtils is
    LibAssetData
{
    using LibBytes for bytes;
    using LibSafeMath for uint256;

    constructor (address _exchange)
        public
        LibAssetData(_exchange)
    {}

    /// @dev Fetches all order-relevant information needed to validate if the supplied order is fillable.
    /// @param order The order structure.
    /// @param signature Signature provided by maker that proves the order's authenticity.
    /// `0x01` can always be provided if the signature does not need to be validated.
    /// @return The orderInfo (hash, status, and `takerAssetAmount` already filled for the given order),
    /// fillableTakerAssetAmount (amount of the order's `takerAssetAmount` that is fillable given all on-chain state),
    /// and isValidSignature (validity of the provided signature).
    /// NOTE: If the `takerAssetData` encodes data for multiple assets, `fillableTakerAssetAmount` will represent a "scaled"
    /// amount, meaning it must be multiplied by all the individual asset amounts within the `takerAssetData` to get the final
    /// amount of each asset that can be filled.
    function getOrderRelevantState(LibOrder.Order memory order, bytes memory signature)
        public
        view
        returns (
            LibOrder.OrderInfo memory orderInfo,
            uint256 fillableTakerAssetAmount,
            bool isValidSignature
        )
    {
        // Get info specific to order
        orderInfo = _EXCHANGE.getOrderInfo(order);

        // Validate the maker's signature
        address makerAddress = order.makerAddress;
        isValidSignature = _EXCHANGE.isValidOrderSignature(
            order,
            signature
        );

        // Get the transferable amount of the `makerAsset`
        uint256 transferableMakerAssetAmount = getTransferableAssetAmount(makerAddress, order.makerAssetData);

        // Assign to stack variables to reduce redundant mloads/sloads
        uint256 takerAssetAmount = order.takerAssetAmount;
        uint256 makerFee = order.makerFee;
        uint256 makerAssetAmount = order.makerAssetAmount;

        // Get the amount of `takerAsset` that is transferable to maker given the transferability of `makerAsset`, `makerFeeAsset`,
        // and the total amounts specified in the order
        uint256 transferableTakerAssetAmount;

        // If `makerFee` is 0, the % that can be filled is (transferableMakerAssetAmount / makerAssetAmount)
        if (makerFee == 0) {
            transferableTakerAssetAmount = LibMath.getPartialAmountFloor(
                transferableMakerAssetAmount,
                makerAssetAmount,
                takerAssetAmount
            );
        } else {
            if (order.makerFeeAssetData.equals(order.makerAssetData)) {
                // The % that can be filled is transferableMakerAssetAmount / (makerAssetAmount + makerFee)
                transferableTakerAssetAmount = LibMath.getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    makerAssetAmount.safeAdd(makerFee),
                    takerAssetAmount
                );
            } else if (order.makerFeeAssetData.equals(order.takerAssetData)) {
                // The % that can be filled is
                // (transferableMakerAssetAmount + takerAssetAmount) / (makerAssetAmount + makerFee)
                transferableTakerAssetAmount = LibMath.getPartialAmountFloor(
                    transferableMakerAssetAmount.safeAdd(takerAssetAmount),
                    makerAssetAmount.safeAdd(makerFee),
                    takerAssetAmount
                );
            } else {
                // The % that can be filled is the lower of
                // (transferableMakerAssetAmount / makerAssetAmount) and (transferableMakerAssetFeeAmount / makerFee)

                // Get the transferable amount of the `makerFeeAsset`
                uint256 transferableMakerFeeAssetAmount = getTransferableAssetAmount(makerAddress, order.makerFeeAssetData);

                uint256 transferableMakerToTakerAmount = LibMath.getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    makerAssetAmount,
                    takerAssetAmount
                );
                uint256 transferableMakerFeeToTakerAmount = LibMath.getPartialAmountFloor(
                    transferableMakerFeeAssetAmount,
                    makerFee,
                    takerAssetAmount
                );
                transferableTakerAssetAmount = LibSafeMath.min256(transferableMakerToTakerAmount, transferableMakerFeeToTakerAmount);
            }
        }

        if (transferableTakerAssetAmount < orderInfo.orderTakerAssetFilledAmount) {
            fillableTakerAssetAmount = 0;
        } else {
            // `fillableTakerAssetAmount` is the lower of the order's remaining `takerAssetAmount` and the `transferableTakerAssetAmount`
            fillableTakerAssetAmount = LibSafeMath.min256(
                takerAssetAmount.safeSub(orderInfo.orderTakerAssetFilledAmount),
                transferableTakerAssetAmount
            );
        }

        return (orderInfo, fillableTakerAssetAmount, isValidSignature);
    }

    /// @dev Fetches all order-relevant information needed to validate if the supplied orders are fillable.
    /// @param orders Array of order structures.
    /// @param signatures Array of signatures provided by makers that prove the authenticity of the orders.
    /// `0x01` can always be provided if a signature does not need to be validated.
    /// @return The ordersInfo (array of the hash, status, and `takerAssetAmount` already filled for each order),
    /// fillableTakerAssetAmounts (array of amounts for each order's `takerAssetAmount` that is fillable given all on-chain state),
    /// and isValidSignature (array containing the validity of each provided signature).
    /// NOTE: If the `takerAssetData` encodes data for multiple assets, each element of `fillableTakerAssetAmounts`
    /// will represent a "scaled" amount, meaning it must be multiplied by all the individual asset amounts within
    /// the `takerAssetData` to get the final amount of each asset that can be filled.
    function getOrderRelevantStates(LibOrder.Order[] memory orders, bytes[] memory signatures)
        public
        view
        returns (
            LibOrder.OrderInfo[] memory ordersInfo,
            uint256[] memory fillableTakerAssetAmounts,
            bool[] memory isValidSignature
        )
    {
        uint256 length = orders.length;
        ordersInfo = new LibOrder.OrderInfo[](length);
        fillableTakerAssetAmounts = new uint256[](length);
        isValidSignature = new bool[](length);

        for (uint256 i = 0; i != length; i++) {
            (ordersInfo[i], fillableTakerAssetAmounts[i], isValidSignature[i]) = getOrderRelevantState(
                orders[i],
                signatures[i]
            );
        }

        return (ordersInfo, fillableTakerAssetAmounts, isValidSignature);
    }

    /// @dev Gets the amount of an asset transferable by the owner.
    /// @param ownerAddress Address of the owner of the asset.
    /// @param assetData Description of tokens, per the AssetProxy contract specification.
    /// @return The amount of the asset transferable by the owner.
    /// NOTE: If the `assetData` encodes data for multiple assets, the `transferableAssetAmount`
    /// will represent the amount of times the entire `assetData` can be transferred. To calculate
    /// the total individual transferable amounts, this scaled `transferableAmount` must be multiplied by
    /// the individual asset amounts located within the `assetData`.
    function getTransferableAssetAmount(address ownerAddress, bytes memory assetData)
        public
        view
        returns (uint256 transferableAssetAmount)
    {
        (uint256 balance, uint256 allowance) = getBalanceAndAssetProxyAllowance(ownerAddress, assetData);
        transferableAssetAmount = LibSafeMath.min256(balance, allowance);
        return transferableAssetAmount;
    }
}
