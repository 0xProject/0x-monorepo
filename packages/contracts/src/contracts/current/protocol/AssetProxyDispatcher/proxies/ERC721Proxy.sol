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

import "../IAssetProxy.sol";
import "../../../utils/LibBytes/LibBytes.sol";
import "../../../utils/Authorizable/Authorizable.sol";
import "/zeppelin/contracts/token/ERC721/ERC721Token.sol";

contract ERC721Proxy is
    LibBytes,
    Authorizable,
    IAssetProxy
{

    /// @dev Transfers ERC20 tokens.
    /// @param assetMetadata ERC721-encoded byte array
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param amount Amount of token to transfer.
    function transferFrom(
        bytes assetMetadata,
        address from,
        address to,
        uint256 amount)
        external
        onlyAuthorized
    {
        // No work to do if amount is zero
        if (amount == 0) return;

        // There exists only 1 of each token.
        require(amount == 1);

        // Decode metadata
        address token;
        uint256 tokenId;
        (token, tokenId) = decodeMetadata(assetMetadata);

        // Either succeeds or throws.
        ERC721Token(token).transferFrom(from, to, tokenId);
    }

    /// @dev Decodes ERC721-encoded byte array.
    /// @param assetMetadata ERC721-encoded byte array.
    /// @return tokenAddress Address of ERC721 token.
    /// @return tokenId Id of ERC721 token.
    function decodeMetadata(bytes memory assetMetadata)
        public pure
        returns (address tokenAddress, uint256 tokenId)
    {
        require(assetMetadata.length == 53);
        tokenAddress = readAddress(assetMetadata, 1);
        tokenId = uint256(readBytes32(assetMetadata, 21));
        return (tokenAddress, tokenId);
    }

    /// @dev Encodes ERC721 byte array.
    /// @param assetProxyId Id of the asset proxy.
    /// @param tokenAddress Address of the asset.
    /// @param tokenId Id of ERC721 token.
    /// @return assetMetadata ERC721-encoded byte array.
    function encodeMetadata(
        uint8 assetProxyId,
        address tokenAddress,
        uint256 tokenId)
        public pure
        returns (bytes memory assetMetadata)
    {
        // 0 is reserved as invalid proxy id
        require(assetProxyId != 0);

        // Encode fields into a byte array
        assetMetadata = new bytes(53);
        assetMetadata[0] = byte(assetProxyId);
        writeAddress(assetMetadata, 1, tokenAddress);
        writeBytes32(assetMetadata, 21, bytes32(tokenId));
        return assetMetadata;
    }
}
