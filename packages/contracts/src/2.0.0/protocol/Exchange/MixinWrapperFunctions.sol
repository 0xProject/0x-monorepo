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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "./libs/LibMath.sol";
import "./libs/LibOrder.sol";
import "./libs/LibFillResults.sol";
import "./libs/LibAbiEncoder.sol";
import "./mixins/MExchangeCore.sol";


contract MixinWrapperFunctions is
    LibMath,
    LibFillResults,
    LibAbiEncoder,
    MExchangeCore
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
        returns (FillResults memory fillResults)
    {
        fillResults = fillOrder(
            order,
            takerAssetFillAmount,
            signature
        );
        require(
            fillResults.takerAssetFilledAmount == takerAssetFillAmount,
            "COMPLETE_FILL_FAILED"
        );
        return fillResults;
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
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
        bytes memory fillOrderCalldata = abiEncodeFillOrder(
            order,
            takerAssetFillAmount,
            signature
        );

        // Delegate to `fillOrder` and handle any exceptions gracefully
        assembly {
            let success := delegatecall(
                gas,                                // forward all gas, TODO: look into gas consumption of assert/throw
                address,                            // call address of this contract
                add(fillOrderCalldata, 32),         // pointer to start of input (skip array length in first 32 bytes)
                mload(fillOrderCalldata),           // length of input
                fillOrderCalldata,                  // write output over input
                128                                 // output size is 128 bytes
            )
            switch success
            case 0 {
                mstore(fillResults, 0)
                mstore(add(fillResults, 32), 0)
                mstore(add(fillResults, 64), 0)
                mstore(add(fillResults, 96), 0)
            }
            case 1 {
                mstore(fillResults, mload(fillOrderCalldata))
                mstore(add(fillResults, 32), mload(add(fillOrderCalldata, 32)))
                mstore(add(fillResults, 64), mload(add(fillOrderCalldata, 64)))
                mstore(add(fillResults, 96), mload(add(fillOrderCalldata, 96)))
            }
        }
        return fillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    ///         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
    function batchFillOrders(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
            addFillResults(totalFillResults, singleFillResults);
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrKill.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    ///         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
    function batchFillOrKillOrders(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            FillResults memory singleFillResults = fillOrKillOrder(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
            addFillResults(totalFillResults, singleFillResults);
        }
        return totalFillResults;
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    ///         NOTE: makerAssetFilledAmount and takerAssetFilledAmount may include amounts filled of different assets.
    function batchFillOrdersNoThrow(
        LibOrder.Order[] memory orders,
        uint256[] memory takerAssetFillAmounts,
        bytes[] memory signatures
    )
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                takerAssetFillAmounts[i],
                signatures[i]
            );
            addFillResults(totalFillResults, singleFillResults);
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
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
        returns (FillResults memory totalFillResults)
    {
        bytes memory takerAssetData = orders[0].takerAssetData;
    
        for (uint256 i = 0; i < orders.length; i++) {

            // We assume that asset being sold by taker is the same for each order.
            // Rather than passing this in as calldata, we use the takerAssetData from the first order in all later orders.
            orders[i].takerAssetData = takerAssetData;

            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = safeSub(takerAssetFillAmount, totalFillResults.takerAssetFilledAmount);

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerAsset has been sold
            if (totalFillResults.takerAssetFilledAmount == takerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerAsset is sold by taker.
    ///      Returns false if the transaction would otherwise revert.
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
        returns (FillResults memory totalFillResults)
    {
        bytes memory takerAssetData = orders[0].takerAssetData;

        for (uint256 i = 0; i < orders.length; i++) {

            // We assume that asset being sold by taker is the same for each order.
            // Rather than passing this in as calldata, we use the takerAssetData from the first order in all later orders.
            orders[i].takerAssetData = takerAssetData;

            // Calculate the remaining amount of takerAsset to sell
            uint256 remainingTakerAssetFillAmount = safeSub(takerAssetFillAmount, totalFillResults.takerAssetFilledAmount);

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerAsset has been sold
            if (totalFillResults.takerAssetFilledAmount == takerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of makerAsset is bought by taker.
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
        returns (FillResults memory totalFillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;

        for (uint256 i = 0; i < orders.length; i++) {

            // We assume that asset being bought by taker is the same for each order.
            // Rather than passing this in as calldata, we copy the makerAssetData from the first order onto all later orders.
            orders[i].makerAssetData = makerAssetData;

            // Calculate the remaining amount of makerAsset to buy
            uint256 remainingMakerAssetFillAmount = safeSub(makerAssetFillAmount, totalFillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerAsset to buy into remaining amount
            // of takerAsset to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerAssetFillAmount = getPartialAmount(
                orders[i].takerAssetAmount,
                orders[i].makerAssetAmount,
                remainingMakerAssetFillAmount
            );

            // Attempt to sell the remaining amount of takerAsset
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerAssetFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been bought
            if (totalFillResults.makerAssetFilledAmount == makerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    ///      Returns false if the transaction would otherwise revert.
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
        returns (FillResults memory totalFillResults)
    {
        bytes memory makerAssetData = orders[0].makerAssetData;

        for (uint256 i = 0; i < orders.length; i++) {

            // We assume that asset being bought by taker is the same for each order.
            // Rather than passing this in as calldata, we copy the makerAssetData from the first order onto all later orders.
            orders[i].makerAssetData = makerAssetData;

            // Calculate the remaining amount of makerAsset to buy
            uint256 remainingMakerAssetFillAmount = safeSub(makerAssetFillAmount, totalFillResults.makerAssetFilledAmount);

            // Convert the remaining amount of makerAsset to buy into remaining amount
            // of takerAsset to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerAssetFillAmount = getPartialAmount(
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
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerAsset has been bought
            if (totalFillResults.makerAssetFilledAmount == makerAssetFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orders Array of order specifications.
    function batchCancelOrders(LibOrder.Order[] memory orders)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(orders[i]);
        }
    }

    /// @dev Fetches information for all passed in orders.
    /// @param orders Array of order specifications.
    /// @return Array of OrderInfo instances that correspond to each order.
    function getOrdersInfo(LibOrder.Order[] memory orders)
        public
        view
        returns (LibOrder.OrderInfo[] memory)
    {
        uint256 length = orders.length;
        LibOrder.OrderInfo[] memory ordersInfo = new LibOrder.OrderInfo[](length);
        for (uint256 i = 0; i < length; i++) {
            ordersInfo[i] = getOrderInfo(orders[i]);
        }
        return ordersInfo;
    }
}
