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

import "../../utils/Ownable/IOwnable.sol";
import "../../utils/Authorizable/IAuthorizable.sol";
import "./IAssetProxy.sol";

contract IAssetProxyDispatcher is
    IOwnable,
    IAuthorizable,
    IAssetProxy
{

    // Logs registration of new asset proxy
    event AssetProxySet(
        uint8 id,
        IAssetProxy newAssetClassAddress,
        IAssetProxy oldAssetClassAddress
    );

    /// @dev Adds a new asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @param newAssetProxy Asset proxy contract to add, or 0x0 to unset assetProxyId.
    /// @param currentAssetProxy Existing asset proxy to overwrite, or 0x0 if assetProxyId is currently unused.
    function addAssetProxy(
        uint8 assetProxyId,
        IAssetProxy newAssetProxy,
        IAssetProxy currentAssetProxy)
        external;

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(uint8 assetProxyId)
        external view
        returns (IAssetProxy);
}
