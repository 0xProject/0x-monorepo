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

pragma solidity 0.5.3;

import "../src/ERC1155MockReceiver.sol";

contract DummyERC1155Receiver is
    ERC1155MockReceiver
{
   event BatchTokenReceived(
        address operator,
        address from,
        uint256[] tokenIds,
        uint256[] tokenValues,
        bytes data
    );

    function onERC1155BatchReceived(address _operator, address _from, uint256[] calldata _ids, uint256[] calldata _values, bytes calldata _data) external returns(bytes4) {
        emit BatchTokenReceived(_operator, _from, _ids, _values, _data);
        return ERC1155_BATCH_RECEIVED;
    }
}


