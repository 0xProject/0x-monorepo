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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-erc20/contracts/src/ERC20Token.sol";
import "../src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// solhint-disable no-unused-vars
contract ReentrantERC20Token is
    ERC20Token
{
    using LibBytes for bytes;

    // solhint-disable-next-line var-name-mixedcase
    IExchange internal EXCHANGE;

    // All of these functions are potentially vulnerable to reentrancy
    // We do not test any "noThrow" functions because `fillOrderNoThrow` makes a delegatecall to `fillOrder`
    enum ExchangeFunction {
        FILL_ORDER,
        FILL_OR_KILL_ORDER,
        BATCH_FILL_ORDERS,
        BATCH_FILL_OR_KILL_ORDERS,
        MARKET_BUY_ORDERS,
        MARKET_SELL_ORDERS,
        MATCH_ORDERS,
        CANCEL_ORDER,
        BATCH_CANCEL_ORDERS,
        CANCEL_ORDERS_UP_TO,
        SET_SIGNATURE_VALIDATOR_APPROVAL,
        NONE
    }

    uint8 internal currentFunctionId = 0;
    LibOrder.Order[2] internal orders;
    bytes[2] internal signatures;

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Set the reentrancy params.
    ///      Because reentrancy is lazily-checked (at the end of the transaction),
    ///      all parameters must be valid in so only the reentrancy revert occurs,
    ///      as opposed to something like an invalid fill error.
    ///      Additionally, these should be distinct from the exchange paramaters
    ///      used to initiate the reentrancy attack.
    /// @param _currentFunctionId Id that corresponds to function name.
    /// @param _orders Order to pass to functions.
    /// @param _signatures Signature for the maker of each order in _orders
    function setUpUsTheBomb(
        uint8 _currentFunctionId,
        LibOrder.Order[2] memory _orders,
        bytes[2] memory _signature
    )
        public
    {
        currentFunctionId = _currentFunctionId;
        for (uint32 i = 0; i < 2; i++) {
            orders[i] = _orders[i];
            signatures[i] = _signatures[i];
        }
    }

    /// @dev A version of `transferFrom` that attempts to reenter the Exchange contract
    ///      once.
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
        bytes memory callData;

        // Create callData for function that corresponds to currentFunctionId
        if (currentFunctionId == uint8(ExchangeFunction.FILL_ORDER)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.fillOrder.selector,
                orders[0],
                orders[0].takerAssetAmount,
                signatures[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.FILL_OR_KILL_ORDER)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.fillOrKillOrder.selector,
                orders[0],
                orders[0].takerAssetAmount,
                signatures[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.batchFillOrders.selector,
                orders,
                orders[0].takerAssetFillAmount + orders[1].takerAssetFillAmount,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_OR_KILL_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.batchFillOrKillOrders.selector,
                orders[0],
                orders[0].takerAssetFillAmount + orders[1].takerAssetFillAmount,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_BUY_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.marketBuyOrders.selector,
                orders,
                orders[0].takerAssetFillAmount + orders[1].takerAssetFillAmount,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_SELL_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.marketSellOrders.selector,
                orders,
                orders[0].takerAssetFillAmount + orders[1].takerAssetFillAmount,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MATCH_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.matchOrders.selector,
                orders[0],
                order[1],
                signature[0],
                signature[1]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDER)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.cancelOrder.selector,
                orders[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_CANCEL_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.batchCancelOrders.selector,
                orders
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDERS_UP_TO)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.cancelOrdersUpTo.selector,
                orders[1].salt
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.SET_SIGNATURE_VALIDATOR_APPROVAL)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.setSignatureValidatorApproval.selector,
                address(0),
                false
            );
        }

        if (callData.length > 0) {
            // Reset the current function to reenter so we don't do this infinitely.
            currentFunctionId = uint8(ExchangeFunction.NONE);
            // Call Exchange function.
            // Reentrancy guard is lazy-evaluated, so this will succeed.
            address(EXCHANGE).call(callData);
        }

        // Always succeed.
        return true;
    }
}
