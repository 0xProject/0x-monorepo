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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "../LibOrder.sol";

contract MExchangeCore is LibOrder {

    struct FillResults {
        uint256 makerTokenFilledAmount;
        uint256 takerTokenFilledAmount;
        uint256 makerFeePaid;
        uint256 takerFeePaid;
    }

    function fillOrder(
        Order memory order,
        uint256 takerTokenFillAmount,
        bytes memory signature)
        public
        returns (FillResults memory fillResults);

    function cancelOrder(Order memory order)
        public
        returns (bool);

    function cancelOrdersUpTo(uint256 salt)
        external;
}
