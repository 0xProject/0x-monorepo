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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "./LibAssetData.sol";


contract OrderValidationUtils is
    LibAssetData,
    LibMath
{
    using LibBytes for bytes;

    // solhint-disable var-name-mixedcase
    bytes internal _ZRX_ASSET_DATA;
    // solhint-enable var-name-mixedcase

    constructor (address _exchange, bytes memory _zrxAssetData)
        public
        LibAssetData(_exchange)
    {
        _ZRX_ASSET_DATA = _zrxAssetData;
    }

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
        isValidSignature = _EXCHANGE.isValidSignature(
            orderInfo.orderHash,
            makerAddress,
            signature
        );

        // Get the transferable amount of the `makerAsset`
        uint256 transferableMakerAssetAmount = getTransferableAssetAmount(makerAddress, order.makerAssetData);

        // Assign to stack variables to reduce redundant mloads/sloads
        uint256 takerAssetAmount = order.takerAssetAmount;
        uint256 makerFee = order.makerFee;
        bytes memory zrxAssetData = _ZRX_ASSET_DATA;
    
        // Get the amount of `takerAsset` that is transferable to maker given the transferability of `makerAsset`, `makerFeeAsset`,
        // and the total amounts specified in the order
        uint256 transferableTakerAssetAmount;
        if (order.makerAssetData.equals(zrxAssetData)) {
            // If `makerAsset` equals `makerFeeAsset`, the % that can be filled is
            // transferableMakerAssetAmount / (makerAssetAmount + makerFee)
            transferableTakerAssetAmount = getPartialAmountFloor(
                transferableMakerAssetAmount,
                safeAdd(order.makerAssetAmount, makerFee),
                takerAssetAmount
            );
        } else {
            // Get the transferable amount of the `makerFeeAsset`
            uint256 transferableMakerFeeAssetAmount = getTransferableAssetAmount(makerAddress, zrxAssetData);

            // If `makerFee` is 0, the % that can be filled is (transferableMakerAssetAmount / makerAssetAmount)
            if (makerFee == 0) {
                transferableTakerAssetAmount = getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    order.makerAssetAmount,
                    takerAssetAmount
                );

            // If `makerAsset` does not equal `makerFeeAsset`, the % that can be filled is the lower of
            // (transferableMakerAssetAmount / makerAssetAmount) and (transferableMakerAssetFeeAmount / makerFee)
            } else {
                uint256 transferableMakerToTakerAmount = getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    order.makerAssetAmount,
                    takerAssetAmount
                );
                uint256 transferableMakerFeeToTakerAmount = getPartialAmountFloor(
                    transferableMakerFeeAssetAmount,
                    makerFee,
                    takerAssetAmount
                );
                transferableTakerAssetAmount = min256(transferableMakerToTakerAmount, transferableMakerFeeToTakerAmount);
            }
        }

        // `fillableTakerAssetAmount` is the lower of the order's remaining `takerAssetAmount` and the `transferableTakerAssetAmount`
        fillableTakerAssetAmount = min256(
            safeSub(takerAssetAmount, orderInfo.orderTakerAssetFilledAmount),
            transferableTakerAssetAmount
        );

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
    /// @return The amount of the asset tranferable by the owner.
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
        transferableAssetAmount = min256(balance, allowance);
        return transferableAssetAmount;
    }
}
