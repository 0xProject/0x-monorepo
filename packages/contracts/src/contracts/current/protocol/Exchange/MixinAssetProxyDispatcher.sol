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
import "../../utils/LibBytes/LibBytes.sol";
import "./libs/LibExchangeErrors.sol";
import "./mixins/MAssetProxyDispatcher.sol";
import "../AssetProxy/interfaces/IAssetProxy.sol";

contract MixinAssetProxyDispatcher is
    Ownable,
    LibExchangeErrors,
    MAssetProxyDispatcher
{
    using LibBytes for bytes;
    
    // Mapping from Asset Proxy Id's to their respective Asset Proxy
    mapping (bytes4 => IAssetProxy) public assetProxies;

    /// @dev Registers an asset proxy to an asset proxy id.
    ///      An id can only be assigned to a single proxy at a given time.
    /// @param assetProxyId Id to register`newAssetProxy` under.
    /// @param newAssetProxy Address of new asset proxy to register, or 0x0 to unset assetProxyId.
    /// @param oldAssetProxy Existing asset proxy to overwrite, or 0x0 if assetProxyId is currently unused.
    function registerAssetProxy(
        bytes4 assetProxyId,
        address newAssetProxy,
        address oldAssetProxy
    )
        external
        onlyOwner
    {
        // Ensure the existing asset proxy is not unintentionally overwritten
        address currentAssetProxy = assetProxies[assetProxyId];
        require(
            oldAssetProxy == currentAssetProxy,
            ASSET_PROXY_MISMATCH
        );

        IAssetProxy assetProxy = IAssetProxy(newAssetProxy);

        // Ensure that the id of newAssetProxy matches the passed in assetProxyId, unless it is being reset to 0.
        if (newAssetProxy != address(0)) {
            bytes4 newAssetProxyId = assetProxy.getProxyId();
            require(
                newAssetProxyId == assetProxyId,
                ASSET_PROXY_ID_MISMATCH
            );
        }

        // Add asset proxy and log registration.
        assetProxies[assetProxyId] = assetProxy;
        emit AssetProxySet(
            assetProxyId,
            newAssetProxy,
            oldAssetProxy
        );
    }

    /// @dev Gets an asset proxy.
    /// @param assetProxyId Id of the asset proxy.
    /// @return The asset proxy registered to assetProxyId. Returns 0x0 if no proxy is registered.
    function getAssetProxy(bytes4 assetProxyId)
        external
        view
        returns (address)
    {
        return assetProxies[assetProxyId];
    }

    /// @dev Forwards arguments to assetProxy and calls `transferFrom`. Either succeeds or throws.
    /// @param assetData Byte array encoded for the asset.
    /// @param from Address to transfer token from.
    /// @param to Address to transfer token to.
    /// @param amount Amount of token to transfer.
    function dispatchTransferFrom(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // Do nothing if no amount should be transferred.
        if (amount > 0) {
            require(assetData.length >= 4, "ASSET_DATA_LENGTH");
            
            // Lookup assetProxy
            bytes4 assetProxyId;
            assembly {
                assetProxyId := and(mload(add(assetData, 32)),
0xFFFFFFFF00000000000000000000000000000000000000000000000000000000
                )
            }
            IAssetProxy assetProxy = assetProxies[assetProxyId];
            // Ensure that assetProxy exists
            require(
                assetProxy != address(0),
                ASSET_PROXY_DOES_NOT_EXIST
            );
            
            /*
            assetProxy.transferFrom(
                assetData,
                from,
                to,
                amount
            );
            return;
            */
            
            bytes4 transferFromSelector = IAssetProxy(assetProxy).transferFrom.selector;
             bool success;
            assembly {
                
                let cdStart := mload(0x40)
                let dataAreaLength := mul(div(add(mload(assetData), 63), 32), 32)
                let cdEnd := add(cdStart, add(132, dataAreaLength))
                
                mstore(cdStart, transferFromSelector)
                mstore(add(cdStart, 4), 128)
                mstore(add(cdStart, 36), and(from, 0xffffffffffffffffffffffffffffffffffffffff))
                mstore(add(cdStart, 68), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
                mstore(add(cdStart, 100), amount)
                
                let dataArea := add(cdStart, 132)
                for {} lt(dataArea, cdEnd) {} {
                    mstore(dataArea, mload(assetData))
                    dataArea := add(dataArea, 32)
                    assetData := add(assetData, 32)
                }
                
                success := call(
                     gas,
                     assetProxy,
                     0,
                     cdStart,
                     sub(cdEnd, cdStart),
                     cdStart,
                     0
                )
            }
            require(
                success,
                "TRANSFER_FAILED"
            );
        }
    }
}
