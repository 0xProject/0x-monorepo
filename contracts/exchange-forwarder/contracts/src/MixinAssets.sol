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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/Ownable.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-erc721/contracts/src/interfaces/IERC721Token.sol";
import "./libs/LibConstants.sol";
import "./libs/LibForwarderRichErrors.sol";
import "./interfaces/IAssets.sol";


contract MixinAssets is
    Ownable,
    LibConstants,
    IAssets
{
    using LibBytes for bytes;

    bytes4 constant internal ERC20_TRANSFER_SELECTOR = bytes4(keccak256("transfer(address,uint256)"));

    /// @dev Withdraws assets from this contract. The contract formerly required a ZRX balance in order
    ///      to function optimally, and this function allows the ZRX to be withdrawn by owner.
    ///      It may also be used to withdraw assets that were accidentally sent to this contract.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of ERC20 token to withdraw.
    function withdrawAsset(
        bytes calldata assetData,
        uint256 amount
    )
        external
        onlyOwner
    {
        _transferAssetToSender(assetData, amount);
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
        // For now we only care about ERC20, since percentage fees on ERC721 tokens are invalid.
        if (proxyId == ERC20_DATA_ID) {
            address proxyAddress = EXCHANGE.getAssetProxy(ERC20_DATA_ID);
            if (proxyAddress == address(0)) {
                LibRichErrors.rrevert(LibForwarderRichErrors.UnregisteredAssetProxyError());
            }
            IERC20Token assetToken = IERC20Token(assetData.readAddress(16));
            assetToken.approve(proxyAddress, MAX_UINT);
        }
    }

    /// @dev Transfers given amount of asset to sender.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of asset to transfer to sender.
    function _transferAssetToSender(
        bytes memory assetData,
        uint256 amount
    )
        internal
    {
        bytes4 proxyId = assetData.readBytes4(0);

        if (proxyId == ERC20_DATA_ID) {
            _transferERC20Token(assetData, amount);
        } else if (proxyId == ERC721_DATA_ID) {
            _transferERC721Token(assetData, amount);
        } else {
            LibRichErrors.rrevert(LibForwarderRichErrors.UnsupportedAssetProxyError(
                proxyId
            ));
        }
    }

    /// @dev Decodes ERC20 assetData and transfers given amount to sender.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of asset to transfer to sender.
    function _transferERC20Token(
        bytes memory assetData,
        uint256 amount
    )
        internal
    {
        address token = assetData.readAddress(16);
        // Transfer tokens.
        LibERC20Token.transfer(token, msg.sender, amount);
    }

    /// @dev Decodes ERC721 assetData and transfers given amount to sender.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of asset to transfer to sender.
    function _transferERC721Token(
        bytes memory assetData,
        uint256 amount
    )
        internal
    {
        if (amount != 1) {
            LibRichErrors.rrevert(LibForwarderRichErrors.Erc721AmountMustEqualOneError(
                amount
            ));
        }
        // Decode asset data.
        address token = assetData.readAddress(16);
        uint256 tokenId = assetData.readUint256(36);

        // Perform transfer.
        IERC721Token(token).transferFrom(
            address(this),
            msg.sender,
            tokenId
        );
    }
}
