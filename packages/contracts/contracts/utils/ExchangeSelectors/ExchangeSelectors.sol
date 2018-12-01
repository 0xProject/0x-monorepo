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


contract ExchangeSelectors {
    // filled
    bytes4 constant filledSelector = 0x288cdc91;
    bytes4 constant filledSelectorGenerator = bytes4(keccak256('filled(bytes32)'));

    // batchFillOrders
    bytes4 constant batchFillOrdersSelector = 0x297bb70b;
    bytes4 constant batchFillOrdersSelectorGenerator = bytes4(keccak256('batchFillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])'));

    // cancelled
    bytes4 constant cancelledSelector = 0x2ac12622;
    bytes4 constant cancelledSelectorGenerator = bytes4(keccak256('cancelled(bytes32)'));

    // preSign
    bytes4 constant preSignSelector = 0x3683ef8e;
    bytes4 constant preSignSelectorGenerator = bytes4(keccak256('preSign(bytes32,address,bytes)'));

    // matchOrders
    bytes4 constant matchOrdersSelector = 0x3c28d861;
    bytes4 constant matchOrdersSelectorGenerator = bytes4(keccak256('matchOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),(address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),bytes,bytes)'));

    // fillOrderNoThrow
    bytes4 constant fillOrderNoThrowSelector = 0x3e228bae;
    bytes4 constant fillOrderNoThrowSelectorGenerator = bytes4(keccak256('fillOrderNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)'));

    // assetProxies
    bytes4 constant assetProxiesSelector = 0x3fd3c997;
    bytes4 constant assetProxiesSelectorGenerator = bytes4(keccak256('assetProxies(bytes4)'));

    // batchCancelOrders
    bytes4 constant batchCancelOrdersSelector = 0x4ac14782;
    bytes4 constant batchCancelOrdersSelectorGenerator = bytes4(keccak256('batchCancelOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])'));

    // batchFillOrKillOrders
    bytes4 constant batchFillOrKillOrdersSelector = 0x4d0ae546;
    bytes4 constant batchFillOrKillOrdersSelectorGenerator = bytes4(keccak256('batchFillOrKillOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])'));

    // cancelOrdersUpTo
    bytes4 constant cancelOrdersUpToSelector = 0x4f9559b1;
    bytes4 constant cancelOrdersUpToSelectorGenerator = bytes4(keccak256('cancelOrdersUpTo(uint256)'));

    // batchFillOrdersNoThrow
    bytes4 constant batchFillOrdersNoThrowSelector = 0x50dde190;
    bytes4 constant batchFillOrdersNoThrowSelectorGenerator = bytes4(keccak256('batchFillOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256[],bytes[])'));

    // getAssetProxy
    bytes4 constant getAssetProxySelector = 0x60704108;
    bytes4 constant getAssetProxySelectorGenerator = bytes4(keccak256('getAssetProxy(bytes4)'));

    // transactions
    bytes4 constant transactionsSelector = 0x642f2eaf;
    bytes4 constant transactionsSelectorGenerator = bytes4(keccak256('transactions(bytes32)'));

    // fillOrKillOrder
    bytes4 constant fillOrKillOrderSelector = 0x64a3bc15;
    bytes4 constant fillOrKillOrderSelectorGenerator = bytes4(keccak256('fillOrKillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)'));

    // setSignatureValidatorApproval
    bytes4 constant setSignatureValidatorApprovalSelector = 0x77fcce68;
    bytes4 constant setSignatureValidatorApprovalSelectorGenerator = bytes4(keccak256('setSignatureValidatorApproval(address,bool)'));

    // allowedValidators
    bytes4 constant allowedValidatorsSelector = 0x7b8e3514;
    bytes4 constant allowedValidatorsSelectorGenerator = bytes4(keccak256('allowedValidators(address,address)'));

    // marketSellOrders
    bytes4 constant marketSellOrdersSelector = 0x7e1d9808;
    bytes4 constant marketSellOrdersSelectorGenerator = bytes4(keccak256('marketSellOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])'));

    // getOrdersInfo
    bytes4 constant getOrdersInfoSelector = 0x7e9d74dc;
    bytes4 constant getOrdersInfoSelectorGenerator = bytes4(keccak256('getOrdersInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[])'));

    // preSigned
    bytes4 constant preSignedSelector = 0x82c174d0;
    bytes4 constant preSignedSelectorGenerator = bytes4(keccak256('preSigned(bytes32,address)'));

    // owner
    bytes4 constant ownerSelector = 0x8da5cb5b;
    bytes4 constant ownerSelectorGenerator = bytes4(keccak256('owner()'));

    // isValidSignature
    bytes4 constant isValidSignatureSelector = 0x93634702;
    bytes4 constant isValidSignatureSelectorGenerator = bytes4(keccak256('isValidSignature(bytes32,address,bytes)'));

    // marketBuyOrdersNoThrow
    bytes4 constant marketBuyOrdersNoThrowSelector = 0xa3e20380;
    bytes4 constant marketBuyOrdersNoThrowSelectorGenerator = bytes4(keccak256('marketBuyOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])'));

    // fillOrder
    bytes4 constant fillOrderSelector = 0xb4be83d5;
    bytes4 constant fillOrderSelectorGenerator = bytes4(keccak256('fillOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes),uint256,bytes)'));

    // executeTransaction
    bytes4 constant executeTransactionSelector = 0xbfc8bfce;
    bytes4 constant executeTransactionSelectorGenerator = bytes4(keccak256('executeTransaction(uint256,address,bytes,bytes)'));

    // registerAssetProxy
    bytes4 constant registerAssetProxySelector = 0xc585bb93;
    bytes4 constant registerAssetProxySelectorGenerator = bytes4(keccak256('registerAssetProxy(address)'));

    // getOrderInfo
    bytes4 constant getOrderInfoSelector = 0xc75e0a81;
    bytes4 constant getOrderInfoSelectorGenerator = bytes4(keccak256('getOrderInfo((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))'));

    // cancelOrder
    bytes4 constant cancelOrderSelector = 0xd46b02c3;
    bytes4 constant cancelOrderSelectorGenerator = bytes4(keccak256('cancelOrder((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes))'));

    // orderEpoch
    bytes4 constant orderEpochSelector = 0xd9bfa73e;
    bytes4 constant orderEpochSelectorGenerator = bytes4(keccak256('orderEpoch(address,address)'));

    // ZRX_ASSET_DATA
    bytes4 constant ZRX_ASSET_DATASelector = 0xdb123b1a;
    bytes4 constant ZRX_ASSET_DATASelectorGenerator = bytes4(keccak256('ZRX_ASSET_DATA()'));

    // marketSellOrdersNoThrow
    bytes4 constant marketSellOrdersNoThrowSelector = 0xdd1c7d18;
    bytes4 constant marketSellOrdersNoThrowSelectorGenerator = bytes4(keccak256('marketSellOrdersNoThrow((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])'));

    // EIP712_DOMAIN_HASH
    bytes4 constant EIP712_DOMAIN_HASHSelector = 0xe306f779;
    bytes4 constant EIP712_DOMAIN_HASHSelectorGenerator = bytes4(keccak256('EIP712_DOMAIN_HASH()'));

    // marketBuyOrders
    bytes4 constant marketBuyOrdersSelector = 0xe5fa431b;
    bytes4 constant marketBuyOrdersSelectorGenerator = bytes4(keccak256('marketBuyOrders((address,address,address,address,uint256,uint256,uint256,uint256,uint256,uint256,bytes,bytes)[],uint256,bytes[])'));

    // currentContextAddress
    bytes4 constant currentContextAddressSelector = 0xeea086ba;
    bytes4 constant currentContextAddressSelectorGenerator = bytes4(keccak256('currentContextAddress()'));

    // transferOwnership
    bytes4 constant transferOwnershipSelector = 0xf2fde38b;
    bytes4 constant transferOwnershipSelectorGenerator = bytes4(keccak256('transferOwnership(address)'));

    // VERSION
    bytes4 constant VERSIONSelector = 0xffa1ad74;
    bytes4 constant VERSIONSelectorGenerator = bytes4(keccak256('VERSION()'));
}