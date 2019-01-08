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

pragma solidity ^0.4.24;


contract LibExchangeSelectors {

    // solhint-disable max-line-length
    // allowedValidators
    bytes4 constant public ALLOWED_VALIDATORS_SELECTOR = 0x7b8e3514;
    bytes4 constant public ALLOWED_VALIDATORS_SELECTOR_GENERATOR = bytes4(keccak256("allowedValidators(address,address)"));

    // assetProxies
    bytes4 constant public ASSET_PROXIES_SELECTOR = 0x3fd3c997;
    bytes4 constant public ASSET_PROXIES_SELECTOR_GENERATOR = bytes4(keccak256("assetProxies(bytes4)"));

    // batchCancelOrders
    bytes4 constant public BATCH_CANCEL_ORDERS_SELECTOR = 0x4ac14782;
    bytes4 constant public BATCH_CANCEL_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])"));

    // batchFillOrKillOrders
    bytes4 constant public BATCH_FILL_OR_KILL_ORDERS_SELECTOR = 0x4d0ae546;
    bytes4 constant public BATCH_FILL_OR_KILL_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])"));

    // batchFillOrders
    bytes4 constant public BATCH_FILL_ORDERS_SELECTOR = 0x297bb70b;
    bytes4 constant public BATCH_FILL_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])"));

    // batchFillOrdersNoThrow
    bytes4 constant public BATCH_FILL_ORDERS_NO_THROW_SELECTOR = 0x50dde190;
    bytes4 constant public BATCH_FILL_ORDERS_NO_THROW_SELECTOR_GENERATOR = bytes4(keccak256("batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])"));

    // cancelOrder
    bytes4 constant public CANCEL_ORDER_SELECTOR = 0xd46b02c3;
    bytes4 constant public CANCEL_ORDER_SELECTOR_GENERATOR = bytes4(keccak256("cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))"));

    // cancelOrdersUpTo
    bytes4 constant public CANCEL_ORDERS_UP_TO_SELECTOR = 0x4f9559b1;
    bytes4 constant public CANCEL_ORDERS_UP_TO_SELECTOR_GENERATOR = bytes4(keccak256("cancelOrdersUpTo(uint256)"));

    // cancelled
    bytes4 constant public CANCELLED_SELECTOR = 0x2ac12622;
    bytes4 constant public CANCELLED_SELECTOR_GENERATOR = bytes4(keccak256("cancelled(bytes32)"));

    // currentContextAddress
    bytes4 constant public CURRENT_CONTEXT_ADDRESS_SELECTOR = 0xeea086ba;
    bytes4 constant public CURRENT_CONTEXT_ADDRESS_SELECTOR_GENERATOR = bytes4(keccak256("currentContextAddress()"));

    // executeTransaction
    bytes4 constant public EXECUTE_TRANSACTION_SELECTOR = 0xbfc8bfce;
    bytes4 constant public EXECUTE_TRANSACTION_SELECTOR_GENERATOR = bytes4(keccak256("executeTransaction(uint256,address,bytes,bytes)"));

    // fillOrKillOrder
    bytes4 constant public FILL_OR_KILL_ORDER_SELECTOR = 0x64a3bc15;
    bytes4 constant public FILL_OR_KILL_ORDER_SELECTOR_GENERATOR = bytes4(keccak256("fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)"));

    // fillOrder
    bytes4 constant public FILL_ORDER_SELECTOR = 0xb4be83d5;
    bytes4 constant public FILL_ORDER_SELECTOR_GENERATOR = bytes4(keccak256("fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)"));

    // fillOrderNoThrow
    bytes4 constant public FILL_ORDER_NO_THROW_SELECTOR = 0x3e228bae;
    bytes4 constant public FILL_ORDER_NO_THROW_SELECTOR_GENERATOR = bytes4(keccak256("fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)"));

    // filled
    bytes4 constant public FILLED_SELECTOR = 0x288cdc91;
    bytes4 constant public FILLED_SELECTOR_GENERATOR = bytes4(keccak256("filled(bytes32)"));

    // getAssetProxy
    bytes4 constant public GET_ASSET_PROXY_SELECTOR = 0x60704108;
    bytes4 constant public GET_ASSET_PROXY_SELECTOR_GENERATOR = bytes4(keccak256("getAssetProxy(bytes4)"));

    // getOrderInfo
    bytes4 constant public GET_ORDER_INFO_SELECTOR = 0xc75e0a81;
    bytes4 constant public GET_ORDER_INFO_SELECTOR_GENERATOR = bytes4(keccak256("getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))"));

    // getOrdersInfo
    bytes4 constant public GET_ORDERS_INFO_SELECTOR = 0x7e9d74dc;
    bytes4 constant public GET_ORDERS_INFO_SELECTOR_GENERATOR = bytes4(keccak256("getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])"));

    // isValidSignature
    bytes4 constant public IS_VALID_SIGNATURE_SELECTOR = 0x93634702;
    bytes4 constant public IS_VALID_SIGNATURE_SELECTOR_GENERATOR = bytes4(keccak256("isValidSignature(bytes32,address,bytes)"));

    // marketBuyOrders
    bytes4 constant public MARKET_BUY_ORDERS_SELECTOR = 0xe5fa431b;
    bytes4 constant public MARKET_BUY_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])"));

    // marketBuyOrdersNoThrow
    bytes4 constant public MARKET_BUY_ORDERS_NO_THROW_SELECTOR = 0xa3e20380;
    bytes4 constant public MARKET_BUY_ORDERS_NO_THROW_SELECTOR_GENERATOR = bytes4(keccak256("marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])"));

    // marketSellOrders
    bytes4 constant public MARKET_SELL_ORDERS_SELECTOR = 0x7e1d9808;
    bytes4 constant public MARKET_SELL_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])"));

    // marketSellOrdersNoThrow
    bytes4 constant public MARKET_SELL_ORDERS_NO_THROW_SELECTOR = 0xdd1c7d18;
    bytes4 constant public MARKET_SELL_ORDERS_NO_THROW_SELECTOR_GENERATOR = bytes4(keccak256("marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])"));

    // matchOrders
    bytes4 constant public MATCH_ORDERS_SELECTOR = 0x3c28d861;
    bytes4 constant public MATCH_ORDERS_SELECTOR_GENERATOR = bytes4(keccak256("matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)"));

    // orderEpoch
    bytes4 constant public ORDER_EPOCH_SELECTOR = 0xd9bfa73e;
    bytes4 constant public ORDER_EPOCH_SELECTOR_GENERATOR = bytes4(keccak256("orderEpoch(address,address)"));

    // owner
    bytes4 constant public OWNER_SELECTOR = 0x8da5cb5b;
    bytes4 constant public OWNER_SELECTOR_GENERATOR = bytes4(keccak256("owner()"));

    // preSign
    bytes4 constant public PRE_SIGN_SELECTOR = 0x3683ef8e;
    bytes4 constant public PRE_SIGN_SELECTOR_GENERATOR = bytes4(keccak256("preSign(bytes32,address,bytes)"));

    // preSigned
    bytes4 constant public PRE_SIGNED_SELECTOR = 0x82c174d0;
    bytes4 constant public PRE_SIGNED_SELECTOR_GENERATOR = bytes4(keccak256("preSigned(bytes32,address)"));

    // registerAssetProxy
    bytes4 constant public REGISTER_ASSET_PROXY_SELECTOR = 0xc585bb93;
    bytes4 constant public REGISTER_ASSET_PROXY_SELECTOR_GENERATOR = bytes4(keccak256("registerAssetProxy(address)"));

    // setSignatureValidatorApproval
    bytes4 constant public SET_SIGNATURE_VALIDATOR_APPROVAL_SELECTOR = 0x77fcce68;
    bytes4 constant public SET_SIGNATURE_VALIDATOR_APPROVAL_SELECTOR_GENERATOR = bytes4(keccak256("setSignatureValidatorApproval(address,bool)"));

    // transactions
    bytes4 constant public TRANSACTIONS_SELECTOR = 0x642f2eaf;
    bytes4 constant public TRANSACTIONS_SELECTOR_GENERATOR = bytes4(keccak256("transactions(bytes32)"));

    // transferOwnership
    bytes4 constant public TRANSFER_OWNERSHIP_SELECTOR = 0xf2fde38b;
    bytes4 constant public TRANSFER_OWNERSHIP_SELECTOR_GENERATOR = bytes4(keccak256("transferOwnership(address)"));
}