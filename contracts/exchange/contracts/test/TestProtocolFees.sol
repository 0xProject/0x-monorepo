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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../src/Exchange.sol";


contract TestProtocolFees is
    Exchange
{
    // solhint-disable no-empty-blocks
    constructor ()
        public
        Exchange(1337)
    {}

    // @dev Expose a setter to the `protocolFeeCollector` state variable.
    // @param newProtocolFeeCollector The address that should be made the `protocolFeeCollector`.
    function setProtocolFeeCollector(address newProtocolFeeCollector)
        external
    {
        protocolFeeCollector = newProtocolFeeCollector;
    }

    // @dev Expose a setter to the `protocolFeeMultiplier` state variable.
    // @param newProtocolFeeMultiplier The number that should be made the `protocolFeeMultiplier`.
    function setProtocolFeeMultiplier(uint256 newProtocolFeeMultiplier)
        external
    {
        protocolFeeMultiplier = newProtocolFeeMultiplier;
    }

    // @dev Stub out the `_assertFillableOrder` function because we don't actually
    //      care about order validation in these tests.
    function _assertFillableOrder(
        LibOrder.Order memory,
        LibOrder.OrderInfo memory,
        address,
        bytes memory
    )
        internal
        view
    {} // solhint-disable-line no-empty-blocks

    // @dev Stub out the `_assertFillableOrder` function because we don't actually
    //      care about transfering through proxies in these tests.
    function _dispatchTransferFrom(
        bytes32 orderHash,
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {} // solhint-disable-line no-empty-blocks
}
