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

import "../LibBytes/LibBytes.sol";

contract LibAssetProxyDecoder is
    LibBytes
{

    string constant INVALID_ERC20_METADATA_LENGTH = "Metadata must have a length of 21.";
    string constant INVALID_ERC721_METADATA_LENGTH = "Metadata must have a length of at least 53.";

    /// @dev Decodes ERC721 Asset Proxy data
    function decodeERC20Data(bytes memory proxyData)
        internal
        pure
        returns (
            uint8 proxyId,
            address token
        )
    {
        require(
            proxyData.length == 21,
            INVALID_ERC20_METADATA_LENGTH
        );
        proxyId = uint8(proxyData[0]);
        token = readAddress(proxyData, 1);

        return (proxyId, token);
    }

    /// @dev Decodes ERC721 Asset Proxy data
    function decodeERC721Data(bytes memory proxyData)
        internal
        pure
        returns (
            uint8 proxyId,
            address token,
            uint256 tokenId,
            bytes memory data
        )
    {
        require(
            proxyData.length >= 53,
            INVALID_ERC721_METADATA_LENGTH
        );
        proxyId = uint8(proxyData[0]);
        token = readAddress(proxyData, 1);
        tokenId = readUint256(proxyData, 21);
        if (proxyData.length > 53) {
            data = readBytes(proxyData, 53);
        }

        return (proxyId, token, tokenId, data);
    }
}
