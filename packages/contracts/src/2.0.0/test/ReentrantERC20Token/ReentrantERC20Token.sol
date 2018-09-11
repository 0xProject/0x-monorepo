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

import "../../utils/LibBytes/LibBytes.sol";
import "../../tokens/ERC20Token/ERC20Token.sol";
import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";


// solhint-disable no-unused-vars
contract ReentrantERC20Token is
    ERC20Token
{
    using LibBytes for bytes;

    // solhint-disable-next-line var-name-mixedcase
    IExchange internal EXCHANGE;

    bytes internal constant REENTRANCY_ILLEGAL_REVERT_REASON = abi.encodeWithSelector(
        bytes4(keccak256("Error(string)")),
        "REENTRANCY_ILLEGAL"
    );

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
        SET_SIGNATURE_VALIDATOR_APPROVAL
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
        LibOrder.Order memory order;

        // Initialize remaining null parameters
        bytes memory signature;
        LibOrder.Order[] memory orders;
        uint256[] memory takerAssetFillAmounts;
        bytes[] memory signatures;
        bytes memory calldata;

        // Create calldata for function that corresponds to currentFunctionId
        if (currentFunctionId == uint8(ExchangeFunction.FILL_ORDER)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.fillOrder.selector,
                order,
                0,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.FILL_OR_KILL_ORDER)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.fillOrKillOrder.selector,
                order,
                0,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.batchFillOrders.selector,
                orders,
                takerAssetFillAmounts,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_OR_KILL_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.batchFillOrKillOrders.selector,
                orders,
                takerAssetFillAmounts,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_BUY_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.marketBuyOrders.selector,
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_SELL_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.marketSellOrders.selector,
                orders,
                0,
                signatures
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MATCH_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.matchOrders.selector,
                order,
                order,
                signature,
                signature
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDER)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.cancelOrder.selector,
                order
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_CANCEL_ORDERS)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.batchCancelOrders.selector,
                orders
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDERS_UP_TO)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.cancelOrdersUpTo.selector,
                0
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.SET_SIGNATURE_VALIDATOR_APPROVAL)) {
            calldata = abi.encodeWithSelector(
                EXCHANGE.setSignatureValidatorApproval.selector,
                address(0),
                false
            );
        }

        // Call Exchange function, swallow error
        address(EXCHANGE).call(calldata);

        // Revert reason is 100 bytes
        bytes memory returnData = new bytes(100);

        // Copy return data
        assembly {
            returndatacopy(add(returnData, 32), 0, 100)
        }

        // Revert if function reverted with REENTRANCY_ILLEGAL error
        require(!REENTRANCY_ILLEGAL_REVERT_REASON.equals(returnData));

        // Transfer will return true if function failed for any other reason
        return true;
    }
}