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

import "../../../protocol/Exchange/interfaces/IExchange.sol";
import "../interfaces/IThresholdAsset.sol";


contract MBalanceThresholdFilterCore {

    // Points to 0x exchange contract
    IExchange internal EXCHANGE;

    // The asset that must be held by makers/takers
    IThresholdAsset internal THRESHOLD_ASSET;

    // The minimum balance of `THRESHOLD_ASSET` that must be held by makers/takers
    uint256 internal THRESHOLD_BALANCE;

    // Addresses that hold at least `THRESHOLD_BALANCE` of `THRESHOLD_ASSET`
    event ValidatedAddresses (
        address[] addresses
    );

    /// @dev Executes an Exchange transaction iff the maker and taker meet 
    ///      the hold at least `BALANCE_THRESHOLD` of the asset `THRESHOLD_ASSET` OR 
    ///      the exchange function is a cancellation.
    ///      Supported Exchange functions:
    ///         - batchFillOrdersNoThrow
    ///         - batchFillOrKillOrders
    ///         - fillOrder
    ///         - fillOrderNoThrow
    ///         - fillOrKillOrder
    ///         - marketBuyOrders
    ///         - marketBuyOrdersNoThrow
    ///         - marketSellOrders
    ///         - marketSellOrdersNoThrow
    ///         - matchOrders
    ///         - cancelOrder
    ///         - batchCancelOrders
    ///         - cancelOrdersUpTo
    ///     Trying to call any other exchange function will throw.
    /// @param salt Arbitrary number to ensure uniqueness of transaction hash.
    /// @param signerAddress Address of transaction signer.
    /// @param signedExchangeTransaction AbiV2 encoded calldata.
    /// @param signature Proof of signer transaction by signer.
    function executeTransaction(
        uint256 salt,
        address signerAddress,
        bytes signedExchangeTransaction,
        bytes signature
    ) 
        external;

    /// @dev Validates addresses meet the balance threshold specified by `BALANCE_THRESHOLD`
    ///      for the asset `THRESHOLD_ASSET`. If one address does not meet the thresold
    ///      then this function will revert. Which addresses are validated depends on
    ///      which Exchange function is to be called (defined by `signedExchangeTransaction` above).
    ///      No parameters are taken as this function reads arguments directly from calldata, to save gas.
    ///      If all addresses are valid then this function emits a ValidatedAddresses event, listing all
    ///      of the addresses whose balance thresholds it checked.
    function validateBalanceThresholdsOrRevert() internal;
}