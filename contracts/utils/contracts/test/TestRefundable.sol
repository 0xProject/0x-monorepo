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
    function refundNonZeroBalanceExternal()
        external
        payable
    {
        _refundNonZeroBalance();
    }

    function setShouldNotRefund(bool shouldNotRefundNew)
        external
    {
        _shouldNotRefund = shouldNotRefundNew;
    }

    function getShouldNotRefund()
        external
        view
        returns (bool)
    {
        return _shouldNotRefund;
    }

    function refundFinalBalanceFunction()
        public
        payable
        refundFinalBalance
    {} // solhint-disable-line no-empty-blocks

    function disableRefundUntilEndFunction()
        public
        payable
        disableRefundUntilEnd
    {} // solhint-disable-line no-empty-blocks

    function nestedDisableRefundUntilEndFunction()
        public
        payable
        disableRefundUntilEnd
        returns (uint256)
    {
        disableRefundUntilEndFunction();
        return address(this).balance;
    }

    function mixedRefundModifierFunction()
        public
        payable
        disableRefundUntilEnd
        returns (uint256)
    {
        refundFinalBalanceFunction();
        return address(this).balance;
    }
}
