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
pragma experimental "ABIEncoderV2";

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "../interfaces/ICoordinatorApprovalVerifier.sol";


contract MCoordinatorApprovalVerifier is
    ICoordinatorApprovalVerifier
{
    /// @dev Decodes the orders from Exchange calldata representing any fill method.
    /// @param data Exchange calldata representing a fill method.
    /// @return The orders from the Exchange calldata.
    function decodeFillDataOrders(bytes memory data)
        internal
        pure
        returns (LibOrder.Order[] memory orders);
}
