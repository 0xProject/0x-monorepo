import { orderParsingUtils } from '@0xproject/order-utils';
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
        return { ...apiOrder, order: orderParsingUtils.convertOrderStringFieldsToBigNumber(apiOrder.order) };
    },
};
