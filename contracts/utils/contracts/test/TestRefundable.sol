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

import "../src/Refundable.sol";


contract TestRefundable is
    Refundable
{
    uint256 public counter = 2;

    function setCounter(uint256 newCounter)
        external
    {
        counter = newCounter;
    }

    function complexReentrantRefundFunction()
        external
        payable
        refund()
    {
        if (counter == 0) {
            // This call tests lazy evaluation across different functions with the refund modifier
            this.simpleRefundFunction();
        } else {
            counter--;
            this.complexReentrantRefundFunction();
        }
    }

    function simpleReentrantRefundFunction()
        external
        payable
        refund()
    {
        if (counter != 0) {
            counter--;
            this.simpleReentrantRefundFunction();
        }
    }

    function simpleRefundFunction()
        external
        payable
        refund()
    {} // solhint-disable-line no-empty-blocks

}
