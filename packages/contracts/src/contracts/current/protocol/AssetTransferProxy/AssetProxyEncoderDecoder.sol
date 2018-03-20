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

pragma solidity ^0.4.21;

import "../../utils/Memory/Memory.sol";

contract AssetProxyEncoderDecoder is
    Memory
{
    enum AssetIds {
      ERC20,
      ERC721,
      ENS,
      OWNABLE,
      ACCEPT_OWNERSHIP
    }

    function encodeERC20Metadata(address tokenAddress)
        public pure
        returns (bytes assetMetadata)
    {
        assetMetadata = new bytes(21);
        assetMetadata[0] = byte(uint8(AssetIds.ERC20));
        putAddress(tokenAddress, assetMetadata, 1);
        return assetMetadata;
    }

    function decodeERC20Metadata(bytes assetMetadata)
        public pure
        returns (address tokenAddress)
    {
        require(assetMetadata.length == 21);
        require(assetMetadata[0] == byte(uint8(AssetIds.ERC20)));
        return getAddress(assetMetadata, 1);
    }
}
