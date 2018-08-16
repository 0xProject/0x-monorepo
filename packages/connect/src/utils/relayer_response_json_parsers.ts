import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';

import { APIOrder, AssetPairsItem, AssetPairsResponse, OrderbookResponse, OrderConfigResponse, OrdersResponse } from '../types';

import { typeConverters } from './type_converters';

export const relayerResponseJsonParsers = {
    parseAssetDataPairsJson(json: any): AssetPairsResponse {
        assert.doesConformToSchema('assetDataPairsResponse', json, schemas.relayerApiAssetDataPairsResponseSchema);
        return { ...json, records: relayerResponseJsonParsers.parseAssetPairsItemsJson(json.records) };
    },
    parseAssetPairsItemsJson(json: any): AssetPairsItem[] {
        return json.map((assetDataPair: any) => {
            return typeConverters.convertStringsFieldsToBigNumbers(assetDataPair, [
                'assetDataA.minAmount',
                'assetDataA.maxAmount',
                'assetDataB.minAmount',
                'assetDataB.maxAmount',
            ]);
        });
    },
    parseOrdersJson(json: any): OrdersResponse {
        assert.doesConformToSchema('relayerApiOrdersResponse', json, schemas.relayerApiOrdersResponseSchema);
        return { ...json, records: json.records.map(relayerResponseJsonParsers.parseAPIOrderJson.bind(relayerResponseJsonParsers)) };
    },
    parseAPIOrderJson(json: any): APIOrder {
        assert.doesConformToSchema('relayerApiOrder', json, schemas.relayerApiOrderSchema);
        return typeConverters.convertAPIOrderStringFieldsToBigNumber(json);
    },
    parseOrderbookResponseJson(json: any): OrderbookResponse {
        assert.doesConformToSchema('orderBookResponse', json, schemas.relayerApiOrderbookResponseSchema);
        return typeConverters.convertOrderbookStringFieldsToBigNumber(json);
    },
    parseOrderConfigResponseJson(json: any): OrderConfigResponse {
        assert.doesConformToSchema('orderConfigResponse', json, schemas.relayerApiOrderConfigResponseSchema);
        return typeConverters.convertStringsFieldsToBigNumbers(json, ['makerFee', 'takerFee']);
    },
};
