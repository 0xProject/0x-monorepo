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

contract AssetTransferProxy is
    AssetProxyEncoderDecoder
{
    mapping (uint8 => IAssetProxy) public assetProxies_;
    address public owner_;

    event LogTransfer(
        uint8 id,
        address from,
        address to,
        uint256 amount
    );

    event LogRegistration(
        uint8 id,
        address assetClassAddress,
        bool overwrite,
        bool did_overwrite
    );

    event LogUnregistration(
        uint8 id,
        address assetClassAddress
    );

/*
    function AssetTransferProxy(address owner)
        public
    {
        owner_ = owner;
    }*/

    function AssetTransferProxy()
        public
    {
        //owner_ = owner;
    }

    // tokenMetadata[0] => AssetClassId
    // [tokenMetadata[1],..,tokenMetadata[21] => Asset Address
    function transferFrom(bytes assetMetadata, address from, address to, uint256 amount)
        public
        returns (bool)
    {
        //require(msg.sender == owner_);
        require(assetMetadata.length >= 21);

        // Require asset class id exists
        uint8 assetClassId = uint8(assetMetadata[0]);
        IAssetProxy assetClass = assetProxies_[assetClassId];
        require(assetClass != address(0x0));

        // Delegate transfer to asset class
        return assetClass.transferFrom(assetMetadata, from, to, amount);
    }

    function registerAssetProxy(AssetIds assetId, address assetClassAddress, bool overwrite)
        public
    {
        require(uint256(assetId) < 256);
        uint8 id = uint8(assetId);
        //require(msg.sender == owner_);
        bool will_overwrite = assetProxies_[id] != address(0x0);
        require(overwrite || !will_overwrite);

        // Store asset class and record its id
        assetProxies_[id] = IAssetProxy(assetClassAddress);

        // Log registration
        emit LogRegistration(id, assetClassAddress, overwrite, will_overwrite);
    }

    function getAssetProxy(AssetIds assetId)
        public view
        returns (IAssetProxy)
    {
        require(uint256(assetId) < 256);
        uint8 id = uint8(assetId);
        //require(msg.sender == owner_);
        address assetProxyAddress = address(assetProxies_[id]);
        require(assetProxyAddress != address(0x0));
        return assetProxies_[id];
    }


    function unregisterAssetProxy(AssetIds assetId)
        public
    {
        require(uint256(assetId) < 256);
        uint8 id = uint8(assetId);
        //require(msg.sender == owner_);
        address assetProxyAddress = address(assetProxies_[id]);
        require(assetProxyAddress != address(0x0));
        delete assetProxies_[id];

        // Log unregistration
        emit LogUnregistration(id, assetProxyAddress);
    }
}
