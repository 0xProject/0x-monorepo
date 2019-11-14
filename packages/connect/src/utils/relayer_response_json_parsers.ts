import { assert } from '@0x/assert';
import { schemas } from '@0x/json-schemas';
import {
    APIOrder,
    AssetPairsItem,
    AssetPairsResponse,
    OrderbookResponse,
    OrderConfigResponse,
    OrdersResponse,
} from '@0x/types';

import { orderParsingUtils } from './order_parsing_utils';
import { typeConverters } from './type_converters';

export const relayerResponseJsonParsers = {
    parseAssetDataPairsJson(json: any): AssetPairsResponse {
        assert.doesConformToSchema('assetDataPairsResponse', json, schemas.relayerApiAssetDataPairsResponseSchema);
        return { ...json, records: relayerResponseJsonParsers.parseAssetPairsItemsJson(json.records) };
    },
    parseAssetPairsItemsJson(json: any): AssetPairsItem[] {
        return json.map((assetDataPair: any) => {
            return orderParsingUtils.convertStringsFieldsToBigNumbers(assetDataPair, [
                'assetDataA.minAmount',
                'assetDataA.maxAmount',
                'assetDataB.minAmount',
                'assetDataB.maxAmount',
            ]);
        });
    },
    parseOrdersJson(json: any): OrdersResponse {
        assert.doesConformToSchema('relayerApiOrdersResponse', json, schemas.relayerApiOrdersResponseSchema);
        return { ...json, records: relayerResponseJsonParsers.parseAPIOrdersJson(json.records) };
    },
    parseAPIOrdersJson(json: any): APIOrder[] {
        return json.map(relayerResponseJsonParsers.parseAPIOrderJson.bind(relayerResponseJsonParsers));
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
        return orderParsingUtils.convertStringsFieldsToBigNumbers(json, ['makerFee', 'takerFee']);
    },
};
