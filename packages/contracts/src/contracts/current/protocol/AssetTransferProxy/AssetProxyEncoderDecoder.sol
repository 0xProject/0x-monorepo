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

import "./LibBytes.sol";
import "./IAssetProxyEncoderDecoder.sol";

contract AssetProxyEncoderDecoder is
    LibBytes,
    IAssetProxyEncoderDecoder
{

    /// @dev Encodes an order's metadata into a byte array for the respective asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @param tokenAddress Address of the asset.
    /// @return assetMetadata Byte array encoded for the respective asset proxy.
    function encodeMetadata(
        uint8 assetProxyId,
        address tokenAddress)
        public pure
        returns (bytes assetMetadata)
    {
        // 0 is reserved as invalid proxy id
        require(assetProxyId != 0);

        // Encode fields into a byte array
        assetMetadata = new bytes(21);
        assetMetadata[0] = byte(assetProxyId);
        writeAddress(tokenAddress, assetMetadata, 1);
        return assetMetadata;
    }

    /// @dev Decodes ERC20-encoded byte array for the ERC20 asset proxy.
    /// @param assetMetadata Byte array encoded for the ERC20 asset proxy.
    /// @return tokenAddress Address of ERC20 token.
    function decodeERC20Metadata(bytes assetMetadata)
        public pure
        returns (address tokenAddress)
    {
        require(assetMetadata.length == 21);
        return readAddress(assetMetadata, 1);
    }
}
