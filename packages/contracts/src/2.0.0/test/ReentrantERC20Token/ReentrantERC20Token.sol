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

import "../../tokens/ERC20Token/ERC20Token.sol";
import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";


contract ReentrantERC20Token is
    ERC20Token
{
    // solhint-disable-next-line var-name-mixedcase
    IExchange internal EXCHANGE;

    // All of these functions are potentially vulnerable to reentrancy
    enum ExchangeFunction {
        FILL_ORDER,
        FILL_OR_KILL_ORDER,
        FILL_ORDER_NO_THROW,
        BATCH_FILL_ORDERS,
        BATCH_FILL_OR_KILL_ORDERS,
        BATCH_FILL_ORDERS_NO_THROW,
        MARKET_BUY_ORDERS,
        MARKET_BUY_ORDERS_NO_THROW,
        MARKET_SELL_ORDERS,
        MARKET_SELL_ORDERS_NO_THROW,
        MATCH_ORDERS
    }

    uint8 internal currentFunctionId = 0;

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Set the current function that will be called when `transferFrom` is called.
    /// @param _currentFunctionId Id that corresponds to function name.
    function setCurrentFunction(uint8 _currentFunctionId)
        external
    {
        currentFunctionId = _currentFunctionId;
    }

    /// @dev A version of `transferFrom` that attempts to reenter the Exchange contract.
    /// @param _from The address of the sender
    /// @param _to The address of the recipient
    /// @param _value The amount of token to be transferred
    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    )
        external
        returns (bool)
    {
        // This order would normally be invalid, but it will be used strictly for testing reentrnacy.
        // Any reentrancy checks will happen before any other checks that invalidate the order.
        LibOrder.Order memory order = LibOrder.Order({
            makerAddress: address(0),
            takerAddress: address(0),
            feeRecipientAddress: address(0),
            senderAddress: address(0),
            makerAssetAmount: 0,
            takerAssetAmount: 0,
            makerFee: 0,
            takerFee: 0,
            expirationTimeSeconds: 0,
            salt: 0,
            makerAssetData: "",
            takerAssetData: ""
        });

        // Initialize remaining null parameters
        bytes memory signature = "";
        LibOrder.Order[] memory orders = new LibOrder.Order[](1);
        orders[0] = order;
        uint256[] memory takerAssetFillAmounts = new uint256[](1);
        takerAssetFillAmounts[0] = 0;
        bytes[] memory signatures = new bytes[](1);
        signatures[0] = signature;
    
        // Attempt to reenter Exchange by calling function with currentFunctionId
        if (currentFunctionId == uint8(ExchangeFunction.FILL_ORDER)) {
            EXCHANGE.fillOrder(
                order,
                0,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.FILL_OR_KILL_ORDER)) {
            EXCHANGE.fillOrKillOrder(
                order,
                0,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.FILL_ORDER_NO_THROW)) {
            EXCHANGE.fillOrderNoThrow(
                order,
                0,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_ORDERS)) {
            EXCHANGE.batchFillOrders(
                orders,
                takerAssetFillAmounts,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_OR_KILL_ORDERS)) {
            EXCHANGE.batchFillOrKillOrders(
                orders,
                takerAssetFillAmounts,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_ORDERS_NO_THROW)) {
            EXCHANGE.batchFillOrdersNoThrow(
                orders,
                takerAssetFillAmounts,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_BUY_ORDERS)) {
            EXCHANGE.marketBuyOrders(
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_BUY_ORDERS_NO_THROW)) {
            EXCHANGE.marketBuyOrdersNoThrow(
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_SELL_ORDERS)) {
            EXCHANGE.marketSellOrders(
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_SELL_ORDERS_NO_THROW)) {
            EXCHANGE.marketSellOrdersNoThrow(
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MATCH_ORDERS)) {
            EXCHANGE.matchOrders(
                order,
                order,
                signature,
                signature
            );
        }
        return true;
    }
}