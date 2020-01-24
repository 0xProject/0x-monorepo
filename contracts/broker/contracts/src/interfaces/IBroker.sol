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

import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// solhint-disable space-after-comma
interface IBroker {

    function brokerTrade(
        bytes[] calldata brokeredAssets,
        LibOrder.Order calldata order,
        uint256 takerAssetFillAmount,
        bytes calldata signature,
        bytes4 fillFunctionSelector
    )
        external
        payable
        returns (LibFillResults.FillResults memory fillResults);

    function batchBrokerTrade(
        bytes[] calldata brokeredAssets,
        LibOrder.Order[] calldata orders,
        uint256[] calldata takerAssetFillAmounts,
        bytes[] calldata signatures,
        bytes4 batchFillFunctionSelector
    )
        external
        payable
        returns (LibFillResults.FillResults[] memory fillResults);

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] calldata /* ids */,
        uint256[] calldata amounts,
        bytes calldata data
    )
        external;
}
