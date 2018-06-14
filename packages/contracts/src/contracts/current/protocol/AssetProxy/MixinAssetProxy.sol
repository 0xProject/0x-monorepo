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

import "./mixins/MAssetProxy.sol";
import "./mixins/MAuthorizable.sol";

contract MixinAssetProxy is 
    MAuthorizable,
    MAssetProxy
{

    /// @dev Transfers assets. Either succeeds or throws.
    /// @param assetMetadata Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFrom(
        bytes assetMetadata,
        address from,
        address to,
        uint256 amount
    )
        external
        onlyAuthorized
    {
        transferFromInternal(
            assetMetadata,
            from,
            to,
            amount
        );
    }

    /// @dev Makes multiple transfers of assets. Either succeeds or throws.
    /// @param assetMetadata Array of byte arrays encoded for the respective asset proxy.
    /// @param from Array of addresses to transfer assets from.
    /// @param to Array of addresses to transfer assets to.
    /// @param amounts Array of amounts of assets to transfer.
    function batchTransferFrom(
        bytes[] memory assetMetadata,
        address[] memory from,
        address[] memory to,
        uint256[] memory amounts
    )
        public
        onlyAuthorized
    {
        for (uint256 i = 0; i < assetMetadata.length; i++) {
            transferFromInternal(
                assetMetadata[i],
                from[i],
                to[i],
                amounts[i]
            );
        }
    }
}
