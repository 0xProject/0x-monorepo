import { APIOrder, OrdersResponse } from '@0xproject/connect';
import { assetDataUtils, orderHashUtils } from '@0xproject/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0xproject/types';
import * as R from 'ramda';

import { SraOrder } from '../../entities/SraOrder';
import { bigNumbertoStringOrNull } from '../../utils';

export function parseSraOrders(rawOrdersResponse: OrdersResponse): SraOrder[] {
    return R.map(_convertToEntity, rawOrdersResponse.records);
}

export function _convertToEntity(apiOrder: APIOrder): SraOrder {
    // TODO(albrow): refactor out common asset data decoding code.
    const makerAssetData = assetDataUtils.decodeAssetDataOrThrow(apiOrder.order.makerAssetData);
    const makerAssetType = makerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';
    const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(apiOrder.order.takerAssetData);
    const takerAssetType = takerAssetData.assetProxyId === AssetProxyId.ERC20 ? 'erc20' : 'erc721';

    const sraOrder = new SraOrder();
    sraOrder.exchangeAddress = apiOrder.order.exchangeAddress;
    sraOrder.orderHashHex = orderHashUtils.getOrderHashHex(apiOrder.order);

    // TODO(albrow): Set these fields to the correct values upstack.
    sraOrder.lastUpdatedTimestamp = Date.now();
    sraOrder.firstSeenTimestamp = Date.now();

    sraOrder.makerAddress = apiOrder.order.makerAddress;
    sraOrder.takerAddress = apiOrder.order.takerAddress;
    sraOrder.feeRecipientAddress = apiOrder.order.feeRecipientAddress;
    sraOrder.senderAddress = apiOrder.order.senderAddress;
    sraOrder.makerAssetAmount = apiOrder.order.makerAssetAmount.toString();
    sraOrder.takerAssetAmount = apiOrder.order.takerAssetAmount.toString();
    sraOrder.makerFee = apiOrder.order.makerFee.toString();
    sraOrder.takerFee = apiOrder.order.takerFee.toString();
    sraOrder.expirationTimeSeconds = apiOrder.order.expirationTimeSeconds.toString();
    sraOrder.salt = apiOrder.order.salt.toString();
    sraOrder.signature = apiOrder.order.signature;

    sraOrder.rawMakerAssetData = apiOrder.order.makerAssetData;
    sraOrder.makerAssetType = makerAssetType;
    sraOrder.makerAssetProxyId = makerAssetData.assetProxyId;
    sraOrder.makerTokenAddress = makerAssetData.tokenAddress;
    sraOrder.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    sraOrder.rawTakerAssetData = apiOrder.order.takerAssetData;
    sraOrder.takerAssetType = takerAssetType;
    sraOrder.takerAssetProxyId = takerAssetData.assetProxyId;
    sraOrder.takerTokenAddress = takerAssetData.tokenAddress;
    sraOrder.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);

    sraOrder.metaDataJson = JSON.stringify(apiOrder.metaData);

    return sraOrder;
}
