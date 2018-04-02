/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../LibOrder.sol";

contract MSettlement is LibOrder {
  
    function settleOrder(
        Order order,
        address taker,
        uint256 takerTokenFilledAmount)
        internal
        returns (
            uint256 makerTokenFilledAmount,
            uint256 makerFeeAmountPaid,
            uint256 takerFeeAmountPaid
        );

}
