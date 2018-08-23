import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

import { APIOrder } from '../types';

export const typeConverters = {
    convertOrderbookStringFieldsToBigNumber(orderbook: any): any {
        const bids = _.get(orderbook, 'bids', []);
        const asks = _.get(orderbook, 'asks', []);
        const convertedBids = {
            ...bids,
            records: bids.records.map((order: any) => typeConverters.convertAPIOrderStringFieldsToBigNumber(order)),
        };
        const convertedAsks = {
            ...asks,
            records: asks.records.map((order: any) => typeConverters.convertAPIOrderStringFieldsToBigNumber(order)),
        };
        return {
            bids: convertedBids,
            asks: convertedAsks,
        };
    },
    convertAPIOrderStringFieldsToBigNumber(apiOrder: any): APIOrder {
        return { ...apiOrder, order: typeConverters.convertOrderStringFieldsToBigNumber(apiOrder.order) };
    },
    convertOrderStringFieldsToBigNumber(order: any): any {
        return typeConverters.convertStringsFieldsToBigNumbers(order, [
            'makerAssetAmount',
            'takerAssetAmount',
            'makerFee',
            'takerFee',
            'expirationTimeSeconds',
            'salt',
        ]);
    },
    convertStringsFieldsToBigNumbers(obj: any, fields: string[]): any {
        const result = _.assign({}, obj);
        _.each(fields, field => {
            _.update(result, field, (value: string) => {
                if (_.isUndefined(value)) {
                    throw new Error(`Could not find field '${field}' while converting string fields to BigNumber.`);
                }
                return new BigNumber(value);
            });
        });
        return result;
    },
};
