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
    // Supported asset proxies
    enum AssetProxyId {
        INVALID,
        ERC20
    }

    /// @dev Encodes ERC20 order metadata into a byte array for the ERC20 asset proxy.
    /// @param tokenAddress Address of ERC20 token.
    /// @return assetMetadata Byte array encoded for the ERC20 asset proxy.
    function encodeERC20Metadata(address tokenAddress)
        public pure
        returns (bytes assetMetadata)
    {
        assetMetadata = new bytes(21);
        assetMetadata[0] = byte(uint8(AssetProxyId.ERC20));
        putAddress(tokenAddress, assetMetadata, 1);
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
        require(assetMetadata[0] == byte(uint8(AssetProxyId.ERC20)));
        return getAddress(assetMetadata, 1);
    }

    /// @dev Returns true if the input is a valid AssetProxyId.
    /// @param assetProxyId Id of the asset proxy.
    /// @return isValid True only if assetProxyId is a valid AssetProxyId.
    function isValidAssetProxyId(uint8 assetProxyId)
        public pure
        returns (bool isValid)
    {
        isValid = false;
        if (AssetProxyId(assetProxyId) == AssetProxyId.ERC20) {
            isValid = true;
        }

        return isValid;
    }

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
        if (AssetProxyId(assetProxyId) == AssetProxyId.ERC20) {
            return encodeERC20Metadata(tokenAddress);
        }

        // Unrecognized or invalid assetProxyId
        revert();
    }
}
