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

pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

import "../../utils/LibBytes/LibBytes.sol";
import "../../tokens/ERC721Token/ERC721Token.sol";
import "./MixinAssetProxy.sol";

contract ERC721Proxy is
    LibBytes,
    MixinAssetProxy
{

    // Id of this proxy.
    uint8 constant PROXY_ID = 2;

    // Revert reasons
    string constant INVALID_TRANSFER_AMOUNT = "Transfer amount must equal 1.";
    string constant INVALID_METADATA_LENGTH = "Metadata must have a length of 53.";
    string constant PROXY_ID_MISMATCH = "Proxy id in metadata does not match this proxy id.";

    /// @dev Internal version of `transferFrom`.
    /// @param assetMetadata Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFromInternal(
        bytes memory assetMetadata,
        address from,
        address to,
        uint256 amount)
        internal
    {
        // Data must be intended for this proxy.
        require(
            uint8(assetMetadata[0]) == PROXY_ID,
            PROXY_ID_MISMATCH
        );

        // There exists only 1 of each token.
        require(
            amount == 1,
            INVALID_TRANSFER_AMOUNT
        );

        // Decode metadata
        require(
            assetMetadata.length == 53,
            INVALID_METADATA_LENGTH
        );
        address token = readAddress(assetMetadata, 1);
        uint256 tokenId = readUint256(assetMetadata, 21);

        // Transfer token.
        // Either succeeds or throws.
        // @TODO: Call safeTransferFrom if there is additional
        //        data stored in `assetMetadata`.
        ERC721Token(token).transferFrom(from, to, tokenId);
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
