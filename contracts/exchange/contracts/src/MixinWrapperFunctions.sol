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

import "@0x/contracts-utils/contracts/src/ReentrancyGuard.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibExchangeSelectors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "./mixins/MExchangeCore.sol";
import "./mixins/MWrapperFunctions.sol";
import "./mixins/MExchangeRichErrors.sol";


contract MixinWrapperFunctions is
    ReentrancyGuard,
    LibExchangeSelectors,
    LibMath,
    LibFillResults,
    MExchangeCore,
    MWrapperFunctions,
    MExchangeRichErrors
{
    /// @dev Fills the input order. Reverts if exact takerAssetFillAmount not filled.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    function fillOrKillOrder(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        public
        nonReentrant
        returns (FillResults memory fillResults)
    {
        fillResults = _fillOrKillOrder(
            order,
            takerAssetFillAmount,
            signature
        );
        return fillResults;
    }

    /// @dev Fills the input order.
    ///      Returns a null FillResults instance if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        public
        returns (FillResults memory fillResults)
    {
        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            FILL_ORDER_SELECTOR,
            order,
            takerAssetFillAmount,
            signature
        );

        // Delegate to `fillOrder` and handle any exceptions gracefully
        assembly {
            let success := delegatecall(
                gas,                                // forward all gas
                address,                            // call address of this contract
                add(fillOrderCalldata, 32),         // pointer to start of input (skip array length in first 32 bytes)
                mload(fillOrderCalldata),           // length of input
                fillOrderCalldata,                  // write output over input
                128                                 // output size is 128 bytes
            )
            if success {
                mstore(fillResults, mload(fillOrderCalldata))
                mstore(add(fillResults, 32), mload(add(fillOrderCalldata, 32)))
                mstore(add(fillResults, 64), mload(add(fillOrderCalldata, 64)))
                mstore(add(fillResults, 96), mload(add(fillOrderCalldata, 96)))
            }
        }
        // fillResults values will be 0 by default if call was unsuccessful
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrder.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Array of amounts filled and fees paid by makers and taker.
    function batchFillOrders(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        nonReentrant
        returns (FillResults[] memory fillResults)
    {
        uint256 ordersLength = orders.length;
        fillResults = new FillResults[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            fillResults[i] = _fillOrder(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrKill.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Array of amounts filled and fees paid by makers and taker.
    function batchFillOrKillOrders(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        nonReentrant
        returns (FillResults[] memory fillResults)
    {
        uint256 ordersLength = orders.length;
        fillResults = new FillResults[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            fillResults[i] = _fillOrKillOrder(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrderNoThrow.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Array of amounts filled and fees paid by makers and taker.
    function batchFillOrdersNoThrow(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        returns (FillResults[] memory fillResults)
    {
        uint256 ordersLength = orders.length;
        fillResults = new FillResults[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            fillResults[i] = fillOrderNoThrow(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrders(
        LibOrder.Order[] memory orders,
        uint256 takerAssetFillAmount,
        bytes[] memory signatures
    )
        public
        nonReentrant
        returns (FillResults memory fillResults)
    {
        bytes memory takerAssetData = orders[0].takerAssetData;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // The `takerAssetData` must be the same for each order.
            // Rather than checking equality, we point the `takerAssetData` of each order to the same memory location.
            // This is less expensive than checking equality.
            orders[i].takerAssetData = takerAssetData;

            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = _safeSub(takerAssetFillAmount, fillResults.takerAssetFilledAmount);

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = _fillOrder(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(fillResults, singleFillResults);

            // Stop execution if the entire amount of takerAsset has been sold
            if (fillResults.takerAssetFilledAmount >= takerAssetFillAmount) {
                break;
            }
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrderNoThrow until total amount of takerAsset is sold by taker.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrdersNoThrow(
        LibOrder.Order[] memory orders,
        uint256 takerAssetFillAmount,
        bytes[] memory signatures
    )
        public
        returns (FillResults memory fillResults)
    {
        bytes memory takerAssetData = orders[0].takerAssetData;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // The `takerAssetData` must be the same for each order.
            // Rather than checking equality, we point the `takerAssetData` of each order to the same memory location.
            // This is less expensive than checking equality.
            orders[i].takerAssetData = takerAssetData;

            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = _safeSub(takerAssetFillAmount, fillResults.takerAssetFilledAmount);

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(fillResults, singleFillResults);

            // Stop execution if the entire amount of takerAsset has been sold
            if (fillResults.takerAssetFilledAmount >= takerAssetFillAmount) {
                break;
            }
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrder until total amount of makerAsset is bought by taker.
    /// @param orders Array of order specifications.
    /// @param makerAssetFillAmount Desired amount of makerAsset to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrders(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures
    )
        public
        nonReentrant
        returns (FillResults memory fillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // The `makerAssetData` must be the same for each order.
            // Rather than checking equality, we point the `makerAssetData` of each order to the same memory location.
            // This is less expensive than checking equality.
            orders[i].makerAssetData = makerAssetData;

            // Calculate the remaining amount of makerAsset to buy
            uint256 remainingMakerAssetFillAmount = _safeSub(makerAssetFillAmount, fillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerAsset to buy into remaining amount
            // of takerAsset to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerAssetFillAmount = _getPartialAmountFloor(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = _fillOrder(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(fillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been bought
            if (fillResults.makerAssetFilledAmount >= makerAssetFillAmount) {
                break;
            }
        }
        return fillResults;
    }

    /// @dev Executes multiple calls of fillOrderNoThrow until total amount of makerAsset is bought by taker.
    /// @param orders Array of order specifications.
    /// @param makerAssetFillAmount Desired amount of makerAsset to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrdersNoThrow(
        LibOrder.Order[] memory orders,
        uint256 makerAssetFillAmount,
        bytes[] memory signatures
    )
        public
        returns (FillResults memory fillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;

        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {

            // The `makerAssetData` must be the same for each order.
            // Rather than checking equality, we point the `makerAssetData` of each order to the same memory location.
            // This is less expensive than checking equality.
            orders[i].makerAssetData = makerAssetData;

            // Calculate the remaining amount of makerAsset to buy
            uint256 remainingMakerAssetFillAmount = _safeSub(makerAssetFillAmount, fillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerAsset to buy into remaining amount
            // of takerAsset to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerAssetFillAmount = _getPartialAmountFloor(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            _addFillResults(fillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been bought
            if (fillResults.makerAssetFilledAmount >= makerAssetFillAmount) {
                break;
            }
        }
        return fillResults;
    }

    /// @dev After calling, the order can not be filled anymore.
    //       Returns false if the cancelOrder call would otherwise revert.
    /// @param order Order to cancel. Order must be OrderStatus.FILLABLE.
    /// @return True if the order was cancelled successfully.
    function cancelOrderNoThrow(LibOrder.Order memory order)
        public
        returns (bool didCancel)
    {
        bytes memory cancelOrderCallData = abi.encodeWithSelector(CANCEL_ORDER_SELECTOR, order);
        (didCancel,) = address(this).delegatecall(cancelOrderCallData);
        return didCancel;
    }

    /// @dev Executes multiple calls of cancelOrder.
    /// @param orders Array of order specifications.
    function batchCancelOrders(LibOrder.Order[] memory orders)
        public
        nonReentrant
    {
        uint256 ordersLength = orders.length;
        for (uint256 i = 0; i != ordersLength; i++) {
            _cancelOrder(orders[i]);
        }
    }

    /// @dev Executes multiple calls of canccelOrderNoThrow.
    /// @param orders Array of order specifications.
    /// @return Bool array containing results of each individual cancellation.
    function batchCancelOrdersNoThrow(LibOrder.Order[] memory orders)
        public
        returns (bool[] memory)
    {
        uint256 ordersLength = orders.length;
        bool[] memory didCancel = new bool[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            didCancel[i] = cancelOrderNoThrow(orders[i]);
        }
        return didCancel;
    }

    /// @dev Fetches information for all passed in orders.
    /// @param orders Array of order specifications.
    /// @return Array of OrderInfo instances that correspond to each order.
    function getOrdersInfo(LibOrder.Order[] memory orders)
        public
        view
        returns (LibOrder.OrderInfo[] memory)
    {
        uint256 ordersLength = orders.length;
        LibOrder.OrderInfo[] memory ordersInfo = new LibOrder.OrderInfo[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            ordersInfo[i] = getOrderInfo(orders[i]);
        }
        return ordersInfo;
    }

    /// @dev Fills the input order. Reverts if exact takerAssetFillAmount not filled.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param signature Proof that order has been created by maker.
    function _fillOrKillOrder(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (FillResults memory fillResults)
    {
        fillResults = _fillOrder(
            order,
            takerAssetFillAmount,
            signature
        );
        if (fillResults.takerAssetFilledAmount != takerAssetFillAmount) {
            _rrevert(IncompleteFillError(getOrderInfo(order).orderHash));
        }
        return fillResults;
    }
}
