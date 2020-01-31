/*

  Copyright 2019 ZeroEx Intl.

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

pragma solidity ^0.5.9;


library LibAssetDataTransferRichErrors {

    // bytes4(keccak256("UnsupportedAssetProxyError(bytes4)"))
    bytes4 internal constant UNSUPPORTED_ASSET_PROXY_ERROR_SELECTOR =
        0x7996a271;

    // bytes4(keccak256("Erc721AmountMustEqualOneError(uint256)"))
    bytes4 internal constant ERC721_AMOUNT_MUST_EQUAL_ONE_ERROR_SELECTOR =
        0xbaffa474;
        
    // solhint-disable func-name-mixedcase
    function UnsupportedAssetProxyError(
        bytes4 proxyId
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UNSUPPORTED_ASSET_PROXY_ERROR_SELECTOR,
            proxyId
        );
    }

    function Erc721AmountMustEqualOneError(
        uint256 amount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            ERC721_AMOUNT_MUST_EQUAL_ONE_ERROR_SELECTOR,
            amount
        );
    }
}
