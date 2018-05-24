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

import "../../utils/LibAssetProxyDecoder/LibAssetProxyDecoder.sol";

contract TestLibAssetProxyDecoder is
    LibAssetProxyDecoder
{

    /// @dev Decodes ERC721 Asset Proxy data
    function publicDecodeERC20Data(bytes memory proxyData)
        public
        pure
        returns (uint8, address)
    {
        return decodeERC20Data(proxyData);
    }

    /// @dev Decodes ERC721 Asset Proxy data
    function publicDecodeERC721Data(bytes memory proxyData)
        public
        pure
        returns (
            uint8,
            address,
            uint256,
            bytes memory
        )
    {
        return decodeERC721Data(proxyData);
    }
}
