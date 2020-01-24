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
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc721/contracts/test/DummyERC721Token.sol";
import "../src/interfaces/IGodsUnchained.sol";


contract TestGodsUnchained is
    IGodsUnchained,
    DummyERC721Token
{
    mapping (uint256 => uint16) internal _protoByTokenId;
    mapping (uint256 => uint8) internal _qualityByTokenId;

    constructor (
        string memory _name,
        string memory _symbol
    )
        public
        DummyERC721Token(_name, _symbol)
    {} // solhint-disable-line no-empty-blocks

    function setTokenProperties(uint256 tokenId, uint16 proto, uint8 quality)
        external
    {
        _protoByTokenId[tokenId] = proto;
        _qualityByTokenId[tokenId] = quality;
    }

    function getDetails(uint256 tokenId)
        external
        view
        returns (uint16 proto, uint8 quality)
    {
        return (_protoByTokenId[tokenId], _qualityByTokenId[tokenId]);
    }
}
