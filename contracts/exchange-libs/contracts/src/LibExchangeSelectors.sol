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

    // allowedOrderValidators(address,address)
    bytes4 constant internal ALLOWED_ORDER_VALIDATORS_SELECTOR = 0x3a0a355b;

    // allowedValidators(address,address)
    bytes4 constant internal ALLOWED_VALIDATORS_SELECTOR = 0x7b8e3514;

    // assetProxies(bytes4)
    bytes4 constant internal ASSET_PROXIES_SELECTOR = 0x3fd3c997;

    // batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[])
    bytes4 constant internal BATCH_CANCEL_ORDERS_SELECTOR = 0xdedfc1f1;

    // batchExecuteTransactions((uint256,address,bytes)[],bytes[])
    bytes4 constant internal BATCH_EXECUTE_TRANSACTIONS_SELECTOR = 0x970d970c;

    // batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_ORDERS_SELECTOR = 0x9694a402;

    // batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_ORDERS_NO_THROW_SELECTOR = 0x8ea8dfe4;

    // batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256[],bytes[])
    bytes4 constant internal BATCH_FILL_OR_KILL_ORDERS_SELECTOR = 0xbeee2e14;

    // cancelled(bytes32)
    bytes4 constant internal CANCELLED_SELECTOR = 0x2ac12622;

    // cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal CANCEL_ORDER_SELECTOR = 0x2da62987;

    // cancelOrdersUpTo(uint256)
    bytes4 constant internal CANCEL_ORDERS_UP_TO_SELECTOR = 0x4f9559b1;

    // currentContextAddress()
    bytes4 constant internal CURRENT_CONTEXT_ADDRESS_SELECTOR = 0xeea086ba;

    // EIP712_EXCHANGE_DOMAIN_HASH()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_HASH_SELECTOR = 0xc26cfecd;

    // EIP712_EXCHANGE_DOMAIN_NAME()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_NAME_SELECTOR = 0x63c4e8cc;

    // EIP712_EXCHANGE_DOMAIN_VERSION()
    bytes4 constant internal EIP_712_EXCHANGE_DOMAIN_VERSION_SELECTOR = 0x0f01323b;

    // executeTransaction((uint256,address,bytes),bytes)
    bytes4 constant internal EXECUTE_TRANSACTION_SELECTOR = 0x965504f7;

    // filled(bytes32)
    bytes4 constant internal FILLED_SELECTOR = 0x288cdc91;

    // fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_ORDER_SELECTOR = 0x9b44d556;

    // fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_ORDER_NO_THROW_SELECTOR = 0x01da61ae;

    // fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),uint256,bytes)
    bytes4 constant internal FILL_OR_KILL_ORDER_SELECTOR = 0xe14b58c4;

    // getAssetProxy(bytes4)
    bytes4 constant internal GET_ASSET_PROXY_SELECTOR = 0x60704108;

    // getOrderHash((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal GET_ORDER_HASH_SELECTOR = 0xad3449bd;

    // getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes))
    bytes4 constant internal GET_ORDER_INFO_SELECTOR = 0x9d3fa4b9;

    // getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[])
    bytes4 constant internal GET_ORDERS_INFO_SELECTOR = 0x9dfac06d;

    // getTransactionHash((uint256,address,bytes))
    bytes4 constant internal GET_TRANSACTION_HASH_SELECTOR = 0x23872f55;

    // isValidHashSignature(bytes32,address,bytes)
    bytes4 constant internal IS_VALID_HASH_SIGNATURE_SELECTOR = 0x8171c407;

    // isValidOrderSignature((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),address,bytes)
    bytes4 constant internal IS_VALID_ORDER_SIGNATURE_SELECTOR = 0xf813e384;

    // marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_BUY_ORDERS_SELECTOR = 0xdb702a9c;

    // marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_BUY_ORDERS_NO_THROW_SELECTOR = 0x78d29ac1;

    // marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_SELL_ORDERS_SELECTOR = 0x52b3ca9e;

    // marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],uint256,bytes[])
    bytes4 constant internal MARKET_SELL_ORDERS_NO_THROW_SELECTOR = 0x369da099;

    // matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes),bytes,bytes)
    bytes4 constant internal MATCH_ORDERS_SELECTOR = 0x88ec79fb;

    // orderEpoch(address,address)
    bytes4 constant internal ORDER_EPOCH_SELECTOR = 0xd9bfa73e;

    // owner()
    bytes4 constant internal OWNER_SELECTOR = 0x8da5cb5b;

    // preSign(bytes32)
    bytes4 constant internal PRE_SIGN_SELECTOR = 0x46c02d7a;

    // preSigned(bytes32,address)
    bytes4 constant internal PRE_SIGNED_SELECTOR = 0x82c174d0;

    // registerAssetProxy(address)
    bytes4 constant internal REGISTER_ASSET_PROXY_SELECTOR = 0xc585bb93;

    // setOrderValidatorApproval(address,bool)
    bytes4 constant internal SET_ORDER_VALIDATOR_APPROVAL_SELECTOR = 0x5972957b;

    // setSignatureValidatorApproval(address,bool)
    bytes4 constant internal SET_SIGNATURE_VALIDATOR_APPROVAL_SELECTOR = 0x77fcce68;

    // transactions(bytes32)
    bytes4 constant internal TRANSACTIONS_SELECTOR = 0x642f2eaf;

    // transferOwnership(address)
    bytes4 constant internal TRANSFER_OWNERSHIP_SELECTOR = 0xf2fde38b;

    // VERSION()
    bytes4 constant internal VERSION_SELECTOR = 0xffa1ad74;
}