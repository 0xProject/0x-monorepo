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

pragma solidity ^0.5.3;

import "../src/interfaces/IERC1155Receiver.sol";

contract DummyERC1155Receiver is
    IERC1155Receiver
{

    bytes4 constant public ERC1155_RECEIVED       = 0xf23a6e61;
    bytes4 constant public ERC1155_BATCH_RECEIVED = 0xbc197c81;

    constructor () public {}

    event TokenReceived(
        address operator,
        address from,
        uint256 tokenId,
        uint256 tokenValue,
        bytes data
    );

    event BatchTokenReceived(
        address operator,
        address from,
        uint256[] tokenIds,
        uint256[] tokenValues,
        bytes data
    );
    
    function onERC1155Received(
        address _operator,
        address _from,
        uint256 _id,
        uint256 _value,
        bytes calldata _data
    )
        external
        returns (bytes4)
    {
        emit TokenReceived(_operator, _from, _id, _value, _data);
        return ERC1155_RECEIVED;
    }

    function onERC1155BatchReceived(
        address _operator,
        address _from,
        uint256[] calldata _ids,
        uint256[] calldata _values,
        bytes calldata _data
    )
        external
        returns (bytes4)
    {
        emit BatchTokenReceived(_operator, _from, _ids, _values, _data);
        return ERC1155_BATCH_RECEIVED;
    }
}
