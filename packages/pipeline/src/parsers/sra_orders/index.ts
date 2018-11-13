import { APIOrder, OrdersResponse } from '@0x/connect';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, ERC721AssetData } from '@0x/types';
import * as R from 'ramda';

import { SraOrder } from '../../entities';
import { bigNumbertoStringOrNull } from '../../utils';

/**
 * Parses a raw order response from an SRA endpoint and returns an array of
 * SraOrder entities.
 * @param rawOrdersResponse A raw order response from an SRA endpoint.
 */
export function parseSraOrders(rawOrdersResponse: OrdersResponse): SraOrder[] {
    return R.map(_convertToEntity, rawOrdersResponse.records);
}

/**
 * Converts a single APIOrder into an SraOrder entity.
 * @param apiOrder A single order from the response from an SRA endpoint.
 */
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
    sraOrder.lastUpdatedTimestamp = 0;
    sraOrder.firstSeenTimestamp = 0;

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
    // tslint has a false positive here. Type assertion is required.
    // tslint:disable-next-line:no-unnecessary-type-assertion
    sraOrder.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    sraOrder.rawTakerAssetData = apiOrder.order.takerAssetData;
    sraOrder.takerAssetType = takerAssetType;
    sraOrder.takerAssetProxyId = takerAssetData.assetProxyId;
    sraOrder.takerTokenAddress = takerAssetData.tokenAddress;
    // tslint:disable-next-line:no-unnecessary-type-assertion
    sraOrder.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);

    sraOrder.metadataJson = JSON.stringify(apiOrder.metaData);

    return sraOrder;
}
