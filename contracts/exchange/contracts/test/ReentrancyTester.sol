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

import "@0x/contracts-utils/contracts/src/LibReentrancyGuardRichErrors.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "../src/Exchange.sol";


/// @dev A version of the Exchange that exposes a `testReentrancyGuard()`
/// function which is used to test whether a function is protected by the
/// `nonReentrant` modifier. Several internal functions have also been
/// overridden to simplify constructing valid calls to external functions.
contract ReentrancyTester is
    Exchange
{
    using LibBytes for bytes;

    // solhint-disable no-empty-blocks
    // solhint-disable no-unused-vars
    constructor ()
        public
        // Initialize the exchange with a fixed chainId ("test" in hex).
        Exchange(0x74657374)
    {}

    /// @dev Calls a public function to check if it is reentrant.
    /// Because this function uses the `nonReentrant` modifier, if
    /// the function being called is also guarded by the `nonReentrant` modifier,
    /// it will revert when it returns.
    function isReentrant(bytes calldata fnCallData)
        external
        nonReentrant
        returns (bool allowsReentrancy)
    {
        (bool didSucceed, bytes memory resultData) = address(this).delegatecall(fnCallData);
        if (didSucceed) {
            allowsReentrancy = true;
        } else {
            if (resultData.equals(LibReentrancyGuardRichErrors.IllegalReentrancyError())) {
                allowsReentrancy = false;
            } else {
                allowsReentrancy = true;
            }
        }
    }

    /// @dev Overridden to revert on unsuccessful fillOrder call.
    function _fillOrderNoThrow(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        // ABI encode calldata for `fillOrder`
        bytes memory fillOrderCalldata = abi.encodeWithSelector(
            IExchangeCore(address(0)).fillOrder.selector,
            order,
            takerAssetFillAmount,
            signature
        );

        (bool didSucceed, bytes memory returnData) = address(this).delegatecall(fillOrderCalldata);
        if (didSucceed) {
            assert(returnData.length == 128);
            fillResults = abi.decode(returnData, (LibFillResults.FillResults));
            return fillResults;
        }
        // Revert and rethrow error if unsuccessful
        assembly {
            revert(add(returnData, 32), mload(returnData))
        }
    }

    /// @dev Overridden to always succeed.
    function _fillOrder(
        LibOrder.Order memory order,
        uint256,
        bytes memory
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        fillResults.makerAssetFilledAmount = order.makerAssetAmount;
        fillResults.takerAssetFilledAmount = order.takerAssetAmount;
        fillResults.makerFeePaid = order.makerFee;
        fillResults.takerFeePaid = order.takerFee;
    }

    /// @dev Overridden to always succeed.
    function _fillOrKillOrder(
        LibOrder.Order memory order,
        uint256,
        bytes memory
    )
        internal
        returns (LibFillResults.FillResults memory fillResults)
    {
        fillResults.makerAssetFilledAmount = order.makerAssetAmount;
        fillResults.takerAssetFilledAmount = order.takerAssetAmount;
        fillResults.makerFeePaid = order.makerFee;
        fillResults.takerFeePaid = order.takerFee;
    }

    /// @dev Overridden to always succeed.
    function _executeTransaction(
        LibZeroExTransaction.ZeroExTransaction memory,
        bytes memory
    )
        internal
        returns (bytes memory resultData)
    {
        // Should already point to an empty array.
        return resultData;
    }

    /// @dev Overridden to always succeed.
    function _batchMatchOrders(
        LibOrder.Order[] memory leftOrders,
        LibOrder.Order[] memory rightOrders,
        bytes[] memory,
        bytes[] memory,
        bool
    )
        internal
        returns (LibFillResults.BatchMatchedFillResults memory batchMatchedFillResults)
    {
        uint256 numOrders = leftOrders.length;
        batchMatchedFillResults.left = new LibFillResults.FillResults[](numOrders);
        batchMatchedFillResults.right = new LibFillResults.FillResults[](numOrders);
        for (uint256 i = 0; i < numOrders; ++i) {
            batchMatchedFillResults.left[i] = LibFillResults.FillResults({
                makerAssetFilledAmount: leftOrders[i].makerAssetAmount,
                takerAssetFilledAmount: leftOrders[i].takerAssetAmount,
                makerFeePaid: leftOrders[i].makerFee,
                takerFeePaid: leftOrders[i].takerFee,
                protocolFeePaid: 0
            });
            batchMatchedFillResults.right[i] = LibFillResults.FillResults({
                makerAssetFilledAmount: rightOrders[i].makerAssetAmount,
                takerAssetFilledAmount: rightOrders[i].takerAssetAmount,
                makerFeePaid: rightOrders[i].makerFee,
                takerFeePaid: rightOrders[i].takerFee,
                protocolFeePaid: 0
            });
        }
    }

    /// @dev Overridden to always succeed.
    function _matchOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory,
        bytes memory,
        bool
    )
        internal
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {
        matchedFillResults.left = LibFillResults.FillResults({
            makerAssetFilledAmount: leftOrder.makerAssetAmount,
            takerAssetFilledAmount: leftOrder.takerAssetAmount,
            makerFeePaid: leftOrder.makerFee,
            takerFeePaid: leftOrder.takerFee,
            protocolFeePaid: 0
        });
        matchedFillResults.right = LibFillResults.FillResults({
            makerAssetFilledAmount: rightOrder.makerAssetAmount,
            takerAssetFilledAmount: rightOrder.takerAssetAmount,
            makerFeePaid: rightOrder.makerFee,
            takerFeePaid: rightOrder.takerFee,
            protocolFeePaid: 0
        });
    }

    /// @dev Overridden to do nothing.
    function _cancelOrder(LibOrder.Order memory order)
        internal
    {}
}
