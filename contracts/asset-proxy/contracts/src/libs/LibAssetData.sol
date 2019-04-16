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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155Mintable.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc721/contracts/src/interfaces/IERC721Token.sol";


library LibAssetData {
    bytes4 constant public ERC20_PROXY_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 constant public ERC721_PROXY_ID = bytes4(keccak256("ERC721Token(address,uint256)"));
    bytes4 constant public ERC1155_PROXY_ID = bytes4(keccak256("ERC1155Assets(address,uint256[],uint256[],bytes)"));
    bytes4 constant public MULTI_ASSET_PROXY_ID = bytes4(keccak256("MultiAsset(uint256[],bytes[])"));

    function balanceOf(address owner, bytes memory assetData)
        public
        view
        returns (uint256 amount)
    {
        bytes4 proxyId = LibBytes.readBytes4(assetData, 0);

        if (proxyId == ERC20_PROXY_ID) {
            return IERC20Token(LibBytes.readAddress(assetData, 16)).balanceOf(owner);
        } else if (proxyId == ERC721_PROXY_ID) {
            return IERC721Token(LibBytes.readAddress(assetData, 16)).balanceOf(owner);
        } else if (proxyId == ERC1155_PROXY_ID) {
            // solhint-disable-next-line
            (address tokenAddress, uint256[] memory tokenIds, , ) = abi.decode(
                LibBytes.slice(assetData, 4, assetData.length),
                // solhint-disable-next-line
                (address, uint256[], uint256[], bytes)
            );
            address[] memory owners = new address[](1);
            owners[0] = owner;
            return IERC1155Mintable(tokenAddress).balanceOfBatch(owners, tokenIds)[0];
        } else if (proxyId == MULTI_ASSET_PROXY_ID) {
            // solhint-disable-next-line
            (uint256[] memory assetAmounts, bytes[] memory nestedAssetData) = abi.decode(
                // solhint-disable-next-line
                LibBytes.slice(assetData, 4, assetData.length), (uint256[], bytes[])
            );
            uint256 lowestAssetBalance = ~uint256(0);
            for (uint256 i = 0; i < nestedAssetData.length; i++) {
                uint256 assetBalance = balanceOf(owner, nestedAssetData[i]) / assetAmounts[i];
                if (assetBalance < lowestAssetBalance) {
                    lowestAssetBalance = assetBalance;
                }
            }
            return lowestAssetBalance;
        } else {
            revert("Unsupported proxy identifier");
        }
    }

    function allowance(address owner, address spender, bytes memory assetData)
        // should we rename to getApproval()? "Allowance" seems out of vogue.
        public
        view
        returns (uint256 amount)
    {
        bytes4 proxyId = LibBytes.readBytes4(assetData, 0);

        if (proxyId == ERC20_PROXY_ID) {
            return IERC20Token(LibBytes.readAddress(assetData, 16)).allowance(owner, spender);
        } else if (proxyId == ERC721_PROXY_ID) {
            (address tokenAddress, uint256 tokenId) = abi.decode(
                LibBytes.slice(assetData, 4, assetData.length),
                (address, uint256)
            );
            if (spender == IERC721Token(tokenAddress).getApproved(tokenId)) {
                return 1;
            } else {
                return 0;
            }
        } else {
            revert("Unsupported proxy identifier");
        }
    }

    function encodeERC20AssetData(address tokenAddress)
        public
        pure
        returns (bytes memory assetData)
    {
        return abi.encodeWithSelector(ERC20_PROXY_ID, tokenAddress);
    }

    function decodeERC20AssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            address tokenAddress
        )
    {
        proxyId = LibBytes.readBytes4(assetData, 0);

        require(proxyId == ERC20_PROXY_ID);

        tokenAddress = LibBytes.readAddress(assetData, 16);
    }

    function encodeERC721AssetData(
        address tokenAddress,
        uint256 tokenId
    )
        public
        pure
        returns (bytes memory assetData)
    {
        return abi.encodeWithSelector(ERC721_PROXY_ID, tokenAddress, tokenId);
    }

    function decodeERC721AssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            address tokenAddress,
            uint256 tokenId
        )
    {
        proxyId = LibBytes.readBytes4(assetData, 0);

        require(proxyId == ERC721_PROXY_ID);

        tokenAddress = LibBytes.readAddress(assetData, 16);
        tokenId = LibBytes.readUint256(assetData, 36);
    }

    function encodeERC1155AssetData(
        address tokenAddress,
        uint256[] memory tokenIds,
        uint256[] memory tokenValues,
        bytes memory callbackData
    )
        public
        pure
        returns (bytes memory assetData)
    {
        return abi.encodeWithSelector(ERC1155_PROXY_ID, tokenAddress, tokenIds, tokenValues, callbackData);
    }

    function decodeERC1155AssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            address tokenAddress,
            uint256[] memory tokenIds,
            uint256[] memory tokenValues,
            bytes memory callbackData
        )
    {
        proxyId = LibBytes.readBytes4(assetData, 0);

        require(proxyId == ERC1155_PROXY_ID);

        // solhint-disable-next-line
        (tokenAddress, tokenIds, tokenValues, callbackData) = abi.decode(
            LibBytes.slice(assetData, 4, assetData.length), (address, uint256[], uint256[], bytes)
        );
    }

    function encodeMultiAssetData(uint256[] memory amounts, bytes[] memory nestedAssetData)
        public
        pure
        returns (bytes memory assetData)
    {
        assetData = abi.encodeWithSelector(MULTI_ASSET_PROXY_ID, amounts, nestedAssetData);
    }

    function decodeMultiAssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            uint256[] memory amounts,
            bytes[] memory nestedAssetData
        )
    {
        proxyId = LibBytes.readBytes4(assetData, 0);

        require(proxyId == MULTI_ASSET_PROXY_ID);

        // solhint-disable-next-line
        (amounts, nestedAssetData) = abi.decode(LibBytes.slice(assetData, 4, assetData.length), (uint256[], bytes[]));
    }
}
