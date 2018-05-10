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

contract LibStatus {

    // Exchange Status Codes
    enum Status {
        /// Default Status ///
        INVALID,                                // General invalid status

        /// General Exchange Statuses ///
        SUCCESS,                                // Indicates a successful operation
        ROUNDING_ERROR_TOO_LARGE,               // Rounding error too large
        INSUFFICIENT_BALANCE_OR_ALLOWANCE,      // Insufficient balance or allowance for token transfer
        TAKER_ASSET_FILL_AMOUNT_TOO_LOW,        // takerAssetFillAmount is <= 0
        INVALID_SIGNATURE,                      // Invalid signature
        INVALID_SENDER,                         // Invalid sender
        INVALID_TAKER,                          // Invalid taker
        INVALID_MAKER,                          // Invalid maker

        /// Order State Statuses ///
        ORDER_INVALID_MAKER_ASSET_AMOUNT,       // Order does not have a valid maker asset amount
        ORDER_INVALID_TAKER_ASSET_AMOUNT,       // Order does not have a valid taker asset amount
        ORDER_FILLABLE,                         // Order is fillable
        ORDER_EXPIRED,                          // Order has already expired
        ORDER_FULLY_FILLED,                     // Order is fully filled
        ORDER_CANCELLED                         // Order has been cancelled
    }

    event ExchangeStatus(uint8 indexed statusId, bytes32 indexed orderHash);
}
