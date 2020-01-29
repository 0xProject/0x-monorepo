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

import "@0x/contracts-exchange-libs/contracts/src/LibAssetDataTransfer.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./interfaces/IAssets.sol";


contract MixinAssets is
    Ownable,
    LibConstants,
    IAssets
{
    using LibBytes for bytes;
    using LibAssetDataTransfer for bytes;

    /// @dev Withdraws assets from this contract. It may be used by the owner to withdraw assets
    ///      that were accidentally sent to this contract.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of the asset to withdraw.
    function withdrawAsset(
        bytes calldata assetData,
        uint256 amount
    )
        external
        onlyOwner
    {
        assetData.transferOut(amount);
    }

    /// @dev Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
    ///      This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
    ///      Forwarder contract to the fee recipient.
    ///      This method needs to be called before forwarding orders of a maker asset that hasn't
    ///      previously been approved.
    /// @param assetData Byte array encoded for the respective asset proxy.
    function approveMakerAssetProxy(bytes calldata assetData)
        external
    {
        bytes4 proxyId = assetData.readBytes4(0);
        bytes4 erc20ProxyId = IAssetData(address(0)).ERC20Token.selector;

        // For now we only care about ERC20, since percentage fees on ERC721 tokens are invalid.
        if (proxyId == erc20ProxyId) {
            address proxyAddress = EXCHANGE.getAssetProxy(erc20ProxyId);
            if (proxyAddress == address(0)) {
                LibRichErrors.rrevert(LibForwarderRichErrors.UnregisteredAssetProxyError());
            }
            address token = assetData.readAddress(16);
            LibERC20Token.approve(token, proxyAddress, MAX_UINT);
        }
    }
}
