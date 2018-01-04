import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

// TODO: convert all of these to non-mutating, pure functions
export const typeConverters = {
    convertOrderbookStringFieldsToBigNumber(orderbook: object): void {
        _.each(orderbook, (orders: object[]) => {
            _.each(orders, (order: object) => this.convertOrderStringFieldsToBigNumber(order));
        });
    },
    convertOrderStringFieldsToBigNumber(order: object): void {
        this.convertStringsFieldsToBigNumbers(order, [
            'makerTokenAmount',
            'takerTokenAmount',
            'makerFee',
            'takerFee',
            'expirationUnixTimestampSec',
            'salt',
        ]);
    },
    convertBigNumberFieldsToStrings(obj: object, fields: string[]): void {
        _.each(fields, field => {
            _.update(obj, field, (value: BigNumber) => value.toString());
        });
    },
    convertStringsFieldsToBigNumbers(obj: object, fields: string[]): void {
        _.each(fields, field => {
            _.update(obj, field, (value: string) => new BigNumber(value));
        });
    },
};
