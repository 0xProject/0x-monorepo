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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../utils/LibBytes/LibBytes.sol";
import "../tokens/ERC721Token/IERC721Token.sol";

contract MixinERC721 {

    using LibBytes for bytes;
    bytes4 constant ERC721_RECEIVED = bytes4(keccak256("onERC721Received(address,uint256,bytes)"));
    bytes4 constant ERC721_RECEIVED_OPERATOR = bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));

    function onERC721Received(address, uint256, bytes memory)
        public
        pure
        returns(bytes4)
    {
        return ERC721_RECEIVED;
    }

    function onERC721Received(address, address, uint256, bytes memory)
        public
        pure
        returns(bytes4)
    {
        return ERC721_RECEIVED_OPERATOR;
    }

    function transferERC721Token(
        bytes memory assetData,
        address to
    )
        internal
    {
        // Decode asset data.
        address token = assetData.readAddress(16);
        uint256 tokenId = assetData.readUint256(36);
        bytes memory receiverData = assetData.readBytesWithLength(100);
        IERC721Token(token).safeTransferFrom(
            address(this),
            to,
            tokenId,
            receiverData
        );
    }
}
