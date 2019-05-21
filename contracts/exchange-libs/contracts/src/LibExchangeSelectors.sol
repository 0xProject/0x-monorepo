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


contract LibExchangeSelectors {
    // solhint-disable max-line-length

    // function allowedOrderValidators(address,address)
    bytes4 constant internal ALLOWED_ORDER_VALIDATORS_SELECTOR = 0x3a0a355b;

    // function allowedValidators(address,address)
    bytes4 constant internal ALLOWED_VALIDATORS_SELECTOR = 0x7b8e3514;

    // function assetProxies(bytes4)
    bytes4 constant internal ASSET_PROXIES_SELECTOR = 0x3fd3c997;

    // function batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[])
    bytes4 constant internal BATCH_CANCEL_ORDERS_SELECTOR = 0xdedfc1f1;

    // function batchExecuteTransactions((uint256,address,bytes)[],bytes[])
    bytes4 constant internal BATCH_EXECUTE_TRANSACTIONS_SELECTOR = 0x970d970c;

    // function batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_ORDERS_SELECTOR = 0x9694a402;

    // function batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_ORDERS_NO_THROW_SELECTOR = 0x8ea8dfe4;

    // function batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_OR_KILL_ORDERS_SELECTOR = 0xbeee2e14;

    // function cancelled(bytes32)
    bytes4 constant internal CANCELLED_SELECTOR = 0x2ac12622;

    // function cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal CANCEL_ORDER_SELECTOR = 0x2da62987;

    // function cancelOrdersUpTo(uint256)
    bytes4 constant internal CANCEL_ORDERS_UP_TO_SELECTOR = 0x4f9559b1;

    // function currentContextAddress()
    bytes4 constant internal CURRENT_CONTEXT_ADDRESS_SELECTOR = 0xeea086ba;

    // function EIP712_EXCHANGE_DOMAIN_HASH()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_HASH_SELECTOR = 0xc26cfecd;

    // function EIP712_EXCHANGE_DOMAIN_NAME()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_NAME_SELECTOR = 0x63c4e8cc;

    // function EIP712_EXCHANGE_DOMAIN_VERSION()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_VERSION_SELECTOR = 0x0f01323b;

    // function executeTransaction((uint256,address,bytes),bytes)
    bytes4 constant internal EXECUTE_TRANSACTION_SELECTOR = 0x965504f7;

    // function filled(bytes32)
    bytes4 constant internal FILLED_SELECTOR = 0x288cdc91;

    // function fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_ORDER_SELECTOR = 0x9b44d556;

    // function fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_ORDER_NO_THROW_SELECTOR = 0x01da61ae;

    // function fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_OR_KILL_ORDER_SELECTOR = 0xe14b58c4;

    // function getAssetProxy(bytes4)
    bytes4 constant internal GET_ASSET_PROXY_SELECTOR = 0x60704108;

    // function getOrderHash((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal GET_ORDER_HASH_SELECTOR = 0xad3449bd;

    // function getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal GET_ORDER_INFO_SELECTOR = 0x9d3fa4b9;

    // function getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[])
    bytes4 constant internal GET_ORDERS_INFO_SELECTOR = 0x9dfac06d;

    // function getTransactionHash((uint256,address,bytes))
    bytes4 constant internal GET_TRANSACTION_HASH_SELECTOR = 0x23872f55;

    // function isValidHashSignature(bytes32,address,bytes)
    bytes4 constant internal IS_VALID_HASH_SIGNATURE_SELECTOR = 0x8171c407;

    // function isValidOrderSignature((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,bytes)
    bytes4 constant internal IS_VALID_ORDER_SIGNATURE_SELECTOR = 0xf813e384;

    // function marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_BUY_ORDERS_SELECTOR = 0xdb702a9c;

    // function marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_BUY_ORDERS_NO_THROW_SELECTOR = 0x78d29ac1;

    // function marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_SELL_ORDERS_SELECTOR = 0x52b3ca9e;

    // function marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_SELL_ORDERS_NO_THROW_SELECTOR = 0x369da099;

    // function matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes,bytes)
    bytes4 constant internal MATCH_ORDERS_SELECTOR = 0x88ec79fb;

    // function orderEpoch(address,address)
    bytes4 constant internal ORDER_EPOCH_SELECTOR = 0xd9bfa73e;

    // function owner()
    bytes4 constant internal OWNER_SELECTOR = 0x8da5cb5b;

    // function preSign(bytes32)
    bytes4 constant internal PRE_SIGN_SELECTOR = 0x46c02d7a;

    // function preSigned(bytes32,address)
    bytes4 constant internal PRE_SIGNED_SELECTOR = 0x82c174d0;

    // function registerAssetProxy(address)
    bytes4 constant internal REGISTER_ASSET_PROXY_SELECTOR = 0xc585bb93;

    // function setOrderValidatorApproval(address,bool)
    bytes4 constant internal SET_ORDER_VALIDATOR_APPROVAL_SELECTOR = 0x5972957b;

    // function setSignatureValidatorApproval(address,bool)
    bytes4 constant internal SET_SIGNATURE_VALIDATOR_APPROVAL_SELECTOR = 0x77fcce68;

    // function transactions(bytes32)
    bytes4 constant internal TRANSACTIONS_SELECTOR = 0x642f2eaf;

    // function transferOwnership(address)
    bytes4 constant internal TRANSFER_OWNERSHIP_SELECTOR = 0xf2fde38b;

    // function VERSION()
    bytes4 constant internal VERSION_SELECTOR = 0xffa1ad74;

    // event AssetProxyRegistered(bytes4,address)
    bytes32 constant internal EVENT_ASSETPROXYREGISTERED_SELECTOR = 0xd2c6b762299c609bdb96520b58a49bfb80186934d4f71a86a367571a15c03194;

    // event Cancel(address,address,address,bytes32,bytes,bytes)
    bytes32 constant internal EVENT_CANCEL_SELECTOR = 0xdc47b3613d9fe400085f6dbdc99453462279057e6207385042827ed6b1a62cf7;

    // event CancelUpTo(address,address,uint256)
    bytes32 constant internal EVENT_CANCELUPTO_SELECTOR = 0x82af639571738f4ebd4268fb0363d8957ebe1bbb9e78dba5ebd69eed39b154f0;

    // event Fill(address,address,address,address,uint256,uint256,uint256,uint256,bytes32,bytes,bytes,bytes,bytes)
    bytes32 constant internal EVENT_FILL_SELECTOR = 0xcb32b586b1d019abfd3dfc2d45e7275f145185e9d53359e9b99521ca88cea0e8;

    // event SignatureValidatorApproval(address,address,bool)
    bytes32 constant internal EVENT_SIGNATUREVALIDATORAPPROVAL_SELECTOR = 0xa8656e308026eeabce8f0bc18048433252318ab80ac79da0b3d3d8697dfba891;
}
