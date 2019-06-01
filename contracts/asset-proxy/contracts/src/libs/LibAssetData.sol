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
import "./LibAssetProxyIds.sol";


contract LibAssetData is
    LibAssetProxyIds
{
    uint256 constant internal _MAX_UINT256 = uint256(-1);

    using LibBytes for bytes;

    /// @dev Returns the owner's balance of the token(s) specified in
    ///     assetData.  When the asset data contains multiple tokens (eg in
    ///     ERC1155 or Multi-Asset), the return value indicates how many
    ///     complete "baskets" of those tokens are owned by owner.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param assetData Description of tokens, per the AssetProxy contract
    ///     specification.
    /// @return Number of tokens (or token baskets) held by owner.
    function getBalance(address owner, bytes memory assetData)
        public
        view
        returns (uint256 balance)
    {
        bytes4 proxyId = assetData.readBytes4(0);

        if (proxyId == ERC20_PROXY_ID) {
            address tokenAddress = assetData.readAddress(16);
            balance = IERC20Token(tokenAddress).balanceOf(owner);
        } else if (proxyId == ERC721_PROXY_ID) {
            (, address tokenAddress, uint256 tokenId) = decodeERC721AssetData(assetData);
            balance = getERC721TokenOwner(tokenAddress, tokenId) == owner ? 1 : 0;
        } else if (proxyId == ERC1155_PROXY_ID) {
            (
                ,
                address tokenAddress,
                uint256[] memory tokenIds,
                uint256[] memory tokenValues,
            ) = decodeERC1155AssetData(assetData);
            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 totalBalance = IERC1155(tokenAddress).balanceOf(owner, tokenIds[i]);
                uint256 scaledBalance = totalBalance / tokenValues[i];
                if (scaledBalance < balance || balance == 0) {
                    balance = scaledBalance;
                }
            }
        } else if (proxyId == MULTI_ASSET_PROXY_ID) {
            (
                ,
                uint256[] memory assetAmounts,
                bytes[] memory nestedAssetData
            ) = decodeMultiAssetData(assetData);
            for (uint256 i = 0; i < nestedAssetData.length; i++) {
                uint256 totalBalance = getBalance(owner, nestedAssetData[i]);
                uint256 scaledBalance = totalBalance / assetAmounts[i];
                if (scaledBalance < balance || balance == 0) {
                    balance = scaledBalance;
                }
            }
        } else {
            revert("UNSUPPORTED_PROXY_ID");
        }

        return balance;
    }

    /// @dev Calls getBalance() for each element of assetData.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param assetData Array of token descriptors, each encoded per the
    ///     AssetProxy contract specification.
    /// @return Array of token balances from getBalance(), with each element
    ///     corresponding to the same-indexed element in the assetData input.
    function getBatchBalances(address owner, bytes[] memory assetData)
        public
        view
        returns (uint256[] memory balances)
    {
        uint256 length = assetData.length;
        balances = new uint256[](length);
        for (uint256 i = 0; i != length; i++) {
            balances[i] = getBalance(owner, assetData[i]);
        }
        return balances;
    }

    /// @dev Returns the number of token(s) (described by assetData) that
    ///     spender is authorized to spend.  When the asset data contains
    ///     multiple tokens (eg for Multi-Asset), the return value indicates
    ///     how many complete "baskets" of those tokens may be spent by spender.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param spender Address whose authority to spend is in question.
    /// @param assetData Description of tokens, per the AssetProxy contract
    ///     specification.
    /// @return Number of tokens (or token baskets) that the spender is
    ///     authorized to spend.
    function getAllowance(
        address owner,
        address spender,
        bytes memory assetData
    )
        public
        view
        returns (uint256 allowance)
    {
        bytes4 proxyId = assetData.readBytes4(0);

        if (proxyId == ERC20_PROXY_ID) {
            address tokenAddress = assetData.readAddress(16);
            allowance = IERC20Token(tokenAddress).allowance(owner, spender);
        } else if (proxyId == ERC721_PROXY_ID) {
            (, address tokenAddress, uint256 tokenId) = decodeERC721AssetData(assetData);
            IERC721Token token = IERC721Token(tokenAddress);
            if (token.isApprovedForAll(owner, spender)) {
                allowance = _MAX_UINT256;
            } else if (token.getApproved(tokenId) == spender) {
                allowance = 1;
            }
        } else if (proxyId == ERC1155_PROXY_ID) {
            (, address tokenAddress, , , ) = decodeERC1155AssetData(assetData);
            allowance = IERC1155(tokenAddress).isApprovedForAll(owner, spender) ? _MAX_UINT256 : 0;
        } else if (proxyId == MULTI_ASSET_PROXY_ID) {
            (
                ,
                uint256[] memory amounts,
                bytes[] memory nestedAssetData
            ) = decodeMultiAssetData(assetData);
            for (uint256 i = 0; i < nestedAssetData.length; i++) {
                uint256 totalAllowance = getAllowance(
                    owner,
                    spender,
                    nestedAssetData[i]
                );
                uint256 scaledAllowance = totalAllowance / amounts[i];
                if (scaledAllowance < allowance || allowance == 0) {
                    allowance = scaledAllowance;
                }
            }
        } else {
            revert("UNSUPPORTED_PROXY_ID");
        }

        return allowance;
    }

    /// @dev Calls getAllowance() for each element of assetData.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param spenders Array of addresses whose authority to spend is in question for each corresponding assetData.
    /// @param assetData Description of tokens, per the AssetProxy contract
    ///     specification.
    /// @return An array of token allowances from getAllowance(), with each
    ///     element corresponding to the same-indexed element in the assetData
    ///     input.
    function getBatchAllowances(
        address owner,
        address[] memory spenders,
        bytes[] memory assetData
    )
        public
        view
        returns (uint256[] memory allowances)
    {
        uint256 length = assetData.length;
        allowances = new uint256[](length);
        for (uint256 i = 0; i != length; i++) {
            allowances[i] = getAllowance(owner, spenders[i], assetData[i]);
        }
        return allowances;
    }

    /// @dev Calls getBalance() and getAllowance() for assetData.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param spender Address whose authority to spend is in question.
    /// @param assetData Description of tokens, per the AssetProxy contract
    ///     specification.
    /// @return Number of tokens (or token baskets) held by owner, and number
    ///     of tokens (or token baskets) that the spender is authorized to
    ///     spend.
    function getBalanceAndAllowance(
        address owner,
        address spender,
        bytes memory assetData
    )
        public
        view
        returns (uint256 balance, uint256 allowance)
    {
        balance = getBalance(owner, assetData);
        allowance = getAllowance(owner, spender, assetData);
        return (balance, allowance);
    }

    /// @dev Calls getBatchBalances() and getBatchAllowances() for each element
    ///     of assetData.
    /// @param owner Owner of the tokens specified by assetData.
    /// @param spenders Array of addresses whose authority to spend is in question for each corresponding assetData.
    /// @param assetData Description of tokens, per the AssetProxy contract
    ///     specification.
    /// @return An array of token balances from getBalance(), and an array of
    ///     token allowances from getAllowance(), with each element
    ///     corresponding to the same-indexed element in the assetData input.
    function getBatchBalancesAndAllowances(
        address owner,
        address[] memory spenders,
        bytes[] memory assetData
    )
        public
        view
        returns (
            uint256[] memory balances,
            uint256[] memory allowances
        )
    {
        balances = getBatchBalances(owner, assetData);
        allowances = getBatchAllowances(owner, spenders, assetData);
        return (balances, allowances);
    }

    /// @dev Encode ERC-20 asset data into the format described in the
    ///     AssetProxy contract specification.
    /// @param tokenAddress The address of the ERC-20 contract hosting the
    ///     token to be traded.
    /// @return AssetProxy-compliant data describing the asset.
    function encodeERC20AssetData(address tokenAddress)
        public
        pure
        returns (bytes memory assetData)
    {
        assetData = abi.encodeWithSelector(ERC20_PROXY_ID, tokenAddress);
        return assetData;
    }

    /// @dev Decode ERC-20 asset data from the format described in the
    ///     AssetProxy contract specification.
    /// @param assetData AssetProxy-compliant asset data describing an ERC-20
    ///     asset.
    /// @return The ERC-20 AssetProxy identifier, and the address of the ERC-20
    ///     contract hosting this asset.
    function decodeERC20AssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            address tokenAddress
        )
    {
        proxyId = assetData.readBytes4(0);

        require(
            proxyId == ERC20_PROXY_ID,
            "WRONG_PROXY_ID"
        );

        tokenAddress = assetData.readAddress(16);
        return (proxyId, tokenAddress);
    }

    /// @dev Encode ERC-721 asset data into the format described in the
    ///     AssetProxy specification.
    /// @param tokenAddress The address of the ERC-721 contract hosting the
    ///     token to be traded.
    /// @param tokenId The identifier of the specific token to be traded.
    /// @return AssetProxy-compliant asset data describing the asset.
    function encodeERC721AssetData(
        address tokenAddress,
        uint256 tokenId
    )
        public
        pure
        returns (bytes memory assetData)
    {
        assetData = abi.encodeWithSelector(
            ERC721_PROXY_ID,
            tokenAddress,
            tokenId
        );
        return assetData;
    }

    /// @dev Decode ERC-721 asset data from the format described in the
    ///     AssetProxy contract specification.
    /// @param assetData AssetProxy-compliant asset data describing an ERC-721
    ///     asset.
    /// @return The ERC-721 AssetProxy identifier, the address of the ERC-721
    ///     contract hosting this asset, and the identifier of the specific
    ///     token to be traded.
    function decodeERC721AssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            address tokenAddress,
            uint256 tokenId
        )
    {
        proxyId = assetData.readBytes4(0);

        require(
            proxyId == ERC721_PROXY_ID,
            "WRONG_PROXY_ID"
        );

        tokenAddress = assetData.readAddress(16);
        tokenId = assetData.readUint256(36);
        return (proxyId, tokenAddress, tokenId);
    }

    /// @dev Encode ERC-1155 asset data into the format described in the
    ///     AssetProxy contract specification.
    /// @param tokenAddress The address of the ERC-1155 contract hosting the
    ///     token(s) to be traded.
    /// @param tokenIds The identifiers of the specific tokens to be traded.
    /// @param tokenValues The amounts of each token to be traded.
    /// @param callbackData ...
    /// @return AssetProxy-compliant asset data describing the set of assets.
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
        assetData = abi.encodeWithSelector(
            ERC1155_PROXY_ID,
            tokenAddress,
            tokenIds,
            tokenValues,
            callbackData
        );
        return assetData;
    }

    /// @dev Decode ERC-1155 asset data from the format described in the
    ///     AssetProxy contract specification.
    /// @param assetData AssetProxy-compliant asset data describing an ERC-1155
    ///     set of assets.
    /// @return The ERC-1155 AssetProxy identifier, the address of the ERC-1155
    ///     contract hosting the assets, an array of the identifiers of the
    ///     tokens to be traded, an array of token amounts to be traded, and
    ///     callback data.  Each element of the arrays corresponds to the
    ///     same-indexed element of the other array.  Return values specified as
    ///     `memory` are returned as pointers to locations within the memory of
    ///     the input parameter `assetData`.
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
        proxyId = assetData.readBytes4(0);

        require(
            proxyId == ERC1155_PROXY_ID,
            "WRONG_PROXY_ID"
        );

        assembly {
            // Skip selector and length to get to the first parameter:
            assetData := add(assetData, 36)
            // Read the value of the first parameter:
            tokenAddress := mload(assetData)
            // Point to the next parameter's data:
            tokenIds := add(assetData, mload(add(assetData, 32)))
            // Point to the next parameter's data:
            tokenValues := add(assetData, mload(add(assetData, 64)))
            // Point to the next parameter's data:
            callbackData := add(assetData, mload(add(assetData, 96)))
        }

        return (
            proxyId,
            tokenAddress,
            tokenIds,
            tokenValues,
            callbackData
        );
    }

    /// @dev Encode data for multiple assets, per the AssetProxy contract
    ///     specification.
    /// @param amounts The amounts of each asset to be traded.
    /// @param nestedAssetData AssetProxy-compliant data describing each asset
    ///     to be traded.
    /// @return AssetProxy-compliant data describing the set of assets.
    function encodeMultiAssetData(
        uint256[] memory amounts,
        bytes[] memory nestedAssetData
    )
        public
        pure
        returns (bytes memory assetData)
    {
        assetData = abi.encodeWithSelector(
            MULTI_ASSET_PROXY_ID,
            amounts,
            nestedAssetData
        );
        return assetData;
    }

    /// @dev Decode multi-asset data from the format described in the
    ///     AssetProxy contract specification.
    /// @param assetData AssetProxy-compliant data describing a multi-asset
    ///     basket.
    /// @return The Multi-Asset AssetProxy identifier, an array of the amounts
    ///     of the assets to be traded, and an array of the
    ///     AssetProxy-compliant data describing each asset to be traded.  Each
    ///     element of the arrays corresponds to the same-indexed element of
    ///     the other array.
    function decodeMultiAssetData(bytes memory assetData)
        public
        pure
        returns (
            bytes4 proxyId,
            uint256[] memory amounts,
            bytes[] memory nestedAssetData
        )
    {
        proxyId = assetData.readBytes4(0);

        require(
            proxyId == MULTI_ASSET_PROXY_ID,
            "WRONG_PROXY_ID"
        );

        // solhint-disable indent
        (amounts, nestedAssetData) = abi.decode(
            assetData.slice(4, assetData.length),
            (uint256[], bytes[])
        );
        // solhint-enable indent
    }

    /// @dev Calls `token.ownerOf(tokenId)`, but returns a null owner instead of reverting on an unowned token.
    /// @param tokenAddress Address of ERC721 token.
    /// @param tokenId The identifier for the specific NFT.
    /// @return Owner of tokenId or null address if unowned.
    function getERC721TokenOwner(address tokenAddress, uint256 tokenId)
        public
        view
        returns (address owner)
    {
        bytes memory ownerOfCalldata = abi.encodeWithSelector(
            0x6352211e,
            tokenId
        );

        (bool success, bytes memory returnData) = tokenAddress.staticcall(ownerOfCalldata);

        owner = (success && returnData.length == 32) ? returnData.readAddress(12) : address(0);
        return owner;
    }
}
