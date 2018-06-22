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
import "./MixinERC721Transfer.sol";

contract ERC721Proxy is
    MixinAssetProxy,
    MixinAuthorizable,
    MixinERC721Transfer
{
    // Id of this proxy.
    bytes4 constant PROXY_ID = 0xf47261b0;

    /// @dev Gets the proxy id associated with the proxy address.
    /// @return Proxy id.
    function getProxyId()
        external
        view
        returns (bytes4)
    {
        return PROXY_ID;
    }
}
