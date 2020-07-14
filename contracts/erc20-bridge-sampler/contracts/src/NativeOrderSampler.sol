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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "./IDevUtils.sol";


contract NativeOrderSampler {

    /// @dev Gas limit for DevUtils calls.
    uint256 constant internal DEV_UTILS_CALL_GAS = 500e3; // 500k

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    ///      maker/taker asset amounts (returning 0).
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param devUtilsAddress Address to the DevUtils contract.
    /// @return orderFillableTakerAssetAmounts How much taker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableTakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures,
        address devUtilsAddress
    )
        public
        view
        returns (uint256[] memory orderFillableTakerAssetAmounts)
    {
        orderFillableTakerAssetAmounts = new uint256[](orders.length);
        for (uint256 i = 0; i != orders.length; i++) {
            // Ignore orders with no signature or empty maker/taker amounts.
            if (orderSignatures[i].length == 0 ||
                orders[i].makerAssetAmount == 0 ||
                orders[i].takerAssetAmount == 0) {
                orderFillableTakerAssetAmounts[i] = 0;
                continue;
            }
            // solhint-disable indent
            (bool didSucceed, bytes memory resultData) =
                devUtilsAddress
                    .staticcall
                    .gas(DEV_UTILS_CALL_GAS)
                    (abi.encodeWithSelector(
                       IDevUtils(devUtilsAddress).getOrderRelevantState.selector,
                       orders[i],
                       orderSignatures[i]
                    ));
            // solhint-enable indent
            if (!didSucceed) {
                orderFillableTakerAssetAmounts[i] = 0;
                continue;
            }
            (
                LibOrder.OrderInfo memory orderInfo,
                uint256 fillableTakerAssetAmount,
                bool isValidSignature
            ) = abi.decode(
                resultData,
                (LibOrder.OrderInfo, uint256, bool)
            );
            // The fillable amount is zero if the order is not fillable or if the
            // signature is invalid.
            if (orderInfo.orderStatus != LibOrder.OrderStatus.FILLABLE ||
                !isValidSignature) {
                orderFillableTakerAssetAmounts[i] = 0;
            } else {
                orderFillableTakerAssetAmounts[i] = fillableTakerAssetAmount;
            }
        }
    }

    /// @dev Queries the fillable taker asset amounts of native orders.
    ///      Effectively ignores orders that have empty signatures or
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param devUtilsAddress Address to the DevUtils contract.
    /// @return orderFillableMakerAssetAmounts How much maker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableMakerAssetAmounts(
        LibOrder.Order[] memory orders,
        bytes[] memory orderSignatures,
        address devUtilsAddress
    )
        public
        view
        returns (uint256[] memory orderFillableMakerAssetAmounts)
    {
        orderFillableMakerAssetAmounts = getOrderFillableTakerAssetAmounts(
            orders,
            orderSignatures,
            devUtilsAddress
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
}
