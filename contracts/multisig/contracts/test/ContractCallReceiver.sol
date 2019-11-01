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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";


contract ContractCallReceiver {

    using LibBytes for bytes;

    event ContractCall(
        bytes4 functionSelector,
        bytes data,
        uint256 value
    );

    bytes4 constant internal ALWAYS_REVERT_SELECTOR = 0xF1F2F3F4;

    function ()
        external
        payable
    {
        bytes4 selector = msg.data.readBytes4(0);
        if (selector == ALWAYS_REVERT_SELECTOR) {
            revert();
        }

        emit ContractCall(
            selector,
            msg.data,
            msg.value
        );
    }
}