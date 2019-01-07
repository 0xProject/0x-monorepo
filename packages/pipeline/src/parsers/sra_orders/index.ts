import { APIOrder, OrdersResponse } from '@0x/connect';
import { assetDataUtils, orderHashUtils } from '@0x/order-utils';
import { AssetProxyId, ERC20AssetData, ERC721AssetData } from '@0x/types';
import * as R from 'ramda';

import { SraOrder } from '../../entities';
import { bigNumbertoStringOrNull, convertAssetProxyIdToType } from '../../utils';

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
    const takerAssetData = assetDataUtils.decodeAssetDataOrThrow(apiOrder.order.takerAssetData);

    const sraOrder = new SraOrder();
    sraOrder.exchangeAddress = apiOrder.order.exchangeAddress;
    sraOrder.orderHashHex = orderHashUtils.getOrderHashHex(apiOrder.order);

    sraOrder.makerAddress = apiOrder.order.makerAddress;
    sraOrder.takerAddress = apiOrder.order.takerAddress;
    sraOrder.feeRecipientAddress = apiOrder.order.feeRecipientAddress;
    sraOrder.senderAddress = apiOrder.order.senderAddress;
    sraOrder.makerAssetAmount = apiOrder.order.makerAssetAmount;
    sraOrder.takerAssetAmount = apiOrder.order.takerAssetAmount;
    sraOrder.makerFee = apiOrder.order.makerFee;
    sraOrder.takerFee = apiOrder.order.takerFee;
    sraOrder.expirationTimeSeconds = apiOrder.order.expirationTimeSeconds;
    sraOrder.salt = apiOrder.order.salt;
    sraOrder.signature = apiOrder.order.signature;

    sraOrder.rawMakerAssetData = apiOrder.order.makerAssetData;
    sraOrder.makerAssetType = convertAssetProxyIdToType(makerAssetData.assetProxyId as AssetProxyId);
    sraOrder.makerAssetProxyId = makerAssetData.assetProxyId;
    // HACK(abandeali1): this event schema currently does not support multiple maker/taker assets, so we store a null byte array when decoding assetData from the MultiAssetProxy
    sraOrder.makerTokenAddress =
        makerAssetData.assetProxyId === AssetProxyId.MultiAsset
            ? '0x'
            : (makerAssetData as ERC20AssetData | ERC721AssetData).tokenAddress;
    // tslint has a false positive here. Type assertion is required.
    // tslint:disable-next-line:no-unnecessary-type-assertion
    sraOrder.makerTokenId = bigNumbertoStringOrNull((makerAssetData as ERC721AssetData).tokenId);
    sraOrder.rawTakerAssetData = apiOrder.order.takerAssetData;
    sraOrder.takerAssetType = convertAssetProxyIdToType(takerAssetData.assetProxyId as AssetProxyId);
    sraOrder.takerAssetProxyId = takerAssetData.assetProxyId;
    // HACK(abandeali1): this event schema currently does not support multiple maker/taker assets, so we store a null byte array when decoding assetData from the MultiAssetProxy
    sraOrder.takerTokenAddress =
        makerAssetData.assetProxyId === AssetProxyId.MultiAsset
            ? '0x'
            : (takerAssetData as ERC20AssetData | ERC721AssetData).tokenAddress;
    // tslint:disable-next-line:no-unnecessary-type-assertion
    sraOrder.takerTokenId = bigNumbertoStringOrNull((takerAssetData as ERC721AssetData).tokenId);

    sraOrder.metadataJson = JSON.stringify(apiOrder.metaData);

    return sraOrder;
}
