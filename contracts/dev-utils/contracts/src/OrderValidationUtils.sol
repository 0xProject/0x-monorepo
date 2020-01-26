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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./Addresses.sol";
import "./AssetBalance.sol";
import "./LibAssetData.sol";
import "./LibOrderTransferSimulation.sol";


contract OrderValidationUtils is
    Addresses,
    AssetBalance
{
    using LibBytes for bytes;
    using LibSafeMath for uint256;

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
        returns (
            LibOrder.OrderInfo memory orderInfo,
            uint256 fillableTakerAssetAmount,
            bool isValidSignature
        )
    {
        // Get info specific to order
        orderInfo = IExchange(exchangeAddress).getOrderInfo(order);

        // Validate the maker's signature
        address makerAddress = order.makerAddress;
        isValidSignature = IExchange(exchangeAddress).isValidOrderSignature(
            order,
            signature
        );

        // Get the transferable amount of the `makerAsset`
        uint256 transferableMakerAssetAmount = _getTransferableConvertedMakerAssetAmount(
            order
        );

        // Get the amount of `takerAsset` that is transferable to maker given the
        // transferability of `makerAsset`, `makerFeeAsset`,
        // and the total amounts specified in the order
        uint256 transferableTakerAssetAmount;
        if (order.makerAssetData.equals(order.makerFeeAssetData)) {
            // If `makerAsset` equals `makerFeeAsset`, the % that can be filled is
            // transferableMakerAssetAmount / (makerAssetAmount + makerFee)
            transferableTakerAssetAmount = LibMath.getPartialAmountFloor(
                transferableMakerAssetAmount,
                order.makerAssetAmount.safeAdd(order.makerFee),
                order.takerAssetAmount
            );
        } else {
            // If `makerFee` is 0, the % that can be filled is (transferableMakerAssetAmount / makerAssetAmount)
            if (order.makerFee == 0) {
                transferableTakerAssetAmount = LibMath.getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    order.makerAssetAmount,
                    order.takerAssetAmount
                );

            // If `makerAsset` does not equal `makerFeeAsset`, the % that can be filled is the lower of
            // (transferableMakerAssetAmount / makerAssetAmount) and (transferableMakerAssetFeeAmount / makerFee)
            } else {
                // Get the transferable amount of the `makerFeeAsset`
                uint256 transferableMakerFeeAssetAmount = getTransferableAssetAmount(
                    makerAddress,
                    order.makerFeeAssetData
                );
                uint256 transferableMakerToTakerAmount = LibMath.getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    order.makerAssetAmount,
                    order.takerAssetAmount
                );
                uint256 transferableMakerFeeToTakerAmount = LibMath.getPartialAmountFloor(
                    transferableMakerFeeAssetAmount,
                    order.makerFee,
                    order.takerAssetAmount
                );
                transferableTakerAssetAmount = LibSafeMath.min256(transferableMakerToTakerAmount, transferableMakerFeeToTakerAmount);
            }
        }

        // `fillableTakerAssetAmount` is the lower of the order's remaining `takerAssetAmount` and the `transferableTakerAssetAmount`
        fillableTakerAssetAmount = LibSafeMath.min256(
            order.takerAssetAmount.safeSub(orderInfo.orderTakerAssetFilledAmount),
            transferableTakerAssetAmount
        );

        // Execute the maker transfers.
        fillableTakerAssetAmount = LibOrderTransferSimulation.getSimulatedOrderMakerTransferResults(
            exchangeAddress,
            order,
            order.takerAddress,
            fillableTakerAssetAmount
        ) == LibOrderTransferSimulation.OrderTransferResults.TransfersSuccessful ? fillableTakerAssetAmount : 0;

        if (!_isAssetDataValid(order.takerAssetData)) {
            fillableTakerAssetAmount = 0;
        }

        if (order.takerFee != 0 && !_isAssetDataValid(order.takerFeeAssetData)) {
            fillableTakerAssetAmount = 0;
        }

        if (orderInfo.orderStatus != LibOrder.OrderStatus.FILLABLE) {
            fillableTakerAssetAmount = 0;
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

    /// @dev Gets the amount of an asset transferable by the maker of an order.
    /// @param ownerAddress Address of the owner of the asset.
    /// @param assetData Description of tokens, per the AssetProxy contract specification.
    /// @return The amount of the asset tranferable by the owner.
    /// NOTE: If the `assetData` encodes data for multiple assets, the `transferableAssetAmount`
    /// will represent the amount of times the entire `assetData` can be transferred. To calculate
    /// the total individual transferable amounts, this scaled `transferableAmount` must be multiplied by
    /// the individual asset amounts located within the `assetData`.
    function getTransferableAssetAmount(address ownerAddress, bytes memory assetData)
        public
        returns (uint256 transferableAssetAmount)
    {
        (uint256 balance, uint256 allowance) = getBalanceAndAssetProxyAllowance(
            ownerAddress,
            assetData
        );
        transferableAssetAmount = LibSafeMath.min256(balance, allowance);
        return transferableAssetAmount;
    }

    /// @dev Gets the amount of an asset transferable by the maker of an order.
    ///      Similar to `getTransferableAssetAmount()`, but can handle maker asset
    ///      types that depend on taker assets being transferred first (e.g., Dydx bridge).
    /// @param order The order.
    /// @return transferableAssetAmount Amount of maker asset that can be transferred.
    function _getTransferableConvertedMakerAssetAmount(
        LibOrder.Order memory order
    )
        internal
        returns (uint256 transferableAssetAmount)
    {
        (uint256 balance, uint256 allowance) = _getConvertibleMakerBalanceAndAssetProxyAllowance(order);
        transferableAssetAmount = LibSafeMath.min256(balance, allowance);
        return transferableAssetAmount;
    }

    /// @dev This function handles the edge cases around taker validation. This function
    ///      currently attempts to find duplicate ERC721 token's in the taker
    ///      multiAssetData.
    /// @param assetData The asset data that should be validated.
    /// @return Whether or not the order should be considered valid.
    function _isAssetDataValid(bytes memory assetData)
        internal
        pure
        returns (bool)
    {
        // Asset data must be composed of an asset proxy Id and a bytes segment with
        // a length divisible by 32.
        if (assetData.length % 32 != 4) {
            return false;
        }

        // Only process the taker asset data if it is multiAssetData.
        bytes4 assetProxyId = assetData.readBytes4(0);
        if (assetProxyId != IAssetData(address(0)).MultiAsset.selector) {
            return true;
        }

        // Get array of values and array of assetDatas
        (, , bytes[] memory nestedAssetData) =
            LibAssetData.decodeMultiAssetData(assetData);

        uint256 length = nestedAssetData.length;
        for (uint256 i = 0; i != length; i++) {
            // TODO(jalextowle): Implement similar validation for non-fungible ERC1155 asset data.
            bytes4 nestedAssetProxyId = nestedAssetData[i].readBytes4(0);
            if (nestedAssetProxyId == IAssetData(address(0)).ERC721Token.selector) {
                if (_isAssetDataDuplicated(nestedAssetData, i)) {
                    return false;
                }
            }
        }

        return true;
    }

    /// Determines whether or not asset data is duplicated later in the nested asset data.
    /// @param nestedAssetData The asset data to scan for duplication.
    /// @param startIdx The index where the scan should begin.
    /// @return A boolean reflecting whether or not the starting asset data was duplicated.
    function _isAssetDataDuplicated(
        bytes[] memory nestedAssetData,
        uint256 startIdx
    )
        internal
        pure
        returns (bool)
    {
        uint256 length = nestedAssetData.length;
        for (uint256 i = startIdx + 1; i < length; i++) {
            if (nestedAssetData[startIdx].equals(nestedAssetData[i])) {
                return true;
            }
        }
    }
}
