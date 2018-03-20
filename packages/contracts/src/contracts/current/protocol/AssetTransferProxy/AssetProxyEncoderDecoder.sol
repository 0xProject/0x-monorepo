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
        ERC20,
        ERC721,
        ENS,
        OWNABLE,
        ACCEPT_OWNERSHIP
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

    /// @dev Encodes order's maker metadata into a byte array for the respective asset proxy.
    /// @param makerAssetProxyId Id of the asset proxy.
    /// @param makerTokenAddress Address of the asset.
    /// @param orderHash Hash of order.
    /// @return assetMetadata Byte array encoded for the respective asset proxy.
    function encodeMakerMetadata(
        uint8 makerAssetProxyId,
        address makerTokenAddress,
        bytes32 orderHash)
        public pure
        returns (bytes assetMetadata)
    {
        if(AssetProxyId(makerAssetProxyId) == AssetProxyId.ERC20) {
            return encodeERC20Metadata(makerTokenAddress);
        }

        // @TODO: Fix conflict importing LibErrors.sol.
        // LogError(Errors.UNKNOWN_MAKER_ASSET_PROXY_ID, orderHash);
        revert();
    }

    /// @dev Encodes order's taker metadata into a byte array for the respective asset proxy.
    /// @param takerAssetProxyId Id of the asset proxy.
    /// @param takerTokenAddress Address of the asset.
    /// @param orderHash Hash of order.
    /// @return assetMetadata Byte array encoded for the respective asset proxy.
    function encodeTakerMetadata(uint8 takerAssetProxyId, address takerTokenAddress, bytes32 orderHash)
        public pure
        returns (bytes assetMetadata)
    {
        if(AssetProxyId(takerAssetProxyId) == AssetProxyId.ERC20) {
            return encodeERC20Metadata(takerTokenAddress);
        }

        // @TODO: Fix conflict importing LibErrors.sol.
        // LogError(Errors.UNKNOWN_TAKER_ASSET_PROXY_ID, orderHash);
        revert();
    }
}
