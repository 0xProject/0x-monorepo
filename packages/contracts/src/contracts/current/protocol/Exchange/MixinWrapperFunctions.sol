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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./mixins/MExchangeCore.sol";
import "./LibPartialAmount.sol";
import "../../utils/SafeMath/SafeMath.sol";

/// @dev Consumes MExchangeCore
contract MixinWrapperFunctions is
    MExchangeCore,
    SafeMath,
    LibPartialAmount
{
    /// @dev Fills the input order. Reverts if exact takerTokenFillAmount not filled.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    function fillOrKillOrder(
        Order memory order,
        uint256 takerTokenFillAmount,
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        fillResults = fillOrder(
            order,
            takerTokenFillAmount,
            signature
        );
        require(fillResults.takerTokenFilledAmount == takerTokenFillAmount);
        return fillResults;
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param order Order struct containing order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrderNoThrow(
        Order memory order,
        uint256 takerTokenFillAmount,
        bytes memory signature)
        public
        returns (FillResults memory fillResults)
    {
        // We need to call MExchangeCore.fillOrder using a delegatecall in
        // assembly so that we can intercept a call that throws. For this, we
        // need the input encoded in memory in the Ethereum ABIv2 format [1].

        // | Area     | Offset | Length  | Contents                                    |
        // | -------- |--------|---------|-------------------------------------------- |
        // | Header   | 0x00   | 4       | function selector                           |
        // | Params   |        | 3 * 32  | function parameters:                        |
        // |          | 0x00   |         |   1. offset to order (*)                    |
        // |          | 0x20   |         |   2. takerTokenFillAmount                   |
        // |          | 0x40   |         |   3. offset to signature (*)                |
        // | Data     |        | 13 * 32 | order:                                      |
        // |          | 0x000  |         |   1.  makerAddress                          |
        // |          | 0x020  |         |   2.  takerAddress                          |
        // |          | 0x040  |         |   3.  makerTokenAddress                     |
        // |          | 0x060  |         |   4.  takerTokenAddress                     |
        // |          | 0x080  |         |   5.  feeRecipientAddress                   |
        // |          | 0x0A0  |         |   6.  makerTokenAmount                      |
        // |          | 0x0C0  |         |   7.  takerTokenAmount                      |
        // |          | 0x0E0  |         |   8.  makerFeeAmount                        |
        // |          | 0x100  |         |   9.  takerFeeAmount                        |
        // |          | 0x120  |         |   10. expirationTimeSeconds                 |
        // |          | 0x140  |         |   11. salt                                  |
        // |          | 0x160  |         |   12. Offset to makerAssetProxyMetadata (*) |
        // |          | 0x180  |         |   13. Offset to takerAssetProxyMetadata (*) |
        // |          | 0x1A0  | 32      | makerAssetProxyMetadata Length              |
        // |          | 0x1C0  | **      | makerAssetProxyMetadata Contents            |
        // |          | 0x1E0  | 32      | takerAssetProxyMetadata Length              |
        // |          | 0x200  | **      | takerAssetProxyMetadata Contents            |
        // |          | 0x220  | 32      | signature Length                            |
        // |          | 0x240  | **      | signature Contents                          |

        // * Offsets are calculated from the beginning of the current area: Header, Params, Data:
        //     An offset stored in the Params area is calculated from the beginning of the Params section.
        //     An offset stored in the Data area is calculated from the beginning of the Data section.

        // ** The length of dynamic array contents are stored in the field immediately preceeding the contents.

        // [1]: https://solidity.readthedocs.io/en/develop/abi-spec.html

        bytes4 fillOrderSelector = this.fillOrder.selector;

        assembly {

            // Areas below may use the following variables:
            //   1. <area>Start   -- Start of this area in memory
            //   2. <area>End     -- End of this area in memory. This value may
            //                       be precomputed (before writing contents),
            //                       or it may be computed as contents are written.
            //   3. <area>Offset  -- Current offset into area. If an area's End
            //                       is precomputed, this variable tracks the
            //                       offsets of contents as they are written.

            /////// Setup Header Area ///////
            // Load free memory pointer
            let headerAreaStart := mload(0x40)
            mstore(headerAreaStart, fillOrderSelector)
            let headerAreaEnd := add(headerAreaStart, 0x4)

            /////// Setup Params Area ///////
            // This area is preallocated and written to later.
            // This is because we need to fill in offsets that have not yet been calculated.
            let paramsAreaStart := headerAreaEnd
            let paramsAreaEnd := add(paramsAreaStart, 0x60)
            let paramsAreaOffset := paramsAreaStart

            /////// Setup Data Area ///////
            let dataAreaStart := paramsAreaEnd
            let dataAreaEnd := dataAreaStart

            // Offset from the source data we're reading from
            let sourceOffset := order
            // arrayLenBytes and arrayLenWords track the length of a dynamically-allocated bytes array.
            let arrayLenBytes := 0
            let arrayLenWords := 0

            /////// Write order Struct ///////
            // Write memory location of Order, relative to the start of the
            // parameter list, then increment the paramsAreaOffset respectively.
            mstore(paramsAreaOffset, sub(dataAreaEnd, paramsAreaStart))
            paramsAreaOffset := add(paramsAreaOffset, 0x20)

            // Write values for each field in the order
            // It would be nice to use a loop, but we save on gas by writing
            // the stores sequentially.
            mstore(dataAreaEnd, mload(sourceOffset))                            // makerAddress
            mstore(add(dataAreaEnd, 0x20), mload(add(sourceOffset, 0x20)))      // takerAddress
            mstore(add(dataAreaEnd, 0x40), mload(add(sourceOffset, 0x40)))      // makerTokenAddress
            mstore(add(dataAreaEnd, 0x60), mload(add(sourceOffset, 0x60)))      // takerTokenAddress
            mstore(add(dataAreaEnd, 0x80), mload(add(sourceOffset, 0x80)))      // feeRecipientAddress
            mstore(add(dataAreaEnd, 0xA0), mload(add(sourceOffset, 0xA0)))      // makerTokenAmount
            mstore(add(dataAreaEnd, 0xC0), mload(add(sourceOffset, 0xC0)))      // takerTokenAmount
            mstore(add(dataAreaEnd, 0xE0), mload(add(sourceOffset, 0xE0)))      // makerFeeAmount
            mstore(add(dataAreaEnd, 0x100), mload(add(sourceOffset, 0x100)))    // takerFeeAmount
            mstore(add(dataAreaEnd, 0x120), mload(add(sourceOffset, 0x120)))    // expirationTimeSeconds
            mstore(add(dataAreaEnd, 0x140), mload(add(sourceOffset, 0x140)))    // salt
            mstore(add(dataAreaEnd, 0x160), mload(add(sourceOffset, 0x160)))    // Offset to makerAssetProxyMetadata
            mstore(add(dataAreaEnd, 0x180), mload(add(sourceOffset, 0x180)))    // Offset to takerAssetProxyMetadata
            dataAreaEnd := add(dataAreaEnd, 0x1A0)
            sourceOffset := add(sourceOffset, 0x1A0)

            // Write offset to <order.makerAssetProxyMetadata>
            mstore(add(dataAreaStart, mul(11, 0x20)), sub(dataAreaEnd, dataAreaStart))

            // Calculate length of <order.makerAssetProxyMetadata>
            arrayLenBytes := mload(sourceOffset)
            sourceOffset := add(sourceOffset, 0x20)
            arrayLenWords := div(add(arrayLenBytes, 0x1F), 0x20)

            // Write length of <order.makerAssetProxyMetadata>
            mstore(dataAreaEnd, arrayLenBytes)
            dataAreaEnd := add(dataAreaEnd, 0x20)

            // Write contents of <order.makerAssetProxyMetadata>
            for {let i := 0} lt(i, arrayLenWords) {i := add(i, 1)} {
                mstore(dataAreaEnd, mload(sourceOffset))
                dataAreaEnd := add(dataAreaEnd, 0x20)
                sourceOffset := add(sourceOffset, 0x20)
            }

            // Write offset to <order.takerAssetProxyMetadata>
            mstore(add(dataAreaStart, mul(12, 0x20)), sub(dataAreaEnd, dataAreaStart))

            // Calculate length of <order.takerAssetProxyMetadata>
            arrayLenBytes := mload(sourceOffset)
            sourceOffset := add(sourceOffset, 0x20)
            arrayLenWords := div(add(arrayLenBytes, 0x1F), 0x20)

            // Write length of <order.takerAssetProxyMetadata>
            mstore(dataAreaEnd, arrayLenBytes)
            dataAreaEnd := add(dataAreaEnd, 0x20)

            // Write contents of  <order.takerAssetProxyMetadata>
            for {let i := 0} lt(i, arrayLenWords) {i := add(i, 1)} {
                mstore(dataAreaEnd, mload(sourceOffset))
                dataAreaEnd := add(dataAreaEnd, 0x20)
                sourceOffset := add(sourceOffset, 0x20)
            }

            /////// Write takerTokenFillAmount ///////
            mstore(paramsAreaOffset, takerTokenFillAmount)
            paramsAreaOffset := add(paramsAreaOffset, 0x20)

            /////// Write signature ///////
            // Write offset to paramsArea
            mstore(paramsAreaOffset, sub(dataAreaEnd, paramsAreaStart))

            // Calculate length of signature
            sourceOffset := signature
            arrayLenBytes := mload(sourceOffset)
            sourceOffset := add(sourceOffset, 0x20)
            arrayLenWords := div(add(arrayLenBytes, 0x1F), 0x20)

            // Write length of signature
            mstore(dataAreaEnd, arrayLenBytes)
            dataAreaEnd := add(dataAreaEnd, 0x20)

            // Write contents of signature
            for {let i := 0} lt(i, arrayLenWords) {i := add(i, 1)} {
                mstore(dataAreaEnd, mload(sourceOffset))
                dataAreaEnd := add(dataAreaEnd, 0x20)
                sourceOffset := add(sourceOffset, 0x20)
            }

            // Execute delegatecall
            let success := delegatecall(
                gas,                                // forward all gas, TODO: look into gas consumption of assert/throw
                address,                            // call address of this contract
                headerAreaStart,                    // pointer to start of input
                sub(dataAreaEnd, headerAreaStart),  // length of input
                headerAreaStart,                    // write output over input
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
                mstore(fillResults, mload(headerAreaStart))
                mstore(add(fillResults, 32), mload(add(headerAreaStart, 32)))
                mstore(add(fillResults, 64), mload(add(headerAreaStart, 64)))
                mstore(add(fillResults, 96), mload(add(headerAreaStart, 96)))
            }
        }
        return fillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrders(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrder(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrKill.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrKillOrders(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrKillOrder(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Fills an order with specified parameters and ECDSA signature.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmounts Array of desired amounts of takerToken to sell in orders.
    /// @param signatures Proofs that orders have been created by makers.
    function batchFillOrdersNoThrow(
        Order[] memory orders,
        uint256[] memory takerTokenFillAmounts,
        bytes[] memory signatures)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            fillOrderNoThrow(
                orders[i],
                takerTokenFillAmounts[i],
                signatures[i]
            );
        }
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerToken is sold by taker.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signatures Proofs that orders have been created by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrders(
        Order[] memory orders,
        uint256 takerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being sold by taker must be the same for each order
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);

            // Calculate the remaining amount of takerToken to sell
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, totalFillResults.takerTokenFilledAmount);

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerToken has been sold
            if (totalFillResults.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of takerToken is sold by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param takerTokenFillAmount Desired amount of takerToken to sell.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketSellOrdersNoThrow(
        Order[] memory orders,
        uint256 takerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being sold by taker must be the same for each order
            require(orders[i].takerTokenAddress == orders[0].takerTokenAddress);

            // Calculate the remaining amount of takerToken to sell
            uint256 remainingTakerTokenFillAmount = safeSub(takerTokenFillAmount, totalFillResults.takerTokenFilledAmount);

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of takerToken has been sold
            if (totalFillResults.takerTokenFilledAmount == takerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple calls of fillOrder until total amount of makerToken is bought by taker.
    /// @param orders Array of order specifications.
    /// @param makerTokenFillAmount Desired amount of makerToken to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrders(
        Order[] memory orders,
        uint256 makerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being bought by taker must be the same for each order
            require(orders[i].makerTokenAddress == orders[0].makerTokenAddress);

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(makerTokenFillAmount, totalFillResults.makerTokenFilledAmount);

            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingMakerTokenFillAmount
            );

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrder(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously executes multiple fill orders in a single transaction until total amount is bought by taker.
    ///      Returns false if the transaction would otherwise revert.
    /// @param orders Array of order specifications.
    /// @param makerTokenFillAmount Desired amount of makerToken to buy.
    /// @param signatures Proofs that orders have been signed by makers.
    /// @return Amounts filled and fees paid by makers and taker.
    function marketBuyOrdersNoThrow(
        Order[] memory orders,
        uint256 makerTokenFillAmount,
        bytes[] memory signatures)
        public
        returns (FillResults memory totalFillResults)
    {
        for (uint256 i = 0; i < orders.length; i++) {

            // Token being bought by taker must be the same for each order
            require(orders[i].makerTokenAddress == orders[0].makerTokenAddress);

            // Calculate the remaining amount of makerToken to buy
            uint256 remainingMakerTokenFillAmount = safeSub(makerTokenFillAmount, totalFillResults.makerTokenFilledAmount);

            // Convert the remaining amount of makerToken to buy into remaining amount
            // of takerToken to sell, assuming entire amount can be sold in the current order
            uint256 remainingTakerTokenFillAmount = getPartialAmount(
                orders[i].takerTokenAmount,
                orders[i].makerTokenAmount,
                remainingMakerTokenFillAmount
            );

            // Attempt to sell the remaining amount of takerToken
            FillResults memory singleFillResults = fillOrderNoThrow(
                orders[i],
                remainingTakerTokenFillAmount,
                signatures[i]
            );

            // Update amounts filled and fees paid by maker and taker
            addFillResults(totalFillResults, singleFillResults);

            // Stop execution if the entire amount of makerToken has been bought
            if (totalFillResults.makerTokenFilledAmount == makerTokenFillAmount) {
                break;
            }
        }
        return totalFillResults;
    }

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orders Array of order specifications.
    function batchCancelOrders(Order[] memory orders)
        public
    {
        for (uint256 i = 0; i < orders.length; i++) {
            cancelOrder(orders[i]);
        }
    }

    /// @dev Adds properties of both FillResults instances.
    ///      Modifies the first FillResults instance specified.
    /// @param totalFillResults Fill results instance that will be added onto.
    /// @param singleFillResults Fill results instance that will be added to totalFillResults.
    function addFillResults(FillResults memory totalFillResults, FillResults memory singleFillResults)
        internal
        pure
    {
        totalFillResults.makerTokenFilledAmount = safeAdd(totalFillResults.makerTokenFilledAmount, singleFillResults.makerTokenFilledAmount);
        totalFillResults.takerTokenFilledAmount = safeAdd(totalFillResults.takerTokenFilledAmount, singleFillResults.takerTokenFilledAmount);
        totalFillResults.makerFeePaid = safeAdd(totalFillResults.makerFeePaid, singleFillResults.makerFeePaid);
        totalFillResults.takerFeePaid = safeAdd(totalFillResults.takerFeePaid, singleFillResults.takerFeePaid);
    }

}
