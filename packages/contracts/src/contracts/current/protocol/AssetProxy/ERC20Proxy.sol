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
import "../../tokens/ERC20Token/IERC20Token.sol";

contract ERC20Proxy is
    LibBytes,
    MixinAssetProxy,
    MixinAuthorizable
{

    // Id of this proxy.
    uint8 constant PROXY_ID = 1;

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
        // Decode asset data.
        (
            uint8 proxyId,
            address token
        ) = decodeERC20AssetData(assetData);

        // Data must be intended for this proxy.
        require(
            proxyId == PROXY_ID,
            ASSET_PROXY_ID_MISMATCH
        );

        // Transfer tokens.
        bool success = IERC20Token(token).transferFrom(from, to, amount);
        require(
            success,
            TRANSFER_FAILED
        );
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

    /// @dev Decodes ERC20 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC20 proxy id.
    /// @return token ERC20 token address.
    function decodeERC20AssetData(bytes memory assetData)
        internal
        pure
        returns (
            uint8 proxyId,
            address token
        )
    {
        // Validate encoded data length
        uint256 length = assetData.length;
        require(
            assetData.length == 21,
            LENGTH_21_REQUIRED
        );

        // Decode data
        token = readAddress(assetData, 0);
        proxyId = uint8(assetData[length-1]);

        return (proxyId, token);
    }
}
