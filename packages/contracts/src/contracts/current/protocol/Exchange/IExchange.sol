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

contract IExchange {

    // Error Codes
    enum Errors {
        ORDER_EXPIRED,                    // Order has already expired
        ORDER_FULLY_FILLED_OR_CANCELLED,  // Order has already been fully filled or cancelled
        ROUNDING_ERROR_TOO_LARGE,         // Rounding error too large
        INSUFFICIENT_BALANCE_OR_ALLOWANCE // Insufficient balance or allowance for token transfer
    }

    event LogError(uint8 indexed errorId, bytes32 indexed orderHash);

    event LogFill(
        address indexed maker,
        address taker,
        address indexed feeRecipient,
        bytes makerAssetData,
        bytes takerAssetData,
        uint256 makerAssetFilledAmount,
        uint256 takerAssetFilledAmount,
        uint256 makerFeePaid,
        uint256 takerFeePaid,
        bytes32 indexed orderHash
    );

    event LogCancel(
        address indexed maker,
        address indexed feeRecipient,
        bytes makerAssetData,
        bytes takerAssetData,
        uint256 makerAssetCancelledAmount,
        uint256 takerAssetCancelledAmount,
        bytes32 indexed orderHash
    );

    function ZRX_TOKEN_CONTRACT()
      public view
      returns (address);

    function EXTERNAL_QUERY_GAS_LIMIT()
      public view
      returns (uint16);

    function VERSION()
      public view
      returns (string);

    function filled(bytes32)
      public view
      returns (uint256);

    function cancelled(bytes32)
      public view
      returns (uint256);

    /// @dev Calculates the sum of values already filled and cancelled for a given order.
    /// @param orderHash The Keccak-256 hash of the given order.
    /// @return Sum of values already filled and cancelled.
    function getUnavailableTakerAssetAmount(bytes32 orderHash)
        public view
        returns (uint256 unavailableTakerAssetAmount);

    /// @dev Calculates partial value given a numerator and denominator.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to calculate partial of.
    /// @return Partial value of target.
    function getPartialAmount(uint256 numerator, uint256 denominator, uint256 target)
        public pure
        returns (uint256 partialAmount);

    /// @dev Checks if rounding error > 0.1%.
    /// @param numerator Numerator.
    /// @param denominator Denominator.
    /// @param target Value to multiply with numerator/denominator.
    /// @return Rounding error is present.
    function isRoundingError(uint256 numerator, uint256 denominator, uint256 target)
        public pure
        returns (bool isError);

    /// @dev Calculates Keccak-256 hash of order with specified parameters.
    /// @param orderAddresses Array of order's maker, taker, makerAsset, takerAsset, and feeRecipient.
    /// @param orderValues Array of order's makerAssetAmount, takerAssetAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @return Keccak-256 hash of order.
    function getOrderHash(address[5] orderAddresses, uint256[6] orderValues)
        public view
        returns (bytes32 orderHash);

    /// @dev Verifies that an order signature is valid.
    /// @param signer address of signer.
    /// @param hash Signed Keccak-256 hash.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Validity of order signature.
    function isValidSignature(
        address signer,
        bytes32 hash,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public pure
        returns (bool isValid);

    /// @dev Fills the input order.
    /// @param orderAddresses Array of order's maker, taker, makerAsset, takerAsset, and feeRecipient.
    /// @param orderValues Array of order's makerAssetAmount, takerAssetAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerAssetFillAmount Desired amount of takerAsset to fill.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Total amount of takerAsset filled in trade.
    function fillOrder(
          address[5] orderAddresses,
          uint256[6] orderValues,
          uint256 takerAssetFillAmount,
          uint8 v,
          bytes32 r,
          bytes32 s)
          public
          returns (uint256 takerAssetFilledAmount);

    /// @dev Cancels the input order.
    /// @param orderAddresses Array of order's maker, taker, makerAsset, takerAsset, and feeRecipient.
    /// @param orderValues Array of order's makerAssetAmount, takerAssetAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerAssetCancelAmount Desired amount of takerAsset to cancel in order.
    /// @return Amount of takerAsset cancelled.
    function cancelOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerAssetCancelAmount)
        public
        returns (uint256 takerAssetCancelledAmount);

    /// @dev Cancels all orders for a specified maker up to a certain time.
    /// @param salt Orders created with a salt less or equal to this value will be cancelled.
    function cancelOrdersUpTo(uint256 salt)
        external;

    /// @dev Fills an order with specified parameters and ECDSA signature. Throws if specified amount not filled entirely.
    /// @param orderAddresses Array of order's maker, taker, makerAsset, takerAsset, and feeRecipient.
    /// @param orderValues Array of order's makerAssetAmount, takerAssetAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerAssetFillAmount Desired amount of takerAsset to fill.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    function fillOrKillOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerAssetFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public;

    /// @dev Fills an order with specified parameters and ECDSA signature. Returns false if the transaction would otherwise revert.
    /// @param orderAddresses Array of order's maker, taker, makerAsset, takerAsset, and feeRecipient.
    /// @param orderValues Array of order's makerAssetAmount, takerAssetAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
    /// @param takerAssetFillAmount Desired amount of takerAsset to fill.
    /// @param v ECDSA signature parameter v.
    /// @param r ECDSA signature parameters r.
    /// @param s ECDSA signature parameters s.
    /// @return Success if the transaction did not revert.
    /// @return Total amount of takerAsset filled in trade.
    function fillOrderNoThrow(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerAssetFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
        returns (bool success, uint256 takerAssetFilledAmount);

    /// @dev Synchronously executes multiple calls of fillOrder in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerAssetFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        external;

    /// @dev Synchronously executes multiple calls of fillOrKill in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrKillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerAssetFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        external;

    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetFillAmounts Array of desired amounts of takerAsset to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    function batchFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerAssetFillAmounts,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        external;

    /// @dev Synchronously executes multiple fill orders in a single transaction until total takerAssetFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetFillAmount Desired total amount of takerAsset to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    /// @return Total amount of takerAssetFillAmount filled in orders.
    function marketFillOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerAssetFillAmount,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        external
        returns (uint256 totalTakerAssetFilledAmount);

    /// @dev Synchronously executes multiple calls of fillOrderNoThrow in a single transaction until total takerAssetFillAmount filled.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetFillAmount Desired total amount of takerAsset to fill in orders.
    /// @param v Array ECDSA signature v parameters.
    /// @param r Array of ECDSA signature r parameters.
    /// @param s Array of ECDSA signature s parameters.
    /// @return Total amount of takerAssetFillAmount filled in orders.
    function marketFillOrdersNoThrow(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256 takerAssetFillAmount,
        uint8[] v,
        bytes32[] r,
        bytes32[] s)
        external
        returns (uint256 totalTakerAssetFilledAmount);

    /// @dev Synchronously cancels multiple orders in a single transaction.
    /// @param orderAddresses Array of address arrays containing individual order addresses.
    /// @param orderValues Array of uint256 arrays containing individual order values.
    /// @param takerAssetCancelAmounts Array of desired amounts of takerAsset to cancel in orders.
    function batchCancelOrders(
        address[5][] orderAddresses,
        uint256[6][] orderValues,
        uint256[] takerAssetCancelAmounts)
        external;
}
