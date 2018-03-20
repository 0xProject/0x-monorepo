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

import "./AssetProxyEncoderDecoder.sol";
import "../TokenTransferProxy/ITokenTransferProxy.sol";
import {Authorizable as ERC20TransferProxyAuthorizable} from "../../utils/Authorizable/Authorizable.sol";

contract ERC20TransferProxy is
    AssetProxyEncoderDecoder,
    ERC20TransferProxyAuthorizable
{
    ITokenTransferProxy TRANSFER_PROXY;

    function ERC20TransferProxy(ITokenTransferProxy tokenTransferProxyContract)
        public
    {
        TRANSFER_PROXY = tokenTransferProxyContract;
    }

    function transferFrom(bytes assetMetadata, address from, address to, uint256 amount)
        public
        onlyAuthorized
        returns (bool success)
    {
        address token = decodeERC20Metadata(assetMetadata);
        return TRANSFER_PROXY.transferFrom(token, from, to, amount);
    }
}
