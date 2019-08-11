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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "../src/LibOrder.sol";


contract TestLibOrder {

    function getOrderHash(LibOrder.Order memory order, bytes32 eip712ExchangeDomainHash)
        public
        pure
        returns (bytes32 orderHash)
    {
        orderHash = LibOrder.getOrderHash(order, eip712ExchangeDomainHash);
        return orderHash;
    }

    function hashOrder(LibOrder.Order memory order)
        public
        pure
        returns (bytes32 result)
    {
        result = LibOrder.hashOrder(order);
        return result;
    }
}
