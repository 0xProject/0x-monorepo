import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';

import { OrderConfigResponse, OrderbookResponse, TokenPairsItem } from '../types';

import { typeConverters } from './type_converters';

export const relayerResponseJsonParsers = {
    parseTokenPairsJson(json: any): TokenPairsItem[] {
        assert.doesConformToSchema('assetDataPairs', json, schemas.relayerApiTokenPairsResponseSchema);
        return json.map((assetDataPair: any) => {
            return typeConverters.convertStringsFieldsToBigNumbers(assetDataPair, [
                'assetDataA.minAmount',
                'assetDataA.maxAmount',
                'assetDataB.minAmount',
                'assetDataB.maxAmount',
            ]);
        });
    },
    parseOrdersJson(json: any): SignedOrder[] {
        assert.doesConformToSchema('orders', json, schemas.signedOrdersSchema);
        return json.map((order: object) => typeConverters.convertOrderStringFieldsToBigNumber(order));
    },
    parseOrderJson(json: any): SignedOrder {
        assert.doesConformToSchema('order', json, schemas.signedOrderSchema);
        return typeConverters.convertOrderStringFieldsToBigNumber(json);
    },
    parseOrderbookResponseJson(json: any): OrderbookResponse {
        assert.doesConformToSchema('orderBook', json, schemas.relayerApiOrderBookResponseSchema);
        return typeConverters.convertOrderbookStringFieldsToBigNumber(json);
    },
    parseOrderConfigResponseJson(json: any): OrderConfigResponse {
        assert.doesConformToSchema('fees', json, schemas.relayerApiOrderConfigResponseSchema);
        return typeConverters.convertStringsFieldsToBigNumbers(json, ['makerFee', 'takerFee']);
    },
};
