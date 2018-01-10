import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

export const typeConverters = {
    convertOrderbookStringFieldsToBigNumber(orderbook: any): any {
        const bids = _.get(orderbook, 'bids', []);
        const asks = _.get(orderbook, 'asks', []);
        return {
            bids: bids.map((order: any) => this.convertOrderStringFieldsToBigNumber(order)),
            asks: asks.map((order: any) => this.convertOrderStringFieldsToBigNumber(order)),
        };
    },
    convertOrderStringFieldsToBigNumber(order: any): any {
        return this.convertStringsFieldsToBigNumbers(order, [
            'makerTokenAmount',
            'takerTokenAmount',
            'makerFee',
            'takerFee',
            'expirationUnixTimestampSec',
            'salt',
        ]);
    },
    convertStringsFieldsToBigNumbers(obj: any, fields: string[]): any {
        const result = _.assign({}, obj);
        _.each(fields, field => {
            _.update(result, field, (value: string) => new BigNumber(value));
        });
        return result;
    },
};
