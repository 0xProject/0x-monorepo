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

import "../../utils/Ownable/Ownable.sol";
import "../AssetProxy/interfaces/IAssetProxy.sol";
import "./libs/LibExchangeErrors.sol";
import "./mixins/MAssetProxyDispatcher.sol";

contract MixinAssetProxyDispatcher is
    LibExchangeErrors,
    Ownable,
    MAssetProxyDispatcher
{
    // Mapping from Asset Proxy Id's to their respective Asset Proxy
    mapping (uint8 => IAssetProxy) public assetProxies;

    /// @dev Registers an asset proxy to an asset proxy id.
    ///      An id can only be assigned to a single proxy at a given time.
    /// @param assetProxyId Id to register`newAssetProxy` under.
    /// @param newAssetProxy Address of new asset proxy to register, or 0x0 to unset assetProxyId.
    /// @param oldAssetProxy Existing asset proxy to overwrite, or 0x0 if assetProxyId is currently unused.
    function registerAssetProxy(
        uint8 assetProxyId,
        address newAssetProxy,
        address oldAssetProxy
    )
        external
        onlyOwner
    {
        // Ensure the existing asset proxy is not unintentionally overwritten
        require(
            oldAssetProxy == address(assetProxies[assetProxyId]),
            OLD_ASSET_PROXY_MISMATCH
        );

        IAssetProxy assetProxy = IAssetProxy(newAssetProxy);

        // Ensure that the id of newAssetProxy matches the passed in assetProxyId, unless it is being reset to 0.
        if (newAssetProxy != address(0)) {
            uint8 newAssetProxyId = assetProxy.getProxyId();
            require(
                newAssetProxyId == assetProxyId,
                NEW_ASSET_PROXY_MISMATCH
            );
        }

        // Add asset proxy and log registration.
        assetProxies[assetProxyId] = assetProxy;
        emit AssetProxySet(assetProxyId, newAssetProxy, oldAssetProxy);
    }

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(uint8 assetProxyId)
        external
        view
        returns (address)
    {
        address assetProxy = address(assetProxies[assetProxyId]);
        return assetProxy;
    }

    /// @dev Forwards arguments to assetProxy and calls `transferFrom`. Either succeeds or throws.
    /// @param assetMetadata Byte array encoded for the respective asset proxy.
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param amount Amount of token to transfer.
    function dispatchTransferFrom(
        bytes memory assetMetadata,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // Do nothing if no amount should be transferred.
        if (amount > 0) {

            // Lookup asset proxy
            uint256 length = assetMetadata.length;
            require(
                length > 0,
                GT_ZERO_LENGTH_REQUIRED
            );
            uint8 assetProxyId = uint8(assetMetadata[length - 1]);
            IAssetProxy assetProxy = assetProxies[assetProxyId];

            // transferFrom will either succeed or throw.
            assetProxy.transferFrom(assetMetadata, from, to, amount);
        }
    }
}
