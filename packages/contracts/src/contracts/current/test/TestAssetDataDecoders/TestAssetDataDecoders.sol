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

import "../../protocol/AssetProxy/ERC20Proxy.sol";
import "../../protocol/AssetProxy/ERC721Proxy.sol";

contract TestAssetDataDecoders is
    ERC20Proxy,
    ERC721Proxy
{

    /// @dev Decodes ERC20 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC20 proxy id.
    /// @return token ERC20 token address.
    function publicDecodeERC20Data(bytes memory assetData)
        public
        pure
        returns (
            uint8 proxyId,
            address token
        )
    {
        (proxyId, token) = decodeERC20AssetData(assetData);
        return (proxyId, token);
    }

    /// @dev Decodes ERC721 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC721 proxy id.
    /// @return token ERC721 token address.
    /// @return tokenId ERC721 token id.
    /// @return receiverData Additional data with no specific format, which
    ///                      is passed to the receiving contract's onERC721Received.
    function publicDecodeERC721Data(bytes memory assetData)
        public
        pure
        returns (
            uint8 proxyId,
            address token,
            uint256 tokenId,
            bytes memory receiverData
        )
    {
        (
            proxyId,
            token,
            tokenId,
            receiverData
        ) = decodeERC721AssetData(assetData);

        return (
            proxyId,
            token,
            tokenId,
            receiverData
        );
    }
}
