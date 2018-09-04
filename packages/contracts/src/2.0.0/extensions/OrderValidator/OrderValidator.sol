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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";
import "../../tokens/ERC20Token/IERC20Token.sol";
import "../../tokens/ERC721Token/IERC721Token.sol";
import "../../utils/LibBytes/LibBytes.sol";


contract OrderValidator {

    using LibBytes for bytes;

    bytes4 constant internal ERC20_DATA_ID = bytes4(keccak256("ERC20Token(address)"));
    bytes4 constant internal ERC721_DATA_ID = bytes4(keccak256("ERC721Token(address,uint256)"));

    struct TraderInfo {
        uint256 makerBalance;       // Maker's balance of makerAsset
        uint256 makerAllowance;     // Maker's allowance to corresponding AssetProxy
        uint256 takerBalance;       // Taker's balance of takerAsset
        uint256 takerAllowance;     // Taker's allowance to corresponding AssetProxy
        uint256 makerZrxBalance;    // Maker's balance of ZRX
        uint256 makerZrxAllowance;  // Maker's allowance of ZRX to ERC20Proxy
        uint256 takerZrxBalance;    // Taker's balance of ZRX
        uint256 takerZrxAllowance;  // Taker's allowance of ZRX to ERC20Proxy
    }

    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    bytes internal ZRX_ASSET_DATA;
    // solhint-enable var-name-mixedcase

    constructor (address _exchange, bytes memory _zrxAssetData)
        public
    {
        EXCHANGE = IExchange(_exchange);
        ZRX_ASSET_DATA = _zrxAssetData;
    }

    /// @dev Fetches information for order and maker/taker of order.
    /// @param order The order structure.
    /// @param takerAddress Address that will be filling the order.
    /// @return OrderInfo and TraderInfo instances for given order.
    function getOrderAndTraderInfo(LibOrder.Order memory order, address takerAddress)
        public
        view
        returns (LibOrder.OrderInfo memory orderInfo, TraderInfo memory traderInfo)
    {
        orderInfo = EXCHANGE.getOrderInfo(order);
        traderInfo = getTraderInfo(order, takerAddress);
        return (orderInfo, traderInfo);
    }

    /// @dev Fetches information for all passed in orders and the makers/takers of each order.
    /// @param orders Array of order specifications.
    /// @param takerAddresses Array of taker addresses corresponding to each order.
    /// @return Arrays of OrderInfo and TraderInfo instances that correspond to each order.
    function getOrdersAndTradersInfo(LibOrder.Order[] memory orders, address[] memory takerAddresses)
        public
        view
        returns (LibOrder.OrderInfo[] memory ordersInfo, TraderInfo[] memory tradersInfo)
    {
        ordersInfo = EXCHANGE.getOrdersInfo(orders);
        tradersInfo = getTradersInfo(orders, takerAddresses);
        return (ordersInfo, tradersInfo);
    }

    /// @dev Fetches balance and allowances for maker and taker of order.
    /// @param order The order structure.
    /// @param takerAddress Address that will be filling the order.
    /// @return Balances and allowances of maker and taker of order.
    function getTraderInfo(LibOrder.Order memory order, address takerAddress)
        public
        view
        returns (TraderInfo memory traderInfo)
    {
        (traderInfo.makerBalance, traderInfo.makerAllowance) = getBalanceAndAllowance(order.makerAddress, order.makerAssetData);
        (traderInfo.takerBalance, traderInfo.takerAllowance) = getBalanceAndAllowance(takerAddress, order.takerAssetData);
        bytes memory zrxAssetData = ZRX_ASSET_DATA;
        (traderInfo.makerZrxBalance, traderInfo.makerZrxAllowance) = getBalanceAndAllowance(order.makerAddress, zrxAssetData);
        (traderInfo.takerZrxBalance, traderInfo.takerZrxAllowance) = getBalanceAndAllowance(takerAddress, zrxAssetData);
        return traderInfo;
    }

    /// @dev Fetches balances and allowances of maker and taker for each provided order.
    /// @param orders Array of order specifications.
    /// @param takerAddresses Array of taker addresses corresponding to each order.
    /// @return Array of balances and allowances for maker and taker of each order.
    function getTradersInfo(LibOrder.Order[] memory orders, address[] memory takerAddresses)
        public
        view
        returns (TraderInfo[] memory)
    {
        uint256 ordersLength = orders.length;
        TraderInfo[] memory tradersInfo = new TraderInfo[](ordersLength);
        for (uint256 i = 0; i != ordersLength; i++) {
            tradersInfo[i] = getTraderInfo(orders[i], takerAddresses[i]);
        }
        return tradersInfo;
    }

    /// @dev Fetches token balances and allowances of an address to given assetProxy. Supports ERC20 and ERC721.
    /// @param target Address to fetch balances and allowances of.
    /// @param assetData Encoded data that can be decoded by a specified proxy contract when transferring asset.
    /// @return Balance of asset and allowance set to given proxy of asset.
    ///         For ERC721 tokens, these values will always be 1 or 0.
    function getBalanceAndAllowance(address target, bytes memory assetData)
        public
        view
        returns (uint256 balance, uint256 allowance)
    {
        bytes4 assetProxyId = assetData.readBytes4(0);
        address token = assetData.readAddress(16);
        address assetProxy = EXCHANGE.getAssetProxy(assetProxyId);

        if (assetProxyId == ERC20_DATA_ID) {
            // Query balance
            balance = IERC20Token(token).balanceOf(target);

            // Query allowance
            allowance = IERC20Token(token).allowance(target, assetProxy);
        } else if (assetProxyId == ERC721_DATA_ID) {
            uint256 tokenId = assetData.readUint256(36);

            // Query owner of tokenId
            address owner = getERC721TokenOwner(token, tokenId);

            // Set balance to 1 if tokenId is owned by target
            balance = target == owner ? 1 : 0;

            // Check if ERC721Proxy is approved to spend tokenId
            bool isApproved = IERC721Token(token).isApprovedForAll(target, assetProxy) || IERC721Token(token).getApproved(tokenId) == assetProxy;
            
            // Set alowance to 1 if ERC721Proxy is approved to spend tokenId
            allowance = isApproved ? 1 : 0;
        } else {
            revert("UNSUPPORTED_ASSET_PROXY");
        }
        return (balance, allowance);
    }

    /// @dev Fetches token balances and allowances of an address for each given assetProxy. Supports ERC20 and ERC721.
    /// @param target Address to fetch balances and allowances of.
    /// @param assetData Array of encoded byte arrays that can be decoded by a specified proxy contract when transferring asset.
    /// @return Balances and allowances of assets.
    ///         For ERC721 tokens, these values will always be 1 or 0.
    function getBalancesAndAllowances(address target, bytes[] memory assetData)
        public
        view
        returns (uint256[] memory, uint256[] memory)
    {
        uint256 length = assetData.length;
        uint256[] memory balances = new uint256[](length);
        uint256[] memory allowances = new uint256[](length);
        for (uint256 i = 0; i != length; i++) {
            (balances[i], allowances[i]) = getBalanceAndAllowance(target, assetData[i]);
        }
        return (balances, allowances);
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
