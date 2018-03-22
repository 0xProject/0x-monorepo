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

import "./IAssetProxy.sol";
import "./AssetProxyEncoderDecoder.sol";
import "../TokenTransferProxy/ITokenTransferProxy.sol";
import "../../utils/Authorizable/Authorizable.sol";

contract ERC20TransferProxy_v1 is
    AssetProxyEncoderDecoder,
    Authorizable,
    IAssetProxy
{
    ITokenTransferProxy TRANSFER_PROXY;

    /// @dev Contract constructor.
    /// @param tokenTransferProxyContract erc20 token transfer proxy contract.
    function ERC20TransferProxy_v1(ITokenTransferProxy tokenTransferProxyContract)
        public
    {
        TRANSFER_PROXY = tokenTransferProxyContract;
    }

    /// @dev Transfers ERC20 tokens.
    /// @param assetMetadata Byte array encoded for the respective asset proxy.
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param amount Amount of token to transfer.
    /// @return Success of transfer.
    function transferFrom(
        bytes assetMetadata,
        address from,
        address to,
        uint256 amount)
        public
        onlyAuthorized
        returns (bool success)
    {
        address token = decodeERC20Metadata(assetMetadata);
        return TRANSFER_PROXY.transferFrom(token, from, to, amount);
    }
}
