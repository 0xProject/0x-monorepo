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

import "../../../utils/LibBytes/LibBytes.sol";
import "../../../tokens/ERC20Token/IERC20Token.sol";
import "../MixinAssetProxy.sol";

contract ERC20Proxy is
    LibBytes,
    MixinAssetProxy
{

    // Id of this proxy.
    uint8 constant PROXY_ID = 1;

    // Revert reasons
    string constant INVALID_METADATA_LENGTH = "Metadata must have a length of 21.";
    string constant TRANSFER_FAILED = "Transfer failed.";
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

        // Decode metadata.
        require(
            assetMetadata.length == 21,
            INVALID_METADATA_LENGTH
        );
        address token = readAddress(assetMetadata, 1);

        // Transfer tokens.
        bool success = IERC20Token(token).transferFrom(from, to, amount);
        require(
            success == true,
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
}
