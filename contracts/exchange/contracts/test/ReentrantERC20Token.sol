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
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "../src/interfaces/IExchange.sol";
import "../src/interfaces/IAssetProxy.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


// solhint-disable no-unused-vars
contract ReentrantERC20Token is
    ERC20Token
{
    using LibBytes for bytes;

    uint8 constant BATCH_SIZE = 3;

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

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Set the exchange function to reenter.
    /// @param _currentFunctionId A number that corresponds to an entry in the
    ///        ExchangeFunction enum
    function setReentrantFunction(
        uint8 _currentFunctionId
    )
        public
    {
        currentFunctionId = _currentFunctionId;
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
            LibOrder.Order memory order = _createOrders(1)[0];
            callData = abi.encodeWithSelector(
                EXCHANGE.fillOrder.selector,
                order,
                order.takerAssetAmount,
                _createWalletSignatures(1)[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.FILL_OR_KILL_ORDER)) {
            LibOrder.Order memory order = _createOrders(1)[0];
            callData = abi.encodeWithSelector(
                EXCHANGE.fillOrKillOrder.selector,
                order,
                order.takerAssetAmount,
                _createWalletSignatures(1)[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_ORDERS)) {
            LibOrder.Order[] memory orders = _createOrders(BATCH_SIZE);
            callData = abi.encodeWithSelector(
                EXCHANGE.batchFillOrders.selector,
                orders,
                _getTakerFillAmounts(orders),
                _createWalletSignatures(BATCH_SIZE)
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_FILL_OR_KILL_ORDERS)) {
            LibOrder.Order[] memory orders = _createOrders(BATCH_SIZE);
            callData = abi.encodeWithSelector(
                EXCHANGE.batchFillOrKillOrders.selector,
                orders,
                _getTakerFillAmounts(orders),
                _createWalletSignatures(BATCH_SIZE)
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_BUY_ORDERS)) {
            LibOrder.Order[] memory orders = _createOrders(BATCH_SIZE);
            callData = abi.encodeWithSelector(
                EXCHANGE.marketBuyOrders.selector,
                orders,
                _sumTakerFillAmounts(orders),
                _createWalletSignatures(BATCH_SIZE)
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MARKET_SELL_ORDERS)) {
            LibOrder.Order[] memory orders = _createOrders(BATCH_SIZE);
            callData = abi.encodeWithSelector(
                EXCHANGE.marketSellOrders.selector,
                orders,
                _sumTakerFillAmounts(orders),
                _createWalletSignatures(BATCH_SIZE)
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.MATCH_ORDERS)) {
            LibOrder.Order[2] memory orders = _createMatchedOrders();
            bytes[] memory signatures = _createWalletSignatures(2);
            callData = abi.encodeWithSelector(
                EXCHANGE.matchOrders.selector,
                orders[0],
                orders[1],
                signatures[0],
                signatures[1]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDER)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.cancelOrder.selector,
                _createOrders(1)[0]
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.BATCH_CANCEL_ORDERS)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.batchCancelOrders.selector,
                _createOrders(BATCH_SIZE)
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.CANCEL_ORDERS_UP_TO)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.cancelOrdersUpTo.selector,
                1
            );
        } else if (currentFunctionId == uint8(ExchangeFunction.SET_SIGNATURE_VALIDATOR_APPROVAL)) {
            callData = abi.encodeWithSelector(
                EXCHANGE.setSignatureValidatorApproval.selector,
                _getRandomAddress(),
                false
            );
        } else {
            return true;
        }

        // Reset the current function to reenter so we don't do this infinitely.
        currentFunctionId = uint8(ExchangeFunction.NONE);
        // Call Exchange function.
        // Reentrancy guard is lazy-evaluated, so this should succeed.
        (bool success,) = address(EXCHANGE).call(callData);
        require(success);
        return true;
    }

    /// @dev Validates the empty wallet signatures we generate.
    function isValidSignature(
        bytes32 orderHash,
        bytes calldata signature
    )
        external
        pure
        returns (bool)
    {
        // Always return true.
        return true;
    }

    /// @dev Create valid test orders where the maker is set to this contract
    ///      to succeed in cancel* calls.
    function _createOrders(
        uint8 count
    )
        internal
        view
        returns (LibOrder.Order[] memory orders)
    {
        orders = new LibOrder.Order[](count);
        for (uint8 i = 0; i < count; i++) {
            orders[i].makerAddress = address(this);
            orders[i].takerAddress = address(0x0);
            orders[i].feeRecipientAddress = _getRandomAddress();
            orders[i].senderAddress = address(0x0);
            orders[i].makerAssetAmount = 1 ether;
            orders[i].takerAssetAmount = 2 ether;
            orders[i].makerFee = 0;
            orders[i].takerFee = 0;
            orders[i].expirationTimeSeconds = now + 60 * 60 * 24;
            orders[i].salt = now + i;
            orders[i].makerAssetData = _createAssetData();
            orders[i].takerAssetData = _createAssetData();
        }
    }

    /// @dev Create two complementary test orders.
    function _createMatchedOrders()
        internal
        view
        returns (LibOrder.Order[2] memory orders) {

        LibOrder.Order[] memory _orders = _createOrders(2);
        orders[0] = _orders[0];
        orders[1] = _orders[1];
        orders[1].takerAssetAmount = orders[1].makerAssetAmount;
        orders[1].makerAssetAmount = orders[0].takerAssetAmount;
    }

    function _getTakerFillAmounts(
        LibOrder.Order[] memory orders
    )
        internal
        pure
        returns (uint256[] memory amounts)
    {
        amounts = new uint256[](orders.length);
        for (uint8 i = 0; i < orders.length; i++) {
            amounts[i] = orders[i].takerAssetAmount;
        }
    }

    function _sumTakerFillAmounts(
        LibOrder.Order[] memory orders
    )
        internal
        pure
        returns (uint256 total)
    {
        total = 0;
        for (uint8 i = 0; i < orders.length; i++) {
            total += orders[i].takerAssetAmount;
        }
    }

    function _getRandomAddress() internal view returns (address)
    {
        return address(
            bytes20(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number-1), now)
                    )
                )
            );
    }

    /// @dev Create empty wallet-verified signatures.
    function _createWalletSignatures(
        uint8 count
    )
        internal
        returns (bytes[] memory signatures)
    {
        signatures = new bytes[](count);
        for (uint i = 0; i < count; i++) {
            signatures[i] = new bytes(66);
            signatures[i][65] = bytes1(uint8(0x4));
        }
    }

    /// @dev Create asset data that points to this ERC20 contract.
    function _createAssetData() internal view returns (bytes memory assetData){
        assetData = new bytes(36);
        assembly {
            mstore(assetData, 36)
            mstore(add(assetData, 32), 0xf47261b000000000000000000000000000000000000000000000000000000000)
            mstore(add(assetData, 36), address)
        }
        return assetData;
    }
}
