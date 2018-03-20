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

    function encodeMakerMetadata(uint8 makerAssetId, address makerTokenAddress, bytes32 orderHash)
        public pure
        returns (bytes assetMetadata)
    {
        if(AssetIds(makerAssetId) == AssetIds.ERC20) {
            return encodeERC20Metadata(makerTokenAddress);
        }

        // Conflict importing LibErrors.sol. Looking into this.
        // LogError(Errors.UNKNOWN_MAKER_ASSET_ID, orderHash);
        revert();
    }

    function encodeTakerMetadata(uint8 takerAssetId, address takerTokenAddress, bytes32 orderHash)
        public pure
        returns (bytes assetMetadata)
    {
        if(AssetIds(takerAssetId) == AssetIds.ERC20) {
            return encodeERC20Metadata(takerTokenAddress);
        }

        // Conflict importing LibErrors.sol. Looking into this.
        // LogError(Errors.UNKNOWN_TAKER_ASSET_ID, orderHash);
        revert();
    }
}
