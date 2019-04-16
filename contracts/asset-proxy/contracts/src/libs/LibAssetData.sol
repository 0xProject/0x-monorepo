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


library LibAssetData {
    bytes4 constant public ERC20_PROXY_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 constant public ERC721_PROXY_ID = bytes4(keccak256("ERC721Token(address,uint256)"));
    bytes4 constant public ERC1155_PROXY_ID = bytes4(keccak256("ERC1155Assets(address,uint256[],uint256[],bytes)"));

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
}
