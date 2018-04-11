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

import "./IAssetProxy.sol";
import "../../utils/Authorizable/IAuthorizable.sol";

contract IAssetProxyDispatcher is
    IAuthorizable,
    IAssetProxy
{
    // Logs registration of new asset proxy
    event AssetProxyChanged(
        uint8 id,
        address newAssetClassAddress,
        address oldAssetClassAddress
    );

    /// @dev Sets a new asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @param newAssetProxyAddress Address of the asset proxy contract to register.
    /// @param currentAssetProxyAddress Address of existing asset proxy to overwrite.
    function setAssetProxy(
        uint8 assetProxyId,
        address newAssetProxyAddress,
        address currentAssetProxyAddress)
        public;

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(uint8 assetProxyId)
        public view
        returns (IAssetProxy);
}
