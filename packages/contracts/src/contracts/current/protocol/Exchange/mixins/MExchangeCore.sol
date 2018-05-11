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

pragma solidity ^0.4.23;
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

    /// @dev Cancels all orders reated by sender with a salt less than or equal to the specified salt value.
    /// @param salt Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 salt)
        external;

    /// @dev Gets information about an order: status, hash, and amount filled.
    /// @param order Order to gather information on.
    /// @return status Status of order. Statuses are defined in the LibStatus.Status struct.
    /// @return orderHash Keccak-256 EIP712 hash of the order.
    /// @return takerAssetFilledAmount Amount of order that has been filled.
    function getOrderInfo(LibOrder.Order memory order)
        public
        view
        returns (
            uint8 orderStatus,
            bytes32 orderHash,
            uint256 takerAssetFilledAmount
        );

    /// @dev Validates context for fillOrder. Succeeds or throws.
    /// @param order to be filled.
    /// @param orderStatus Status of order to be filled.
    /// @param orderHash Hash of order to be filled.
    /// @param takerAddress Address of order taker.
    /// @param takerAssetFilledAmount Amount of order already filled.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @param signature Proof that the orders was created by its maker.
    function validateFillOrRevert(
        LibOrder.Order memory order,
        uint8 orderStatus,
        bytes32 orderHash,
        address takerAddress,
        uint256 takerAssetFilledAmount,
        uint256 takerAssetFillAmount,
        bytes memory signature)
        internal;

    /// @dev Calculates amounts filled and fees paid by maker and taker.
    /// @param order to be filled.
    /// @param orderStatus Status of order to be filled.
    /// @param takerAssetFilledAmount Amount of order already filled.
    /// @param takerAssetFillAmount Desired amount of order to fill by taker.
    /// @return status Return status of calculating fill amounts. Returns Status.SUCCESS on success.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function calculateFillResults(
        LibOrder.Order memory order,
        uint8 orderStatus,
        uint256 takerAssetFilledAmount,
        uint256 takerAssetFillAmount)
        public
        pure
        returns (
            uint8 status,
            LibFillResults.FillResults memory fillResults
        );

    /// @dev Updates state with results of a fill order.
    /// @param order that was filled.
    /// @param takerAddress Address of taker who filled the order.
    /// @param takerAssetFilledAmount Amount of order already filled.
    /// @return fillResults Amounts filled and fees paid by maker and taker.
    function updateFilledState(
        LibOrder.Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 takerAssetFilledAmount,
        LibFillResults.FillResults memory fillResults)
        internal;

    /// @dev Fills the input order.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerToken to sell.
    /// @param signature Proof that order has been created by maker.
    /// @return Amounts filled and fees paid by maker and taker.
    function fillOrder(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature)
        public
        returns (LibFillResults.FillResults memory fillResults);

    /// @dev Validates context for cancelOrder. Succeeds or throws.
    /// @param order that was cancelled.
    /// @param orderStatus Status of order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    function validateCancelOrRevert(
        LibOrder.Order memory order,
        uint8 orderStatus,
        bytes32 orderHash)
        internal;

    /// @dev Updates state with results of cancelling an order.
    ///      State is only updated if the order is currently fillable.
    ///      Otherwise, updating state would have no effect.
    /// @param order that was cancelled.
    /// @param orderStatus Status of order that was cancelled.
    /// @param orderHash Hash of order that was cancelled.
    /// @return stateUpdated Returns true only if state was updated.
    function updateCancelledState(
        LibOrder.Order memory order,
        uint8 orderStatus,
        bytes32 orderHash)
        internal
        returns (bool stateUpdated);

    /// @dev After calling, the order can not be filled anymore.
    ///      Throws if order is invalid or sender does not have permission to cancel.
    /// @param order Order to cancel. Order must be Status.FILLABLE.
    /// @return True if the order state changed to cancelled.
    ///         False if the order was order was in a valid, but
    ///               unfillable state (see LibStatus.STATUS for order states)
    function cancelOrder(LibOrder.Order memory order)
        public
        returns (bool);
}
