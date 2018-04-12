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
import { ITokenTransferProxy as ITokenTransferProxy_v1 } from "../../TokenTransferProxy/ITokenTransferProxy.sol";

contract ERC20Proxy_v1 is
    LibBytes,
    Authorizable,
    IAssetProxy
{
    ITokenTransferProxy_v1 TRANSFER_PROXY;

    /// @dev Contract constructor.
    /// @param tokenTransferProxyContract erc20 token transfer proxy contract.
    function ERC20Proxy_v1(ITokenTransferProxy_v1 tokenTransferProxyContract)
        public
    {
        // TODO: Hardcode this address for production.
        TRANSFER_PROXY = tokenTransferProxyContract;
    }

    /// @dev Transfers ERC20 tokens.
    /// @param assetMetadata Byte array encoded for the respective asset proxy.
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
        address token = decodeMetadata(assetMetadata);
        bool success = TRANSFER_PROXY.transferFrom(token, from, to, amount);
        require(success == true);
    }

    /// @dev Encodes ERC20 byte array.
    /// @param assetProxyId Id of the asset proxy.
    /// @param tokenAddress Address of the asset.
    /// @return assetMetadata ERC20-encoded byte.
    function encodeMetadata(
        uint8 assetProxyId,
        address tokenAddress)
        public pure
        returns (bytes memory assetMetadata)
    {
        // 0 is reserved as invalid proxy id
        require(assetProxyId != 0);

        // Encode fields into a byte array
        assetMetadata = new bytes(21);
        assetMetadata[0] = byte(assetProxyId);
        writeAddress(assetMetadata, 1, tokenAddress);
        return assetMetadata;
    }

    /// @dev Decodes ERC20-encoded byte array.
    /// @param assetMetadata ERC20-encoded byte array.
    /// @return tokenAddress Address of ERC20 token.
    function decodeMetadata(bytes memory assetMetadata)
        public pure
        returns (address tokenAddress)
    {
        require(assetMetadata.length == 21);
        return readAddress(assetMetadata, 1);
    }
}
