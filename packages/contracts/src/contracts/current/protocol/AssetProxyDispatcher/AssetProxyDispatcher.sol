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

import "./IAssetProxyDispatcher.sol";
import "./IAssetProxy.sol";
import "../../utils/Ownable/Ownable.sol";
import "../../utils/Authorizable/Authorizable.sol";

contract AssetProxyDispatcher is
    Ownable,
    Authorizable,
    IAssetProxyDispatcher
{
    // Mapping from Asset Proxy Id's to their respective Asset Proxy
    mapping (uint8 => IAssetProxy) public assetProxies;

    /// @dev Delegates transfer to the corresponding asset proxy.
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
        // Lookup asset proxy
        require(assetMetadata.length >= 1);
        uint8 assetProxyId = uint8(assetMetadata[0]);
        IAssetProxy assetProxy = assetProxies[assetProxyId];

        // Dispatch transfer to asset proxy
        // transferFrom will either succeed or throw.
        assetProxy.transferFrom(assetMetadata, from, to, amount);
    }

    /// @dev Registers a new asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @param newAssetProxyAddress Address of the asset proxy contract to register.
    /// @param currentAssetProxyAddress Address of existing asset proxy to overwrite.
    function addAssetProxy(
        uint8 assetProxyId,
        address newAssetProxyAddress,
        address currentAssetProxyAddress)
        external
        onlyOwner
    {
        // Ensure any existing asset proxy is not unintentionally overwritten
        require(currentAssetProxyAddress == address(assetProxies[assetProxyId]));

        // Store asset proxy and log registration
        assetProxies[assetProxyId] = IAssetProxy(newAssetProxyAddress);
        emit AssetProxyChanged(assetProxyId, newAssetProxyAddress, currentAssetProxyAddress);
    }

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(uint8 assetProxyId)
        external view
        returns (IAssetProxy)
    {
        IAssetProxy assetProxy = assetProxies[assetProxyId];
        return assetProxy;
    }
}
