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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "../src/Exchange.sol";


// solhint-disable no-empty-blocks
contract TestExchangeInternals is
    Exchange
{
    event DispatchTransferFromCalled(
        bytes32 orderHash,
        bytes assetData,
        address from,
        address to,
        uint256 amount
    );

    constructor (uint256 chainId)
        public
        Exchange(chainId)
    {}

    function calculateFillResults(
        Order memory order,
        uint256 takerAssetFilledAmount
    )
        public
        pure
        returns (FillResults memory fillResults)
    {
        return _calculateFillResults(order, takerAssetFilledAmount);
    }

    /// @dev Call `_updateFilledState()` but first set `filled[order]` to
    ///      `orderTakerAssetFilledAmount`.
    function testUpdateFilledState(
        Order memory order,
        address takerAddress,
        bytes32 orderHash,
        uint256 orderTakerAssetFilledAmount,
        FillResults memory fillResults
    )
        public
    {
        filled[getOrderHash(order)] = orderTakerAssetFilledAmount;
        _updateFilledState(
            order,
            takerAddress,
            orderHash,
            orderTakerAssetFilledAmount,
            fillResults
        );
    }

    function settleOrder(
        bytes32 orderHash,
        LibOrder.Order memory order,
        address takerAddress,
        LibFillResults.FillResults memory fillResults
    )
        public
    {
        _settleOrder(orderHash, order, takerAddress, fillResults);
    }

    /// @dev Overidden to only log arguments so we can test `_settleOrder()`.
    function _dispatchTransferFrom(
        bytes32 orderHash,
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        emit DispatchTransferFromCalled(
            orderHash,
            assetData,
            from,
            to,
            amount
        );
    }
}
