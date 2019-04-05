import { BigNumber } from '@0x/utils';
import * as _ from 'lodash';

export const orderParsingUtils = {
    convertStringsFieldsToBigNumbers(obj: any, fields: string[]): any {
        const result = _.assign({}, obj);
        _.each(fields, field => {
            _.update(result, field, (value: string) => {
                if (value === undefined) {
                    throw new Error(`Could not find field '${field}' while converting string fields to BigNumber.`);
                }
                return new BigNumber(value);
            });
        });
        return result;
    },
    convertOrderStringFieldsToBigNumber(order: any): any {
        return orderParsingUtils.convertStringsFieldsToBigNumbers(order, [
            'makerAssetAmount',
            'takerAssetAmount',
            'makerFee',
            'takerFee',
            'expirationTimeSeconds',
            'salt',
        ]);
    },
};
