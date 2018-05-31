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

import "../../utils/LibBytes/LibBytes.sol";
import "../../utils/LibAssetProxyDecoder/LibAssetProxyDecoder.sol";
import "./MixinAssetProxy.sol";
import "./MixinAuthorizable.sol";
import "../../tokens/ERC721Token/ERC721Token.sol";

contract ERC721Proxy is
    LibBytes,
    LibAssetProxyDecoder,
    MixinAssetProxy,
    MixinAuthorizable
{

    // Id of this proxy.
    uint8 constant PROXY_ID = 2;

    string constant PROXY_ID_MISMATCH = "Proxy id in metadata does not match this proxy id.";

    /// @dev Internal version of `transferFrom`.
    /// @param assetData Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFromInternal(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // Decode proxy data.
        (
            uint8 proxyId,
            address token,
            uint256 tokenId,
            bytes memory data
        ) = decodeERC721Data(assetData);

        // Data must be intended for this proxy.
        uint256 length = assetMetadata.length;

        require(
            length == 53,
            LENGTH_53_REQUIRED
        );

        // TODO: Is this too inflexible in the future?
        require(
            proxyId == PROXY_ID,
            PROXY_ID_MISMATCH
        );

        // There exists only 1 of each token.
        require(
            amount == 1,
            INVALID_AMOUNT
        );

        // Transfer token.
        // Either succeeds or throws.
        ERC721Token(token).safeTransferFrom(from, to, tokenId, data);
    }

    /// @dev Gets the proxy id associated with the proxy address.
    /// @return Proxy id.
    function getProxyId()
        external
        view
        returns (uint8)
    {
        return PROXY_ID;
    }
}
