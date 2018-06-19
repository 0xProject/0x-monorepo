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
import "../../tokens/ERC721Token/ERC721Token.sol";
import "./libs/LibTransferErrors.sol";

contract MixinERC721Transfer is
    LibBytes,
    LibTransferErrors
{
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
        // There exists only 1 of each token.
        require(
            amount == 1,
            INVALID_AMOUNT
        );
    
        // Decode asset data.
        (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        ) = decodeERC721AssetData(assetData);

        // Transfer token. Saves gas by calling safeTransferFrom only
        // when there is receiverData present. Either succeeds or throws.
        if (receiverData.length > 0) {
            ERC721Token(token).safeTransferFrom(from, to, tokenId, receiverData);
        } else {
            ERC721Token(token).transferFrom(from, to, tokenId);
        }
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
