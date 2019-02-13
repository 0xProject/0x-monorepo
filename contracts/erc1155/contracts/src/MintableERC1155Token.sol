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

import "./ERC1155Token.sol";


contract MintableERC1155Token is
    ERC1155Token
{

    uint256 nonce;
    mapping (uint256 => address) public creators;
    mapping (uint256 => uint256) public maxIndex;

    modifier creatorOnly(uint256 _id) {
        require(creators[_id] == msg.sender);
        _;
    }

    // This function only creates the type.
    function create(
        string calldata _uri,
        bool   _isNF)
    external returns(uint256 _type) {

        // Store the type in the upper 128 bits
        _type = (++nonce << 128);

        // Set a flag if this is an NFI.
        if (_isNF)
          _type = _type | TYPE_NF_BIT;

        // This will allow restricted access to creators.
        creators[_type] = msg.sender;

        // emit a Transfer event with Create semantic to help with discovery.
        emit TransferSingle(msg.sender, address(0x0), address(0x0), _type, 0);

        if (bytes(_uri).length > 0)
            emit URI(_uri, _type);
    }

    function mintNonFungible(uint256 _type, address[] calldata _to) external creatorOnly(_type) {

        // No need to check this is a nf type rather than an id since
        // creatorOnly() will only let a type pass through.
        require(isNonFungible(_type));

        // Index are 1-based.
        uint256 index = maxIndex[_type] + 1;

        for (uint256 i = 0; i < _to.length; ++i) {
            address dst = _to[i];
            uint256 id  = _type | index + i;

            nfOwners[id] = dst;

            // You could use base-type id to store NF type balances if you wish.
            // balances[_type][dst] = quantity.add(balances[_type][dst]);

            emit TransferSingle(msg.sender, address(0x0), dst, id, 1);

            if (dst.isContract()) {
                require(IERC1155Receiver(dst).onERC1155Received(msg.sender, msg.sender, id, 1, '') == ERC1155_RECEIVED);
            }
        }

        maxIndex[_type] = _to.length.add(maxIndex[_type]);
    }

    function mintFungible(uint256 _id, address[] calldata _to, uint256[] calldata _quantities) external creatorOnly(_id) {

        require(isFungible(_id));

        for (uint256 i = 0; i < _to.length; ++i) {

            address to = _to[i];
            uint256 quantity = _quantities[i];

            // Grant the items to the caller
            balances[_id][to] = quantity.add(balances[_id][to]);

            // Emit the Transfer/Mint event.
            // the 0x0 source address implies a mint
            // It will also provide the circulating supply info.
            emit TransferSingle(msg.sender, address(0x0), to, _id, quantity);

            if (to.isContract()) {
                require(IERC1155Receiver(to).onERC1155Received(msg.sender, msg.sender, _id, quantity, '') == ERC1155_RECEIVED);
            }
        }
    }

}
