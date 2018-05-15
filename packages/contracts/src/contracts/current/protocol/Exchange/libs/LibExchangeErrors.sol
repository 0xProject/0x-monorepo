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

contract LibExchangeErrors {

    // Core revert reasons
    string constant GT_ZERO_AMOUNT_REQUIRED = "Amount must be greater than 0.";
    string constant SIGNATURE_VALIDATION_FAILED = "Signature validation failed.";
    string constant INVALID_SENDER = "Invalid `msg.sender`.";
    string constant INVALID_CONTEXT = "Function called in an invalid context.";
    string constant INVALID_NEW_MAKER_EPOCH = "Specified salt must be greater than or equal to existing makerEpoch.";

    // Order revert reasons
    string constant INVALID_ORDER_TAKER_ASSET_AMOUNT = "Invalid order taker asset amount: expected a non-zero value.";
    string constant INVALID_ORDER_MAKER_ASSET_AMOUNT = "Invalid order maker asset amount: expected a non-zero value.";

    // Transaction revert reasons
    string constant DUPLICATE_TRANSACTION_HASH = "Transaction has already been executed.";
    string constant TRANSACTION_EXECUTION_FAILED = "Transaction execution failed.";

    // Wrapper revert reasons
    string constant COMPLETE_FILL_FAILED = "Desired fill amount could not be completely filled.";
    string constant ASSET_DATA_MISMATCH = "Asset data must be the same for each order.";

    // Asset proxy dispatcher revert reasons
    string constant GT_ZERO_LENGTH_REQUIRED = "Length must be greater than 0.";
    string constant OLD_ASSET_PROXY_MISMATCH = "Old asset proxy does not match asset proxy at given id.";
    string constant NEW_ASSET_PROXY_MISMATCH = "New asset proxy id does not match given id.";

    // Signature validator revert reasons
    string constant INVALID_SIGNATURE_LENGTH = "Invalid signature length.";
    string constant ILLEGAL_SIGNATURE_TYPE = "Illegal signature type.";
    string constant UNSUPPORTED_SIGNATURE_TYPE = "Unsupported signature type.";

    // Order matching revert reasons
    string constant ASSET_MISMATCH_MAKER_TAKER = "Left order maker asset is different from right order taker asset.";
    string constant ASSET_MISMATCH_TAKER_MAKER = "Left order taker asset is different from right order maker asset.";
    string constant NEGATIVE_SPREAD = "Matched orders must have a positive spread.";
    string constant MISCALCULATED_TRANSFER_AMOUNTS = "A miscalculation occurred: the left maker would receive more than the right maker would spend.";
    string constant ROUNDING_ERROR_TRANSFER_AMOUNTS = "A rounding error occurred when calculating transfer amounts for matched orders.";
    string constant FAILED_TO_CALCULATE_FILL_RESULTS_FOR_LEFT_ORDER = "Failed to calculate fill results for left order.";
    string constant FAILED_TO_CALCULATE_FILL_RESULTS_FOR_RIGHT_ORDER = "Failed to calculate fill results for right order.";
}
