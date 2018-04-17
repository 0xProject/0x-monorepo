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
import { Token_v1 as ERC20Token } from "../../../../previous/Token/Token_v1.sol";

contract ERC20Proxy is
    LibBytes,
    Authorizable,
    IAssetProxy
{

    /// @dev Transfers ERC20 tokens. Either succeeds or throws.
    /// @param assetMetadata ERC20-encoded byte array.
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
        require(assetMetadata.length == 21);
        address token = readAddress(assetMetadata, 1);
        bool success = ERC20Token(token).transferFrom(from, to, amount);
        require(success == true);
    }
}
