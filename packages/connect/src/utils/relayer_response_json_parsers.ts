import { assert } from '@0xproject/assert';
import { schemas } from '@0xproject/json-schemas';
import { SignedOrder } from '@0xproject/types';

import { FeesResponse, OrderbookResponse, TokenPairsItem } from '../types';

import { typeConverters } from './type_converters';

export const relayerResponseJsonParsers = {
    parseTokenPairsJson(json: any): TokenPairsItem[] {
        assert.doesConformToSchema('tokenPairs', json, schemas.relayerApiTokenPairsResponseSchema);
        return json.map((tokenPair: any) => {
            return typeConverters.convertStringsFieldsToBigNumbers(tokenPair, [
                'tokenA.minAmount',
                'tokenA.maxAmount',
                'tokenB.minAmount',
                'tokenB.maxAmount',
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
    parseFeesResponseJson(json: any): FeesResponse {
        assert.doesConformToSchema('fees', json, schemas.relayerApiFeesResponseSchema);
        return typeConverters.convertStringsFieldsToBigNumbers(json, ['makerFee', 'takerFee']);
    },
};
