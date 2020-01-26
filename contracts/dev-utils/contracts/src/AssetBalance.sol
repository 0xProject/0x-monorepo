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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-erc721/contracts/src/interfaces/IERC721Token.sol";
import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IChai.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "./Addresses.sol";
import "./LibDydxBalance.sol";


contract AssetBalance is
    Addresses
{
    // 2^256 - 1
    uint256 constant internal _MAX_UINT256 = uint256(-1);

    using LibBytes for bytes;

    /// @dev Returns the owner's balance of the assets(s) specified in
    /// assetData.  When the asset data contains multiple assets (eg in
    /// ERC1155 or Multi-Asset), the return value indicates how many
    /// complete "baskets" of those assets are owned by owner.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Details of asset, encoded per the AssetProxy contract specification.
    /// @return Number of assets (or asset baskets) held by owner.
    function getBalance(address ownerAddress, bytes memory assetData)
        public
        returns (uint256 balance)
    {
        // Get id of AssetProxy contract
        bytes4 assetProxyId = assetData.readBytes4(0);

        if (assetProxyId == IAssetData(address(0)).ERC20Token.selector) {
            // Get ERC20 token address
            address tokenAddress = assetData.readAddress(16);
            balance = LibERC20Token.balanceOf(tokenAddress, ownerAddress);

        } else if (assetProxyId == IAssetData(address(0)).ERC721Token.selector) {
            // Get ERC721 token address and id
            (, address tokenAddress, uint256 tokenId) = LibAssetData.decodeERC721AssetData(assetData);

            // Check if id is owned by ownerAddress
            bytes memory ownerOfCalldata = abi.encodeWithSelector(
                IERC721Token(address(0)).ownerOf.selector,
                tokenId
            );

            (bool success, bytes memory returnData) = tokenAddress.staticcall(ownerOfCalldata);
            address currentOwnerAddress = (success && returnData.length == 32) ? returnData.readAddress(12) : address(0);
            balance = currentOwnerAddress == ownerAddress ? 1 : 0;

        } else if (assetProxyId == IAssetData(address(0)).ERC1155Assets.selector) {
            // Get ERC1155 token address, array of ids, and array of values
            (, address tokenAddress, uint256[] memory tokenIds, uint256[] memory tokenValues,) = LibAssetData.decodeERC1155AssetData(assetData);

            uint256 length = tokenIds.length;
            for (uint256 i = 0; i != length; i++) {
                // Skip over the token if the corresponding value is 0.
                if (tokenValues[i] == 0) {
                    continue;
                }

                // Encode data for `balanceOf(ownerAddress, tokenIds[i])
                bytes memory balanceOfData = abi.encodeWithSelector(
                    IERC1155(address(0)).balanceOf.selector,
                    ownerAddress,
                    tokenIds[i]
                );

                // Query balance
                (bool success, bytes memory returnData) = tokenAddress.staticcall(balanceOfData);
                uint256 totalBalance = success && returnData.length == 32 ? returnData.readUint256(0) : 0;

                // Scale total balance down by corresponding value in assetData
                uint256 scaledBalance = totalBalance / tokenValues[i];
                if (scaledBalance == 0) {
                    return 0;
                }
                if (scaledBalance < balance || balance == 0) {
                    balance = scaledBalance;
                }
            }

        } else if (assetProxyId == IAssetData(address(0)).StaticCall.selector) {
            // Encode data for `staticCallProxy.transferFrom(assetData,...)`
            bytes memory transferFromData = abi.encodeWithSelector(
                IAssetProxy(address(0)).transferFrom.selector,
                assetData,
                address(0),  // `from` address is not used
                address(0),  // `to` address is not used
                0            // `amount` is not used
            );

            // Check if staticcall would be successful
            (bool success,) = staticCallProxyAddress.staticcall(transferFromData);

            // Success means that the staticcall can be made an unlimited amount of times
            balance = success ? _MAX_UINT256 : 0;

        } else if (assetProxyId == IAssetData(address(0)).ERC20Bridge.selector) {
            // Get address of ERC20 token and bridge contract
            (, address tokenAddress, address bridgeAddress, ) = LibAssetData.decodeERC20BridgeAssetData(assetData);
            if (tokenAddress == _getDaiAddress() && bridgeAddress == chaiBridgeAddress) {
                uint256 chaiBalance = LibERC20Token.balanceOf(_getChaiAddress(), ownerAddress);
                // Calculate Dai balance
                balance = _convertChaiToDaiAmount(chaiBalance);
            }
            // Balance will be 0 if bridge is not supported

        } else if (assetProxyId == IAssetData(address(0)).MultiAsset.selector) {
            // Get array of values and array of assetDatas
            (, uint256[] memory assetAmounts, bytes[] memory nestedAssetData) = LibAssetData.decodeMultiAssetData(assetData);

            uint256 length = nestedAssetData.length;
            for (uint256 i = 0; i != length; i++) {
                // Skip over the asset if the corresponding amount is 0.
                if (assetAmounts[i] == 0) {
                    continue;
                }

                // Query balance of individual assetData
                uint256 totalBalance = getBalance(ownerAddress, nestedAssetData[i]);

                // Scale total balance down by corresponding value in assetData
                uint256 scaledBalance = totalBalance / assetAmounts[i];
                if (scaledBalance == 0) {
                    return 0;
                }
                if (scaledBalance < balance || balance == 0) {
                    balance = scaledBalance;
                }
            }
        }

        // Balance will be 0 if assetProxyId is unknown
        return balance;
    }

    /// @dev Calls getBalance() for each element of assetData.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Array of asset details, each encoded per the AssetProxy contract specification.
    /// @return Array of asset balances from getBalance(), with each element
    /// corresponding to the same-indexed element in the assetData input.
    function getBatchBalances(address ownerAddress, bytes[] memory assetData)
        public
        returns (uint256[] memory balances)
    {
        uint256 length = assetData.length;
        balances = new uint256[](length);
        for (uint256 i = 0; i != length; i++) {
            balances[i] = getBalance(ownerAddress, assetData[i]);
        }
        return balances;
    }

    /// @dev Returns the number of asset(s) (described by assetData) that
    /// the corresponding AssetProxy contract is authorized to spend.  When the asset data contains
    /// multiple assets (eg for Multi-Asset), the return value indicates
    /// how many complete "baskets" of those assets may be spent by all of the corresponding
    /// AssetProxy contracts.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Details of asset, encoded per the AssetProxy contract specification.
    /// @return Number of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
    function getAssetProxyAllowance(address ownerAddress, bytes memory assetData)
        public
        returns (uint256 allowance)
    {
        // Get id of AssetProxy contract
        bytes4 assetProxyId = assetData.readBytes4(0);

        if (assetProxyId == IAssetData(address(0)).MultiAsset.selector) {
            // Get array of values and array of assetDatas
            (, uint256[] memory amounts, bytes[] memory nestedAssetData) = LibAssetData.decodeMultiAssetData(assetData);

            uint256 length = nestedAssetData.length;
            for (uint256 i = 0; i != length; i++) {
                // Skip over the asset if the corresponding amount is 0.
                if (amounts[i] == 0) {
                    continue;
                }

                // Query allowance of individual assetData
                uint256 totalAllowance = getAssetProxyAllowance(ownerAddress, nestedAssetData[i]);

                // Scale total allowance down by corresponding value in assetData
                uint256 scaledAllowance = totalAllowance / amounts[i];
                if (scaledAllowance == 0) {
                    return 0;
                }
                if (scaledAllowance < allowance || allowance == 0) {
                    allowance = scaledAllowance;
                }
            }
            return allowance;
        }

        if (assetProxyId == IAssetData(address(0)).ERC20Token.selector) {
            // Get ERC20 token address
            address tokenAddress = assetData.readAddress(16);
            allowance = LibERC20Token.allowance(tokenAddress, ownerAddress, erc20ProxyAddress);

        } else if (assetProxyId == IAssetData(address(0)).ERC721Token.selector) {
            // Get ERC721 token address and id
            (, address tokenAddress, uint256 tokenId) = LibAssetData.decodeERC721AssetData(assetData);

            // Encode data for `isApprovedForAll(ownerAddress, erc721ProxyAddress)`
            bytes memory isApprovedForAllData = abi.encodeWithSelector(
                IERC721Token(address(0)).isApprovedForAll.selector,
                ownerAddress,
                erc721ProxyAddress
            );

            (bool success, bytes memory returnData) = tokenAddress.staticcall(isApprovedForAllData);

            // If not approved for all, call `getApproved(tokenId)`
            if (!success || returnData.length != 32 || returnData.readUint256(0) != 1) {
                // Encode data for `getApproved(tokenId)`
                bytes memory getApprovedData = abi.encodeWithSelector(IERC721Token(address(0)).getApproved.selector, tokenId);
                (success, returnData) = tokenAddress.staticcall(getApprovedData);

                // Allowance is 1 if successful and the approved address is the ERC721Proxy
                allowance = success && returnData.length == 32 && returnData.readAddress(12) == erc721ProxyAddress ? 1 : 0;
            } else {
                // Allowance is 2^256 - 1 if `isApprovedForAll` returned true
                allowance = _MAX_UINT256;
            }

        } else if (assetProxyId == IAssetData(address(0)).ERC1155Assets.selector) {
            // Get ERC1155 token address
            (, address tokenAddress, , , ) = LibAssetData.decodeERC1155AssetData(assetData);

            // Encode data for `isApprovedForAll(ownerAddress, erc1155ProxyAddress)`
            bytes memory isApprovedForAllData = abi.encodeWithSelector(
                IERC1155(address(0)).isApprovedForAll.selector,
                ownerAddress,
                erc1155ProxyAddress
            );

            // Query allowance
            (bool success, bytes memory returnData) = tokenAddress.staticcall(isApprovedForAllData);
            allowance = success && returnData.length == 32 && returnData.readUint256(0) == 1 ? _MAX_UINT256 : 0;

        } else if (assetProxyId == IAssetData(address(0)).StaticCall.selector) {
            // The StaticCallProxy does not require any approvals
            allowance = _MAX_UINT256;

        } else if (assetProxyId == IAssetData(address(0)).ERC20Bridge.selector) {
            // Get address of ERC20 token and bridge contract
            (, address tokenAddress, address bridgeAddress,) = LibAssetData.decodeERC20BridgeAssetData(assetData);
            if (tokenAddress == _getDaiAddress() && bridgeAddress == chaiBridgeAddress) {
                uint256 chaiAllowance = LibERC20Token.allowance(_getChaiAddress(), ownerAddress, chaiBridgeAddress);
                // Dai allowance is unlimited if Chai allowance is unlimited
                allowance = chaiAllowance == _MAX_UINT256 ? _MAX_UINT256 : _convertChaiToDaiAmount(chaiAllowance);
            } else if (bridgeAddress == dydxBridgeAddress) {
                // Dydx bridges always have infinite allowance.
                allowance = _MAX_UINT256;
            }
            // Allowance will be 0 if bridge is not supported
        }

        // Allowance will be 0 if the assetProxyId is unknown
        return allowance;
    }

    /// @dev Calls getAssetProxyAllowance() for each element of assetData.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Array of asset details, each encoded per the AssetProxy contract specification.
    /// @return An array of asset allowances from getAllowance(), with each
    /// element corresponding to the same-indexed element in the assetData input.
    function getBatchAssetProxyAllowances(address ownerAddress, bytes[] memory assetData)
        public
        returns (uint256[] memory allowances)
    {
        uint256 length = assetData.length;
        allowances = new uint256[](length);
        for (uint256 i = 0; i != length; i++) {
            allowances[i] = getAssetProxyAllowance(ownerAddress, assetData[i]);
        }
        return allowances;
    }

    /// @dev Calls getBalance() and getAllowance() for assetData.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Details of asset, encoded per the AssetProxy contract specification.
    /// @return Number of assets (or asset baskets) held by owner, and number
    /// of assets (or asset baskets) that the corresponding AssetProxy is authorized to spend.
    function getBalanceAndAssetProxyAllowance(
        address ownerAddress,
        bytes memory assetData
    )
        public
        returns (uint256 balance, uint256 allowance)
    {
        balance = getBalance(ownerAddress, assetData);
        allowance = getAssetProxyAllowance(ownerAddress, assetData);
        return (balance, allowance);
    }

    /// @dev Calls getBatchBalances() and getBatchAllowances() for each element of assetData.
    /// @param ownerAddress Owner of the assets specified by assetData.
    /// @param assetData Array of asset details, each encoded per the AssetProxy contract specification.
    /// @return An array of asset balances from getBalance(), and an array of
    /// asset allowances from getAllowance(), with each element
    /// corresponding to the same-indexed element in the assetData input.
    function getBatchBalancesAndAssetProxyAllowances(
        address ownerAddress,
        bytes[] memory assetData
    )
        public
        returns (uint256[] memory balances, uint256[] memory allowances)
    {
        balances = getBatchBalances(ownerAddress, assetData);
        allowances = getBatchAssetProxyAllowances(ownerAddress, assetData);
        return (balances, allowances);
    }

    /// @dev Converts an amount of Chai into its equivalent Dai amount.
    ///      Also accumulates Dai from DSR if called after the last time it was collected.
    /// @param chaiAmount Amount of Chai to converts.
    function _convertChaiToDaiAmount(uint256 chaiAmount)
        internal
        returns (uint256 daiAmount)
    {
        PotLike pot = IChai(_getChaiAddress()).pot();
        // Accumulate savings if called after last time savings were collected
        // solhint-disable-next-line not-rely-on-time
        uint256 chiMultiplier = (now > pot.rho())
            ? pot.drip()
            : pot.chi();
        daiAmount = LibMath.getPartialAmountFloor(chiMultiplier, 10**27, chaiAmount);
        return daiAmount;
    }

    /// @dev Returns an order MAKER's balance of the assets(s) specified in
    ///      makerAssetData. Unlike `getBalanceAndAssetProxyAllowance()`, this
    ///      can handle maker asset types that depend on taker tokens being
    ///      transferred to the maker first.
    /// @param order The order.
    /// @return balance Quantity of assets transferrable from maker to taker.
    function _getConvertibleMakerBalanceAndAssetProxyAllowance(
        LibOrder.Order memory order
    )
        internal
        returns (uint256 balance, uint256 allowance)
    {
        if (order.makerAssetData.length < 4) {
            return (0, 0);
        }
        bytes4 assetProxyId = order.makerAssetData.readBytes4(0);
        // Handle dydx bridge assets.
        if (assetProxyId == IAssetData(address(0)).ERC20Bridge.selector) {
            (, , address bridgeAddress, ) = LibAssetData.decodeERC20BridgeAssetData(order.makerAssetData);
            if (bridgeAddress == dydxBridgeAddress) {
                return (
                    LibDydxBalance.getDydxMakerBalance(order, dydxBridgeAddress),
                    _MAX_UINT256
                );
            }
        }
        return (
            getBalance(order.makerAddress, order.makerAssetData),
            getAssetProxyAllowance(order.makerAddress, order.makerAssetData)
        );
    }
}
