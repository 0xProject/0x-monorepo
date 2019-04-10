import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

import { maybeBigNumberUtil } from './maybe_big_number';

const coerceBigNumberOrString = (value: any): BigNumber => {
    const bn = maybeBigNumberUtil.toMaybeBigNumber(value);
    return !!bn ? bn : value;
};

// function implies that the signed order already has been validated
export const orderCoercionUtil = {
    // coerces order big number values to the BigNumber version utilized by 0x
    coerceFieldsToBigNumbers(obj: any, fields: string[]): any {
        const result = _.assign({}, obj);
        _.each(fields, field => {
            _.update(result, field, (value: string) => {
                if (value === undefined) {
                    throw new Error(`Could not find field '${field}' while converting fields to BigNumber.`);
                }
                return coerceBigNumberOrString(value);
            });
        });
        return result;
    },

    coerceOrderFieldsToBigNumber: (order: any): any => {
        return orderCoercionUtil.coerceFieldsToBigNumbers(order, [
            'makerFee',
            'takerFee',
            'makerAssetAmount',
            'takerAssetAmount',
            'salt',
            'expirationTimeSeconds',
        ]);
    },
    coerceOrderArrayFieldsToBigNumber: (orders: any[]): any[] => {
        return _.map(orders, (value: any) => {
            return orderCoercionUtil.coerceOrderFieldsToBigNumber(value);
        });
    },
};
