import * as _ from 'lodash';

export const utils = {
    isBigNumber(value: any): boolean {
        const isBigNumber = _.isObject(value) && (value as any).isBigNumber;
        return isBigNumber;
    },
};
