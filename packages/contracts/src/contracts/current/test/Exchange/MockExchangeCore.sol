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

pragma solidity ^0.4.19;

import "../../protocol/Exchange/mixins/MExchangeCore.sol";

contract MockExchangeCore is MExchangeCore {
    
    uint256 fillOrderCounter;
    uint256[] fillOrderReturns;
    
    event LogFillOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s
    );
    
    function mockFillOrder(uint256[] returnValues)
        public
    {
        fillOrderCounter = 0;
        for(uint256 i = 0; i < returnValues.length; i++) {
            fillOrderReturns[i] = returnValues[i];
        }
    }
    
    function fillOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenFillAmount,
        uint8 v,
        bytes32 r,
        bytes32 s)
        public
        returns (uint256 takerTokenFilledAmount)
    {
        uint256 count = fillOrderCounter;
        fillOrderCounter = count + 1;
        LogFillOrder(orderAddresses, orderValues, takerTokenFillAmount, v, r, s);
        return fillOrderReturns[count];
    }

    uint256 cancelOrderCounter;
    uint256[] cancelOrderReturns;
    
    event LogCancelOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenCancelAmount
    );
    
    function mockCancelOrder(uint256[] returnValues)
        public
    {
        cancelOrderCounter = 0;
        for(uint256 i = 0; i < returnValues.length; i++) {
            cancelOrderReturns[i] = returnValues[i];
        }
    }

    function cancelOrder(
        address[5] orderAddresses,
        uint256[6] orderValues,
        uint256 takerTokenCancelAmount)
        public
        returns (uint256 takerTokenCancelledAmount)
    {
        uint256 count = cancelOrderCounter;
        cancelOrderCounter = count + 1;
        LogCancelOrder(orderAddresses, orderValues, takerTokenCancelAmount);
        return cancelOrderReturns[count];
    }

}
