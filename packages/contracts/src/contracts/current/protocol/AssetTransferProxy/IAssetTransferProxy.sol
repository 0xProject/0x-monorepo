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
import "./IAssetProxy.sol";
import "../../utils/Authorizable/Authorizable.sol";

contract IAssetTransferProxy is
    AssetProxyEncoderDecoder,
    Authorizable
{
    // Logs registration of new asset proxy
    event LogAssetProxyRegistration(
        AssetProxyId id,
        address assetClassAddress,
        bool overwrite,
        bool did_overwrite
    );

    // Logs unregistration of an existing asset proxy
    event LogAssetProxyUnregistration(
        AssetProxyId id,
        address assetClassAddress
    );

    /// @dev Delegates transfer to the corresponding asset proxy.
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
        returns (bool);

    /// @dev Registers a new asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @param assetProxyAddress address of the asset proxy contract.
    /// @param overwrite Any existing asset proxy registered with the same assetProxyId will be overwritten.
    function registerAssetProxy(
        AssetProxyId assetProxyId,
        address assetProxyAddress,
        bool overwrite)
        public;

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId.
    function getAssetProxy(AssetProxyId assetProxyId)
        public view
        returns (IAssetProxy);

    /// @dev Unregisters an asset proxy.
    /// @param assetProxyId Id of the asset proxy to unregister.
    function unregisterAssetProxy(AssetProxyId assetProxyId)
        public;
}
