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
    function isReentrant(bytes calldata fnCallData)
        external
        returns (bool isReentrant)
    {
        bytes memory callData = abi.encodeWithSelector(this.testReentrantFunction.selector, fnCallData);
        (bool didSucceed, bytes memory resultData) = address(this).delegatecall(callData);
        if (didSucceed) {
            isReentrant = true;
        } else {
            if (resultData.equals(LibReentrancyGuardRichErrors.IllegalReentrancyError())) {
                isReentrant = false;
            } else {
                isReentrant = true;
            }
        }
    }

    /// @dev Calls a public function to check if it is reentrant.
    /// Because this function uses the `nonReentrant` modifier, if
    /// the function being called is also guarded by the `nonReentrant` modifier,
    /// it will revert when it returns.
    function testReentrantFunction(bytes calldata fnCallData)
        external
        nonReentrant
    {
        address(this).delegatecall(fnCallData);
    }

    /// @dev Overriden to do nothing.
    function _fillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (FillResults memory fillResults)
    {}

    /// @dev Overriden to do nothing.
    function _fillOrKillOrder(
        Order memory order,
        uint256 takerAssetFillAmount,
        bytes memory signature
    )
        internal
        returns (FillResults memory fillResults)
    {}

    /// @dev Overridden to do nothing.
    function _executeTransaction(
        ZeroExTransaction memory transaction,
        bytes memory signature
    )
        internal
        returns (bytes memory resultData)
    {
        // Should already point to an empty array.
        return resultData;
    }

    /// @dev Overriden to do nothing.
    function _batchMatchOrders(
        LibOrder.Order[] memory leftOrders,
        LibOrder.Order[] memory rightOrders,
        bytes[] memory leftSignatures,
        bytes[] memory rightSignatures,
        bool shouldMaximallyFillOrders
    )
        internal
        returns (LibFillResults.BatchMatchedFillResults memory batchMatchedFillResults)
    {}

    /// @dev Overriden to do nothing.
    function _matchOrders(
        LibOrder.Order memory leftOrder,
        LibOrder.Order memory rightOrder,
        bytes memory leftSignature,
        bytes memory rightSignature,
        bool shouldMaximallyFillOrders
    )
        internal
        returns (LibFillResults.MatchedFillResults memory matchedFillResults)
    {}

    /// @dev Overriden to do nothing.
    function _cancelOrder(Order memory order)
        internal
    {}
}
