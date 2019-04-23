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
import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155.sol";
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
        returns (uint256 balance)
    {
        bytes4 proxyId = LibBytes.readBytes4(assetData, 0);
        if (proxyId == ERC20_PROXY_ID) {
            address tokenAddress = LibBytes.readAddress(assetData, 16);
            return IERC20Token(tokenAddress).balanceOf(owner);
        } else if (proxyId == ERC721_PROXY_ID) {
            (, address tokenAddress, uint256 tokenId) = decodeERC721AssetData(assetData);
            return getERC721TokenOwner(tokenAddress, tokenId) == owner ? 1 : 0;
        } else if (proxyId == ERC1155_PROXY_ID) {
            uint256 lowestTokenBalance = 0;
            (
                ,
                address tokenAddress,
                uint256[] memory tokenIds,
                uint256[] memory tokenValues,
            ) = decodeERC1155AssetData(assetData);
            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 tokenBalance = IERC1155(tokenAddress).balanceOf(owner, tokenIds[i]) / tokenValues[i];
                if (tokenBalance < lowestTokenBalance || lowestTokenBalance == 0) {
                    lowestTokenBalance = tokenBalance;
                }
            }
            return lowestTokenBalance;
        } else if (proxyId == MULTI_ASSET_PROXY_ID) {
            uint256 lowestAssetBalance = 0;
            (, uint256[] memory assetAmounts, bytes[] memory nestedAssetData) = decodeMultiAssetData(assetData);
            for (uint256 i = 0; i < nestedAssetData.length; i++) {
                uint256 assetBalance = balanceOf(owner, nestedAssetData[i]) / assetAmounts[i];
                if (assetBalance < lowestAssetBalance || lowestAssetBalance == 0) {
                    lowestAssetBalance = assetBalance;
                }
            }
            if (lowestAssetBalance == ~uint256(0)) {
                lowestAssetBalance = 0;
            }
            return lowestAssetBalance;
        } else {
            revert("Unsupported proxy identifier");
        }
    }

    function batchBalanceOf(address owner, bytes[] memory assetData)
        public
        view
        returns (uint256[] memory balances)
    {
        balances = new uint256[](assetData.length);
        for (uint256 i = 0; i < assetData.length; i++) {
            balances[i] = balanceOf(owner, assetData[i]);
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
            address tokenAddress = LibBytes.readAddress(assetData, 16);
            return IERC20Token(tokenAddress).allowance(owner, spender);
        } else if (proxyId == ERC721_PROXY_ID) {
            (, address tokenAddress, uint256 tokenId) = decodeERC721AssetData(assetData);
            IERC721Token token = IERC721Token(tokenAddress);
            if (spender == token.getApproved(tokenId) || token.isApprovedForAll(owner, spender)) {
                return 1;
            } else {
                return 0;
            }
        } else if (proxyId == ERC1155_PROXY_ID) {
            (, address tokenAddress, , , ) = decodeERC1155AssetData(assetData);
            if (IERC1155(tokenAddress).isApprovedForAll(owner, spender)) {
                return 1;
            } else {
                return 0;
            }
        } else if (proxyId == MULTI_ASSET_PROXY_ID) {
            uint256 lowestAssetAllowance = 0;
            // solhint-disable-next-line indent
            (, , bytes[] memory nestedAssetData) = decodeMultiAssetData(assetData);
            for (uint256 i = 0; i < nestedAssetData.length; i++) {
                uint256 assetAllowance = allowance(owner, spender, nestedAssetData[i]);
                if (assetAllowance < lowestAssetAllowance || lowestAssetAllowance == 0) {
                    lowestAssetAllowance = assetAllowance;
                }
            }
            return lowestAssetAllowance;
        } else {
            revert("Unsupported proxy identifier");
        }
    }

    function batchAllowance(address owner, address spender, bytes[] memory assetData)
        public
        view
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](assetData.length);
        for (uint256 i = 0; i < assetData.length; i++) {
            amounts[i] = allowance(owner, spender, assetData[i]);
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

        (tokenAddress, tokenIds, tokenValues, callbackData) = abi.decode( // solhint-disable-line indent
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

        // solhint-disable-next-line indent
        (amounts, nestedAssetData) = abi.decode(LibBytes.slice(assetData, 4, assetData.length), (uint256[], bytes[]));
    }

    /// @dev Calls `token.ownerOf(tokenId)`, but returns a null owner instead of reverting on an unowned token.
    /// @param token Address of ERC721 token.
    /// @param tokenId The identifier for the specific NFT.
    /// @return Owner of tokenId or null address if unowned.
    function getERC721TokenOwner(address token, uint256 tokenId)
        public
        view
        returns (address owner)
    {
        assembly {
            // load free memory pointer
            let cdStart := mload(64)

            // bytes4(keccak256(ownerOf(uint256))) = 0x6352211e
            mstore(cdStart, 0x6352211e00000000000000000000000000000000000000000000000000000000)
            mstore(add(cdStart, 4), tokenId)

            // staticcall `ownerOf(tokenId)`
            // `ownerOf` will revert if tokenId is not owned
            let success := staticcall(
                gas,      // forward all gas
                token,    // call token contract
                cdStart,  // start of calldata
                36,       // length of input is 36 bytes
                cdStart,  // write output over input
                32        // size of output is 32 bytes
            )

            // Success implies that tokenId is owned
            // Copy owner from return data if successful
            if success {
                owner := mload(cdStart)
            }
        }

        // Owner initialized to address(0), no need to modify if call is unsuccessful
        return owner;
    }
}
