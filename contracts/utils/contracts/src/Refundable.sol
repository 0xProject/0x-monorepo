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


contract Refundable {

    // This bool is used by the refund modifier to allow for lazily evaluated refunds.
    bool internal shouldNotRefund;

    modifier refundFinalBalance {
        _;
        if (!shouldNotRefund) {
            refundNonzeroBalance();
        }
    }

    modifier disableRefundUntilEnd {
        if (shouldNotRefund) {
            _;
        } else {
            shouldNotRefund = true;
            _;
            shouldNotRefund = false;
            refundNonzeroBalance();
        }
    }

    function refundNonzeroBalance()
        internal
    {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            msg.sender.transfer(balance);
        }
    }
}
