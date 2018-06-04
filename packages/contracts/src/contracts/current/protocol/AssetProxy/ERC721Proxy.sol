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
import "./MixinAssetProxy.sol";
import "./MixinAuthorizable.sol";
import "./MixinERC721Transfer.sol";

contract ERC721Proxy is
    MixinAssetProxy,
    MixinAuthorizable,
    MixinERC721Transfer
{
    // Id of this proxy.
    uint8 constant PROXY_ID = 2;

    /// @dev Gets the proxy id associated with the proxy address.
    /// @return Proxy id.
    function getProxyId()
        external
        view
        returns (uint8)
    {
        return PROXY_ID;
    }

    /// @dev Decodes ERC721 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC721 proxy id.
    /// @return token ERC721 token address.
    /// @return tokenId ERC721 token id.
    /// @return receiverData Additional data with no specific format, which
    ///                      is passed to the receiving contract's onERC721Received.
    function decodeERC721AssetData(bytes memory assetData)
        internal
        pure
        returns (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        )
    {
        // Decode asset data.
        token = readAddress(assetData, 0);
        tokenId = readUint256(assetData, 20);
        if (assetData.length > 52) {
            receiverData = readBytes(assetData, 52);
        }

        return (
            token,
            tokenId,
            receiverData
        );
    }
}
