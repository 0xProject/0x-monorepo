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
import "@0x/contracts-asset-proxy/contracts/src/libs/LibAssetData.sol";


contract OrderValidationUtils is
    LibAssetData,
    LibMath
{
    using LibBytes for bytes;

    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    bytes internal ZRX_ASSET_DATA;
    address internal ERC20_PROXY_ADDRESS;
    // solhint-enable var-name-mixedcase

    constructor (address _exchange, bytes memory _zrxAssetData)
        public
    {
        EXCHANGE = IExchange(_exchange);
        ZRX_ASSET_DATA = _zrxAssetData;
        ERC20_PROXY_ADDRESS = EXCHANGE.getAssetProxy(ERC20_PROXY_ID);
    }

    /// @dev Fetches information for order and maker/taker of order.
    /// @param order The order structure.
    /// @param signature Proof that order has been created by maker.
    /// @return OrderInfo, the remaining amount fillable by the taker, and validity of signature for given order.
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
        orderInfo = EXCHANGE.getOrderInfo(order);

        // Validate the maker's signature
        // If the signature does not need to be validated, `0x01` can be supplied for the signature to always return `false`.
        address makerAddress = order.makerAddress;
        isValidSignature = EXCHANGE.isValidSignature(
            orderInfo.orderHash,
            makerAddress,
            signature
        );

        // Get the transferable amount of the `makerAsset`
        uint256 transferableMakerAssetAmount = getTransferableAssetAmount(order.makerAssetData, makerAddress);

        // Assign to stack variables to reduce redundant mloads
        uint256 takerAssetAmount = order.takerAssetAmount;
        uint256 makerFee = order.makerFee;
    
        // Get the amount of `takerAsset` that is purchasable given the transferability of `makerAsset` and `makerFeeAsset`
        uint256 purchasableTakerAssetAmount;
        if (order.makerAssetData.equals(ZRX_ASSET_DATA)) {
            // If `makerAsset` equals `makerFeeAsset`, the % that can be filled is
            // transferableMakerAssetAmount / (makerAssetAmount + makerFee)
            purchasableTakerAssetAmount = getPartialAmountFloor(
                transferableMakerAssetAmount,
                safeAdd(order.makerAssetAmount, makerFee),
                takerAssetAmount
            );
        } else {
            // Get the transferable amount of the `makerFeeAsset`
            uint256 transferableMakerFeeAssetAmount = getTransferableAssetAmount(ZRX_ASSET_DATA, makerAddress);

            // If `makerAsset` does not equal `makerFeeAsset`, the % that can be filled is the lower of
            // (transferableMakerAssetAmount / makerAssetAmount) and (transferableMakerAssetFeeAmount / makerFee)
            // If `makerFee` is 0, we default to using `transferableMakerAssetAmount`
            purchasableTakerAssetAmount = makerFee == 0
                ? getPartialAmountFloor(
                    transferableMakerAssetAmount,
                    order.makerAssetAmount,
                    takerAssetAmount
                )
                : min256(
                    getPartialAmountFloor(
                        transferableMakerAssetAmount,
                        order.makerAssetAmount,
                        takerAssetAmount
                    ),
                    getPartialAmountFloor(
                        transferableMakerFeeAssetAmount,
                        makerFee,
                        takerAssetAmount
                    )
                );
        }
    
        // `fillableTakerAssetAmount` is the lower of the order's remaining `takerAssetAmount` and the `purchasableTakerAssetAmount`
        fillableTakerAssetAmount = min256(
            safeSub(takerAssetAmount, orderInfo.orderTakerAssetFilledAmount),
            purchasableTakerAssetAmount
        );

        return (orderInfo, fillableTakerAssetAmount, isValidSignature);
    }

    /// @dev Fetches information for all passed in orders and the makers/takers of each order.
    /// @param orders Array of order specifications.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Arrays of OrderInfo, fillable takerAssetAmounts, and validity of signatures that correspond to each order.
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

    /// @dev Gets the address of the AssetProxy that corresponds to the given assetData.
    /// @param assetData Description of tokens, per the AssetProxy contract specification.
    /// @return Address of the AssetProxy contract.
    function getAssetProxyAddress(bytes memory assetData)
        public
        view
        returns (address assetProxyAddress)
    {
        if (assetData.equals(ZRX_ASSET_DATA)) {
            return ERC20_PROXY_ADDRESS;
        }
        bytes4 assetProxyId = assetData.readBytes4(0);
        assetProxyAddress = EXCHANGE.getAssetProxy(assetProxyId);
        return assetProxyAddress;
    }

    /// @dev Gets the amount of an asset transferable by the owner.
    /// @param assetData Description of tokens, per the AssetProxy contract specification.
    /// @param ownerAddress Address of the owner of the asset.
    /// @return The amount of the asset tranferable by the owner.
    function getTransferableAssetAmount(bytes memory assetData, address ownerAddress)
        public
        view
        returns (uint256 transferableAssetAmount)
    {
        uint256 assetBalance = getBalance(ownerAddress, assetData);
        address assetProxyAddress = getAssetProxyAddress(assetData);
        uint256 assetAllowance = getAllowance(
            ownerAddress,
            assetProxyAddress,
            assetData
        );
        transferableAssetAmount = min256(assetBalance, assetAllowance);
        return transferableAssetAmount;
    }
}
