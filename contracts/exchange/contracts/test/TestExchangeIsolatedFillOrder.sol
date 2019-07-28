/*

  Copyright 2019 ZeroEx Intl.

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

import "../src/Exchange.sol";


/// @dev A version of the Exchange contract where we override dependent
///      functions called by `_fillOrder()` to test what goes on inside of it.
contract TestExchangeIsolatedFillOrder is
    Exchange
{
    // solhint-disable no-unused-vars
    event UpdateFilledStateCalled(
        Order order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetAmount,
        FillResults fillResults
    );

    event SettleOrderCalled(
        bytes32 orderHash,
        LibOrder.Order order,
        address takerAddress,
        LibFillResults.FillResults fillResults
    );

    // solhint-disable no-empty-blocks
    constructor ()
        public
        Exchange(1337)
    {}

    /// @dev Allow setting of `filled` state for an order hash.
    function setOrderTakerAssetFilledAmount(
        bytes32 orderHash,
        uint256 takerAssetFilledAmount
    )
        external
    {
        filled[orderHash] = takerAssetFilledAmount;
    }

    /// @dev Override that just logs arguments.
    function _updateFilledState(
        Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        FillResults memory fillResults
    )
        internal
    {
        emit UpdateFilledStateCalled(
            order,
            takerAddress,
            orderHash,
            orderTakerAssetFilledAmount,
            fillResults
        );
    }

    /// @dev Override that just logs arguments.
    function _settleOrder(
        bytes32 orderHash,
        LibOrder.Order memory order,
        address takerAddress,
        LibFillResults.FillResults memory fillResults
    )
        internal
    {
        emit SettleOrderCalled(
            orderHash,
            order,
            takerAddress,
            fillResults
        );
    }

    /// @dev Override to log arguments and pass all empty signatures.
    function _isValidOrderWithHashSignature(
        Order memory order,
        bytes32 orderHash,
        address signerAddress,
        bytes memory signature
    )
        internal
        view
        returns (bool isValid)
    {
        // Pass if the signature is empty.
        return signature.length == 0;
    }
}
