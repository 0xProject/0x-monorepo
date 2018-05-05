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

import "../lib/LibOrder.sol";
import "../lib/LibFillResults.sol";
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

    /// @dev Logs a Fill event with the given arguments.
    ///      The sole purpose of this function is to get around the stack variable limit.
    function emitFillEvent(
        LibOrder.Order memory order,
        address takerAddress,
        bytes32 orderHash,
        LibFillResults.FillResults memory fillResults)
        internal;
}
