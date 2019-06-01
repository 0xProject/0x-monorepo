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

pragma solidity ^0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-asset-proxy/contracts/src/libs/LibAssetData.sol";


contract OrderValidationUtils is
    LibAssetData
{
    using LibBytes for bytes;

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
    address internal ERC20_PROXY_ADDRESS;
    // solhint-enable var-name-mixedcase

    constructor (address _exchange, bytes memory _zrxAssetData)
        public
    {
        EXCHANGE = IExchange(_exchange);
        ZRX_ASSET_DATA = _zrxAssetData;
        ERC20_PROXY_ADDRESS = EXCHANGE.getAssetProxy(ERC20_PROXY_ID);
    }

    /// @dev Fetches information for order and maker/taker of order.
    /// @param order The order structure.
    /// @param signature Proof that order has been created by maker.
    /// @param takerAddress Address that will be filling the order.
    /// @return OrderInfo, TraderInfo, and validity of signature for given order.
    function getOrderAndTraderInfo(
        LibOrder.Order memory order,
        bytes memory signature,
        address takerAddress
    )
        public
        view
        returns (
            LibOrder.OrderInfo memory orderInfo,
            TraderInfo memory traderInfo,
            bool isValidSignature
        )
    {
        orderInfo = EXCHANGE.getOrderInfo(order);
        isValidSignature = EXCHANGE.isValidSignature(
            orderInfo.orderHash,
            order.makerAddress,
            signature
        );
        traderInfo = getTraderInfo(order, takerAddress);
        return (orderInfo, traderInfo, isValidSignature);
    }

    /// @dev Fetches information for all passed in orders and the makers/takers of each order.
    /// @param orders Array of order specifications.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param takerAddresses Array of taker addresses corresponding to each order.
    /// @return Arrays of OrderInfo, TraderInfo, and validity of signatures that correspond to each order.
    function getOrdersAndTradersInfo(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        address[] memory takerAddresses
    )
        public
        view
        returns (
            LibOrder.OrderInfo[] memory ordersInfo,
            TraderInfo[] memory tradersInfo,
            bool[] memory isValidSignature
        )
    {
        ordersInfo = EXCHANGE.getOrdersInfo(orders);
        tradersInfo = getTradersInfo(orders, takerAddresses);

        uint256 length = orders.length;
        isValidSignature = new bool[](length);
        for (uint256 i = 0; i != length; i++) {
            isValidSignature[i] = EXCHANGE.isValidSignature(
                ordersInfo[i].orderHash,
                orders[i].makerAddress,
                signatures[i]
            );
        }

        return (ordersInfo, tradersInfo, isValidSignature);
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
        bytes4 makerAssetProxyId = order.makerAssetData.readBytes4(0);
        bytes4 takerAssetProxyId = order.takerAssetData.readBytes4(0);

        (traderInfo.makerBalance, traderInfo.makerAllowance) = getBalanceAndAllowance(
            order.makerAddress,
            EXCHANGE.getAssetProxy(makerAssetProxyId),
            order.makerAssetData
        );
        (traderInfo.takerBalance, traderInfo.takerAllowance) = getBalanceAndAllowance(
            takerAddress,
            EXCHANGE.getAssetProxy(takerAssetProxyId),
            order.takerAssetData
        );
        bytes memory zrxAssetData = ZRX_ASSET_DATA;
        address erc20ProxyAddress = ERC20_PROXY_ADDRESS;
        (traderInfo.makerZrxBalance, traderInfo.makerZrxAllowance) = getBalanceAndAllowance(
            order.makerAddress,
            erc20ProxyAddress,
            zrxAssetData
        );
        (traderInfo.takerZrxBalance, traderInfo.takerZrxAllowance) = getBalanceAndAllowance(
            takerAddress,
            erc20ProxyAddress,
            zrxAssetData
        );
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
}
