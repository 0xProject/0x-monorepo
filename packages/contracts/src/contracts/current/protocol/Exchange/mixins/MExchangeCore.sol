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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../libs/LibOrder.sol";
import "../libs/LibFillResults.sol";
import "../interfaces/IExchangeCore.sol";

contract MExchangeCore is
    IExchangeCore
{
    // Fill event is emitted whenever an order is filled.
    event Fill(
        address indexed makerAddress,
        address takerAddress,
        address indexed feeRecipientAddress,
        uint256 makerAssetFilledAmount,
        uint256 takerAssetFilledAmount,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash,
        bytes makerAssetData,
        bytes takerAssetData
    );

    // Cancel event is emitted whenever an individual order is cancelled.
    event Cancel(
        address indexed makerAddress,
        address indexed feeRecipientAddress,
        bytes32 indexed orderHash,
        bytes makerAssetData,
        bytes takerAssetData
    );

    // CancelUpTo event is emitted whenever `cancelOrdersUpTo` is executed succesfully.
    event CancelUpTo(
        address indexed makerAddress,
        uint256 makerEpoch
    );

    /// @dev Updates state with results of a fill order.
    /// @param order that was filled.
    /// @param takerAddress Address of taker who filled the order.
    /// @param orderTakerAssetFilledAmount Amount of order already filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function updateFilledState(
        LibOrder.Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        LibFillResults.FillResults memory fillResults
    )
        internal;

    /// @dev Updates state with results of cancelling an order.
    ///      State is only updated if the order is currently fillable.
    ///      Otherwise, updating state would have no effect.
    /// @param order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    function updateCancelledState(
        LibOrder.Order memory order,
        bytes32 orderHash
    )
        internal;

    /// @dev Validates context for fillOrder. Succeeds or throws.
    /// @param order to be filled.
    /// @param orderInfo Status, orderHash, and amount already filled of order.
    /// @param takerAddress Address of order taker.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @param takerAssetFilledAmount Amount of takerAsset that will be filled.
    /// @param signature Proof that the orders was created by its maker.
    function assertValidFill(
        LibOrder.Order memory order,
        LibOrder.OrderInfo memory orderInfo,
        address takerAddress,
        uint256 takerAssetFillAmount,
        uint256 takerAssetFilledAmount,
        bytes memory signature
    )
        internal
        view;


    /// @dev Validates context for cancelOrder. Succeeds or throws.
    /// @param order to be cancelled.
    /// @param orderInfo OrderStatus, orderHash, and amount already filled of order.
    function assertValidCancel(
        LibOrder.Order memory order,
        LibOrder.OrderInfo memory orderInfo
    )
        internal
        view;

    /// @dev Calculates amounts filled and fees paid by maker and taker.
    /// @param order to be filled.
    /// @param takerAssetFilledAmount Amount of takerAsset that will be filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function calculateFillResults(
        LibOrder.Order memory order,
        uint256 takerAssetFilledAmount
    )
        internal
        pure
        returns (LibFillResults.FillResults memory fillResults);
}
